# 快速OAuth修复方案

## 问题
前端OAuth已配置，但后端缺少端点，导致登录无法使用。

## 最简单的解决方案

### 第一步：创建OAuth路由文件
在 `backend/routers/` 目录下创建 `oauth.py` 文件，复制以下内容：

```python
"""
OAuth认证路由 - 快速修复版本
"""
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# 导入你的现有模块
import models
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

@router.post("/google/callback")
async def google_oauth_callback(data: OAuthCallback, db: Session = Depends(get_db)):
    """Google OAuth回调端点 - 简化版本"""
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
        email = google_user["email"]
        username = google_user.get("name", email.split("@")[0])
        avatar_url = google_user.get("picture")

        # 查找或创建用户（简化逻辑）
        user = db.query(models.User).filter(models.User.email == email).first()

        if not user:
            # 创建新用户
            user = models.User(
                email=email,
                username=username,
                password_hash="oauth_user_no_password",  # 临时方案
                avatar_url=avatar_url,
                plan_type="free",
                quota_total=5,
                quota_used=0,
                settings={},
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # 更新现有用户
            user.last_login_at = datetime.utcnow()
            user.avatar_url = avatar_url or user.avatar_url
            db.commit()
            db.refresh(user)

        # 创建JWT令牌
        access_token_expires = timedelta(minutes=60)
        jwt_token = auth.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )

        # 返回响应（匹配前端期望的格式）
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
                "quota_remaining": user.quota_total - user.quota_used
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google登录失败: {str(e)}")

@router.post("/github/callback")
async def github_oauth_callback(data: OAuthCallback, db: Session = Depends(get_db)):
    """GitHub OAuth回调端点 - 简化版本"""
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
        primary_email = next((email["email"] for email in emails if email["primary"]), None)
        if not primary_email:
            primary_email = github_user.get("email", f"{github_user['login']}@users.noreply.github.com")

        email = primary_email
        username = github_user["login"]
        avatar_url = github_user.get("avatar_url")

        # 查找或创建用户
        user = db.query(models.User).filter(models.User.email == email).first()

        if not user:
            # 创建新用户
            user = models.User(
                email=email,
                username=username,
                password_hash="oauth_user_no_password",  # 临时方案
                avatar_url=avatar_url,
                plan_type="free",
                quota_total=5,
                quota_used=0,
                settings={},
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # 更新现有用户
            user.last_login_at = datetime.utcnow()
            user.avatar_url = avatar_url or user.avatar_url
            db.commit()
            db.refresh(user)

        # 创建JWT令牌
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
                "quota_remaining": user.quota_total - user.quota_used
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub登录失败: {str(e)}")
```

### 第二步：修改主应用
编辑 `backend/main.py`，在文件顶部添加导入：

```python
# 在现有导入后面添加
from routers import oauth as oauth_router
```

在包含路由的部分添加：

```python
# 在现有路由包含后面添加
app.include_router(oauth_router.router)
```

### 第三步：配置环境变量
在Railway项目设置中，添加以下环境变量：

```
GOOGLE_CLIENT_ID=825821602627-gbr3dpccu2r42rptp114feb6igjmrjan.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[你的Google Client Secret]
GITHUB_CLIENT_ID=yOv23lijNBXmMNJLxE0lc
GITHUB_CLIENT_SECRET=[你的GitHub Client Secret]
```

### 第四步：部署和测试
1. 将修改后的代码推送到Railway
2. 重新构建前端：`npm run build`
3. 加载Chrome扩展
4. 测试登录功能

## 注意事项

### 这个简化方案的局限性：
1. **没有修改用户模型**：使用临时密码 `"oauth_user_no_password"`
2. **没有OAuth专用字段**：无法区分OAuth用户和普通用户
3. **邮箱冲突**：如果OAuth用户邮箱已存在，会直接使用现有账户

### 生产环境建议：
对于生产环境，建议按照完整方案修改用户模型，添加OAuth专用字段。

## 验证方法
1. 访问 `https://api.candlebot.app/auth/oauth/google/callback`（应该不再返回404）
2. 在Chrome扩展中测试Google登录
3. 测试GitHub登录
4. 确保邮箱登录仍然工作

## 紧急回滚
如果出现问题，可以：
1. 删除 `backend/routers/oauth.py`
2. 从 `main.py` 中移除OAuth路由导入
3. 重新部署

---

**总结**：这个快速修复方案可以直接拷贝使用，不需要修改数据库模型。虽然不够完美，但可以立即解决登录无法使用的问题。