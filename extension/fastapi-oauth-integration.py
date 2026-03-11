"""
FastAPI OAuth集成代码
将此代码集成到现有的FastAPI后端中
"""

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx

# 创建OAuth路由
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
    """OAuth用户创建模型，匹配现有的UserCreate结构"""
    email: str
    username: Optional[str] = None
    password: Optional[str] = None  # OAuth用户没有密码
    provider: str  # google, github
    provider_id: str  # 第三方平台的用户ID
    avatar_url: Optional[str] = None

@router.post("/google/callback")
async def google_oauth_callback(data: OAuthCallback):
    """
    Google OAuth回调端点
    处理Google OAuth授权码，创建或获取本地用户
    """
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
            avatar_url=avatar_url
        )

        # 5. 调用现有的用户创建/获取逻辑
        # 这里需要调用你现有的用户服务
        # user = await user_service.create_or_get_oauth_user(oauth_user)
        # token = await auth_service.create_token_for_user(user)

        # 6. 返回模拟响应（实际需要替换为真实逻辑）
        return {
            "access_token": "mock_jwt_token_for_google_user",
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "email": email,
                "username": username,
                "avatar_url": avatar_url,
                "provider": "google"
            }
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"Google OAuth错误: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")

@router.post("/github/callback")
async def github_oauth_callback(data: OAuthCallback):
    """
    GitHub OAuth回调端点
    处理GitHub OAuth授权码，创建或获取本地用户
    """
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
            avatar_url=avatar_url
        )

        # 5. 调用现有的用户创建/获取逻辑
        # 这里需要调用你现有的用户服务
        # user = await user_service.create_or_get_oauth_user(oauth_user)
        # token = await auth_service.create_token_for_user(user)

        # 6. 返回模拟响应（实际需要替换为真实逻辑）
        return {
            "access_token": "mock_jwt_token_for_github_user",
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "email": email,
                "username": username,
                "avatar_url": avatar_url,
                "provider": "github"
            }
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"GitHub OAuth错误: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")

# 集成说明：
# 1. 将此文件中的路由集成到现有的FastAPI应用中
# 2. 在main.py中添加：app.include_router(oauth_router)
# 3. 实现真实的用户创建/获取逻辑（替换注释部分）
# 4. 确保环境变量已配置