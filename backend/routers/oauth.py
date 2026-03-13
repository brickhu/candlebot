"""
后端OAuth集成 - 简化版本
将此代码集成到现有的FastAPI后端中
"""

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# 导入现有模块
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
    password: Optional[str] = None  # OAuth用户没有密码
    provider: str  # google, github
    provider_id: str  # 第三方平台的用户ID
    avatar_url: Optional[str] = None
    oauth_metadata: Optional[dict] = None

def create_or_get_oauth_user(db: Session, oauth_user: OAuthUserCreate):
    """
    创建或获取OAuth用户
    注意：需要根据你的实际数据库模型调整
    """
    # 首先通过provider_id查找用户
    existing_user = db.query(models.User).filter(
        models.User.provider == oauth_user.provider,
        models.User.provider_id == oauth_user.provider_id
    ).first()

    if existing_user:
        # 更新最后登录时间
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
    # 注意：需要根据你的User模型调整字段
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
        oauth_user = OAuthUserCreate(
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
        access_token_expires = timedelta(minutes=60)  # 根据你的配置调整
        jwt_token = auth.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )

        # 7. 返回响应
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
        oauth_user = OAuthUserCreate(
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
        access_token_expires = timedelta(minutes=60)  # 根据你的配置调整
        jwt_token = auth.create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )

        # 7. 返回响应
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

# OAuth集成已完成