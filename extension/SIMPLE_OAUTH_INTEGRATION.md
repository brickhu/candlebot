# 简单OAuth集成步骤

## 问题
前端OAuth已配置，但后端缺少端点，导致登录无法使用。

## 解决方案
将OAuth功能集成到现有后端中。

## 步骤1：修改用户模型
编辑 `backend/models.py`，修改User类：

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # 改为可为空 ✅
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

    # 新增OAuth字段 ✅
    provider = Column(String(50), nullable=True)  # google, github, 或 None
    provider_id = Column(String(255), nullable=True, index=True)
    oauth_metadata = Column(JSON, nullable=True)

    # 关系（保持不变）
    analyses = relationship("AnalysisRecord", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("PaymentRecord", back_populates="user", cascade="all, delete-orphan")
```

## 步骤2：创建OAuth路由文件
创建 `backend/routers/oauth.py`，复制以下内容：

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
from datetime import datetime, timedelta

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

class OAuthUserCreate(BaseModel):
    """OAuth用户创建模型"""
    email: str
    username: Optional[str] = None
    password: Optional[str] = None
    provider: str
    provider_id: str
    avatar_url: Optional[str] = None
    oauth_metadata: Optional[dict] = None

def create_or_get_oauth_user(db: Session, oauth_user: OAuthUserCreate):
    """创建或获取OAuth用户"""
    # 通过provider_id查找
    existing_user = db.query(models.User).filter(
        models.User.provider == oauth_user.provider,
        models.User.provider_id == oauth_user.provider_id
    ).first()

    if existing_user:
        existing_user.last_login_at = datetime.utcnow()
        existing_user.avatar_url = oauth_user.avatar_url or existing_user.avatar_url
        db.commit()
        db.refresh(existing_user)
        return existing_user

    # 通过邮箱查找
    if oauth_user.email:
        existing_user_by_email = db.query(models.User).filter(
            models.User.email == oauth_user.email
        ).first()

        if existing_user_by_email:
            existing_user_by_email.provider = oauth_user.provider
            existing_user_by_email.provider_id = oauth_user.provider_id
            existing_user_by_email.password_hash = None
            existing_user_by_email.avatar_url = oauth_user.avatar_url or existing_user_by_email.avatar_url
            existing_user_by_email.last_login_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_user_by_email)
            return existing_user_by_email

    # 创建新用户
    db_user = models.User(
        email=oauth_user.email,
        username=oauth_user.username or oauth_user.email.split("@")[0],
        password_hash=None,
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
        # 交换token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": data.code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": data.redirect_uri,
            "grant_type": "authorization_code"
        }

        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_info = token_response.json()
            access_token = token_info["access_token"]

            # 获取用户信息
            userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            userinfo_response = await client.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            google_user = userinfo_response.json()

        # 提取信息
        provider_id = f"google_{google_user['id']}"
        email = google_user["email"]
        username = google_user.get("name", email.split("@")[0])
        avatar_url = google_user.get("picture")

        # 创建用户
        oauth_user = OAuthUserCreate(
            email=email,
            username=username,
            provider="google",
            provider_id=provider_id,
            avatar_url=avatar_url,
            oauth_metadata=google_user
        )

        user = create_or_get_oauth_user(db, oauth_user)

        # 创建JWT
        access_token_expires = timedelta(minutes=60)
        jwt_token = auth.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )

        # 返回响应
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "expires_in": access_token_expires.total_seconds(),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "avatar_url": user.avatar_url,
                "plan_type": user.plan_type,
                "quota_total": user.quota_total,
                "quota_used": user.quota_used,
                "quota_remaining": user.quota_total - user.quota_used,
                "provider": user.provider
            }
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
        # 交换token
        token_url = "https://github.com/login/oauth/access_token"
        token_data = {
            "code": data.code,
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "redirect_uri": data.redirect_uri
        }
        headers = {"Accept": "application/json"}

        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data, headers=headers)
            token_response.raise_for_status()
            token_info = token_response.json()
            access_token = token_info["access_token"]

            # 获取用户信息
            userinfo_url = "https://api.github.com/user"
            emails_url = "https://api.github.com/user/emails"
            headers = {"Authorization": f"token {access_token}", "Accept": "application/json"}

            userinfo_response = await client.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            github_user = userinfo_response.json()

            emails_response = await client.get(emails_url, headers=headers)
            emails_response.raise_for_status()
            emails = emails_response.json()

        # 提取信息
        provider_id = f"github_{github_user['id']}"

        # 获取邮箱
        primary_email = next((email["email"] for email in emails if email["primary"]), None)
        if not primary_email:
            primary_email = github_user.get("email", f"{github_user['login']}@users.noreply.github.com")

        email = primary_email
        username = github_user["login"]
        avatar_url = github_user.get("avatar_url")

        # 创建用户
        oauth_user = OAuthUserCreate(
            email=email,
            username=username,
            provider="github",
            provider_id=provider_id,
            avatar_url=avatar_url,
            oauth_metadata=github_user
        )

        user = create_or_get_oauth_user(db, oauth_user)

        # 创建JWT
        access_token_expires = timedelta(minutes=60)
        jwt_token = auth.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )

        # 返回响应
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "expires_in": access_token_expires.total_seconds(),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "avatar_url": user.avatar_url,
                "plan_type": user.plan_type,
                "quota_total": user.quota_total,
                "quota_used": user.quota_used,
                "quota_remaining": user.quota_total - user.quota_used,
                "provider": user.provider
            }
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"GitHub OAuth错误: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")
```

## 步骤3：修改主应用
编辑 `backend/main.py`，添加OAuth路由：

```python
# 在顶部导入部分添加
from routers import auth as auth_router, analysis as analysis_router, conversation as conversation_router, oauth as oauth_router

# 在包含路由的部分添加
app.include_router(auth_router.router)
app.include_router(analysis_router.router)
app.include_router(conversation_router.router)
app.include_router(oauth_router.router)  # 新增 ✅
```

## 步骤4：配置环境变量
在Railway项目设置中添加：

```
GOOGLE_CLIENT_ID=825821602627-gbr3dpccu2r42rptp114feb6igjmrjan.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[你的Google Client Secret]
GITHUB_CLIENT_ID=yOv23lijNBXmMNJLxE0lc
GITHUB_CLIENT_SECRET=[你的GitHub Client Secret]
JWT_SECRET=[强密码，至少32字符]
```

## 步骤5：更新数据库
由于修改了用户模型，需要更新数据库表结构：

### 选项A：使用SQL直接修改
```sql
-- 如果使用SQLite/PostgreSQL
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN provider VARCHAR(50);
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN oauth_metadata JSONB;
CREATE INDEX idx_users_provider_id ON users(provider_id);
```

### 选项B：重新创建表（开发环境）
1. 备份数据
2. 删除表
3. 重新运行应用（会自动创建新表）

## 步骤6：测试
1. 部署到Railway
2. 重新构建前端：`npm run build`
3. 加载扩展
4. 测试Google登录
5. 测试GitHub登录
6. 测试邮箱登录

## 快速检查清单
- [ ] `models.py` 修改完成
- [ ] `routers/oauth.py` 创建完成
- [ ] `main.py` 导入并包含路由
- [ ] Railway环境变量配置完成
- [ ] 数据库表结构更新完成
- [ ] 重新部署后端
- [ ] 重新构建前端
- [ ] 测试登录功能

## 故障排除
1. **404错误**：检查路由是否正确定义和包含
2. **500错误**：检查环境变量和数据库连接
3. **数据库错误**：检查表结构是否匹配
4. **CORS错误**：确保CORS配置允许所有来源（开发环境）

## 完成状态
完成以上步骤后，OAuth登录应该可以正常工作。前端代码已经准备好，只需要后端提供相应的API端点。