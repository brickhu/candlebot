# OAuth集成指南

## 当前问题
前端OAuth配置已完成，但后端缺少OAuth端点，导致登录无法使用。

## 后端需要修改的文件

### 1. 修改用户模型 (`backend/models.py`)
在`User`类中添加OAuth相关字段：

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # 改为可为空，OAuth用户没有密码
    username = Column(String(100))
    avatar_url = Column(Text)
    plan_type = Column(String(50), default="free")
    quota_total = Column(Integer, default=5)
    quota_used = Column(Integer, default=0)
    quota_reset_date = Column(DateTime)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)

    # 新增OAuth字段
    provider = Column(String(50), nullable=True)  # google, github, 或 None（邮箱注册）
    provider_id = Column(String(255), nullable=True, index=True)  # 第三方平台用户ID
    oauth_metadata = Column(JSON, nullable=True)  # OAuth原始数据

    # 关系
    analyses = relationship("AnalysisRecord", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("PaymentRecord", back_populates="user", cascade="all, delete-orphan")
```

### 2. 修改数据模式 (`backend/schemas.py`)
添加OAuth相关的数据模式：

```python
# 在UserCreate之后添加
class OAuthUserCreate(BaseModel):
    """OAuth用户创建模型"""
    email: EmailStr
    username: Optional[str] = None
    password: Optional[str] = None  # OAuth用户没有密码
    provider: str  # google, github
    provider_id: str  # 第三方平台的用户ID
    avatar_url: Optional[str] = None
    oauth_metadata: Optional[Dict[str, Any]] = None

# 修改UserInDB以包含OAuth字段
class UserInDB(UserBase):
    id: int
    plan_type: str
    quota_total: int
    quota_used: int
    quota_remaining: int
    settings: Dict[str, Any]
    created_at: datetime
    last_login_at: Optional[datetime]
    is_active: bool
    provider: Optional[str] = None
    provider_id: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True
```

### 3. 创建OAuth路由 (`backend/routers/oauth.py`)
创建新的OAuth路由文件：

```python
"""
OAuth认证路由
"""
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
from sqlalchemy.orm import Session

import models
import schemas
import auth
from database import get_db

router = APIRouter(prefix="/auth/oauth", tags=["oauth"])

# 环境变量
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

# 数据模型
class OAuthCallback(BaseModel):
    code: str
    redirect_uri: str

def create_or_get_oauth_user(db: Session, oauth_user: schemas.OAuthUserCreate):
    """创建或获取OAuth用户"""
    # 首先通过provider_id查找用户
    existing_user = db.query(models.User).filter(
        models.User.provider == oauth_user.provider,
        models.User.provider_id == oauth_user.provider_id
    ).first()

    if existing_user:
        # 更新最后登录时间
        from datetime import datetime
        existing_user.last_login_at = datetime.utcnow()
        existing_user.avatar_url = oauth_user.avatar_url or existing_user.avatar_url
        db.commit()
        db.refresh(existing_user)
        return existing_user

    # 如果没有通过provider_id找到，尝试通过邮箱查找
    if oauth_user.email:
        existing_user_by_email = db.query(models.User).filter(
            models.User.email == oauth_user.email
        ).first()

        if existing_user_by_email:
            # 如果找到邮箱相同的用户，更新为OAuth用户
            existing_user_by_email.provider = oauth_user.provider
            existing_user_by_email.provider_id = oauth_user.provider_id
            existing_user_by_email.password_hash = None  # OAuth用户不需要密码
            existing_user_by_email.avatar_url = oauth_user.avatar_url or existing_user_by_email.avatar_url
            existing_user_by_email.last_login_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_user_by_email)
            return existing_user_by_email

    # 创建新用户
    db_user = models.User(
        email=oauth_user.email,
        username=oauth_user.username or oauth_user.email.split("@")[0],
        password_hash=None,  # OAuth用户没有密码
        avatar_url=oauth_user.avatar_url,
        plan_type="free",
        quota_total=5,
        quota_used=0,
        settings={},
        provider=oauth_user.provider,
        provider_id=oauth_user.provider_id,
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/google/callback")
async def google_oauth_callback(data: OAuthCallback, db: Session = Depends(get_db)):
    """Google OAuth回调端点"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth未配置")

    try:
        # 1. 使用授权码交换access token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": data.code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": data.redirect_uri,
            "grant_type": "authorization_code"
        }

        async with httpx.AsyncClient() as client:
            # 获取access token
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_info = token_response.json()
            access_token = token_info["access_token"]

            # 2. 使用access token获取用户信息
            userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            userinfo_response = await client.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            google_user = userinfo_response.json()

        # 3. 提取用户信息
        provider_id = f"google_{google_user['id']}"
        email = google_user["email"]
        username = google_user.get("name", email.split("@")[0])
        avatar_url = google_user.get("picture")

        # 4. 创建OAuth用户数据
        oauth_user = schemas.OAuthUserCreate(
            email=email,
            username=username,
            provider="google",
            provider_id=provider_id,
            avatar_url=avatar_url,
            oauth_metadata=google_user
        )

        # 5. 创建或获取用户
        user = create_or_get_oauth_user(db, oauth_user)

        # 6. 创建JWT令牌
        from datetime import timedelta
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = auth.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )

        # 7. 返回响应
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "expires_in": access_token_expires.total_seconds(),
            "user": schemas.UserInDB.from_orm(user)
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"Google OAuth错误: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")

@router.post("/github/callback")
async def github_oauth_callback(data: OAuthCallback, db: Session = Depends(get_db)):
    """GitHub OAuth回调端点"""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth未配置")

    try:
        # 1. 使用授权码交换access token
        token_url = "https://github.com/login/oauth/access_token"
        token_data = {
            "code": data.code,
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "redirect_uri": data.redirect_uri
        }
        headers = {"Accept": "application/json"}

        async with httpx.AsyncClient() as client:
            # 获取access token
            token_response = await client.post(token_url, data=token_data, headers=headers)
            token_response.raise_for_status()
            token_info = token_response.json()
            access_token = token_info["access_token"]

            # 2. 获取用户信息
            userinfo_url = "https://api.github.com/user"
            emails_url = "https://api.github.com/user/emails"
            headers = {"Authorization": f"token {access_token}", "Accept": "application/json"}

            # 获取用户基本信息
            userinfo_response = await client.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            github_user = userinfo_response.json()

            # 获取用户邮箱
            emails_response = await client.get(emails_url, headers=headers)
            emails_response.raise_for_status()
            emails = emails_response.json()

        # 3. 提取用户信息
        provider_id = f"github_{github_user['id']}"

        # 获取主邮箱
        primary_email = next((email["email"] for email in emails if email["primary"]), None)
        if not primary_email:
            primary_email = github_user.get("email", f"{github_user['login']}@users.noreply.github.com")

        email = primary_email
        username = github_user["login"]
        avatar_url = github_user.get("avatar_url")

        # 4. 创建OAuth用户数据
        oauth_user = schemas.OAuthUserCreate(
            email=email,
            username=username,
            provider="github",
            provider_id=provider_id,
            avatar_url=avatar_url,
            oauth_metadata=github_user
        )

        # 5. 创建或获取用户
        user = create_or_get_oauth_user(db, oauth_user)

        # 6. 创建JWT令牌
        from datetime import timedelta
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = auth.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )

        # 7. 返回响应
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "expires_in": access_token_expires.total_seconds(),
            "user": schemas.UserInDB.from_orm(user)
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"GitHub OAuth错误: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")
```

### 4. 修改主应用 (`backend/main.py`)
在main.py中添加OAuth路由：

```python
# 在文件顶部导入
from routers import auth as auth_router, analysis as analysis_router, conversation as conversation_router, oauth as oauth_router

# 在包含路由的部分添加
app.include_router(auth_router.router)
app.include_router(analysis_router.router)
app.include_router(conversation_router.router)
app.include_router(oauth_router.router)  # 新增
```

### 5. 修改认证逻辑 (`backend/auth.py`)
可能需要修改`authenticate_user`函数以支持OAuth用户（没有密码）：

```python
def authenticate_user(db: Session, email: str, password: str):
    """验证用户（支持OAuth用户）"""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return False

    # OAuth用户没有密码
    if user.password_hash is None:
        return False

    if not verify_password(password, user.password_hash):
        return False

    return user
```

## 环境变量配置

在Railway项目设置中添加以下环境变量：

```
GOOGLE_CLIENT_ID=825821602627-gbr3dpccu2r42rptp114feb6igjmrjan.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[你的Google Client Secret]
GITHUB_CLIENT_ID=yOv23lijNBXmMNJLxE0lc
GITHUB_CLIENT_SECRET=[你的GitHub Client Secret]
JWT_SECRET=[强密码，至少32字符]
```

## OAuth应用配置

### Google OAuth配置
1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 选择你的项目
3. 添加授权重定向URI：
   - `https://api.candlebot.app/auth/oauth/google/callback`
   - `https://candelbot-backend-production.up.railway.app/auth/oauth/google/callback`
4. 确保已启用必要的API

### GitHub OAuth配置
1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 编辑你的OAuth App
3. 设置回调URL：
   - `https://api.candlebot.app/auth/oauth/github/callback`
   - `https://candelbot-backend-production.up.railway.app/auth/oauth/github/callback`

## 数据库迁移

由于修改了用户模型，需要创建数据库迁移：

```python
# 创建迁移脚本
alembic revision --autogenerate -m "Add OAuth support to users table"

# 应用迁移
alembic upgrade head
```

如果没有使用Alembic，可以直接修改数据库表结构。

## 测试步骤

1. 部署修改后的后端代码到Railway
2. 配置环境变量
3. 重新构建前端扩展：`npm run build`
4. 加载扩展，测试Google登录
5. 测试GitHub登录
6. 测试邮箱登录（确保仍然工作）

## 故障排除

### 常见问题
1. **404错误**：确保OAuth路由已正确集成到main.py
2. **500错误**：检查环境变量是否配置正确
3. **数据库错误**：检查用户模型修改是否正确
4. **CORS错误**：确保CORS配置允许前端域名

### 日志检查
- Railway部署日志
- 后端应用日志
- Chrome扩展控制台错误
- 网络请求日志

## 完成标准

✅ 所有修改文件已更新
✅ 环境变量已配置
✅ OAuth应用已配置回调URL
✅ 数据库迁移已应用
✅ Google登录测试通过
✅ GitHub登录测试通过
✅ 邮箱登录仍然工作
✅ 用户信息正确显示

## 紧急回滚

如果集成出现问题，可以：
1. 恢复修改的文件
2. 回滚数据库迁移
3. 重新部署之前的版本
4. 暂时禁用前端OAuth按钮

---

**注意**：这是一个完整的集成方案。建议先在测试环境中验证，然后再部署到生产环境。