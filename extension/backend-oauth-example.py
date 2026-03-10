"""
Railway后端OAuth集成示例
这是一个Python FastAPI示例，展示如何添加Google和GitHub OAuth支持
"""

import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import jwt
from datetime import datetime, timedelta

app = FastAPI(title="Candlebot Backend API")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 环境变量配置
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

# 数据模型
class OAuthCallback(BaseModel):
    code: str
    redirect_uri: str

class User(BaseModel):
    id: str
    email: str
    username: str
    avatar_url: Optional[str] = None
    provider: str  # google, github, or email

# 模拟用户数据库
users_db = {}

# JWT工具函数
def create_jwt_token(user_id: str, email: str):
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# Google OAuth处理
@app.post("/auth/oauth/google/callback")
async def google_oauth_callback(data: OAuthCallback):
    """
    处理Google OAuth回调
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
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_info = token_response.json()
            access_token = token_info["access_token"]

        # 2. 使用access token获取用户信息
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient() as client:
            userinfo_response = await client.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            google_user = userinfo_response.json()

        # 3. 创建或获取本地用户
        user_id = f"google_{google_user['id']}"
        email = google_user["email"]
        username = google_user.get("name", email.split("@")[0])
        avatar_url = google_user.get("picture")

        if user_id not in users_db:
            user = User(
                id=user_id,
                email=email,
                username=username,
                avatar_url=avatar_url,
                provider="google"
            )
            users_db[user_id] = user.dict()

        # 4. 生成JWT token
        jwt_token = create_jwt_token(user_id, email)

        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": users_db[user_id]
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"Google OAuth错误: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")

# GitHub OAuth处理
@app.post("/auth/oauth/github/callback")
async def github_oauth_callback(data: OAuthCallback):
    """
    处理GitHub OAuth回调
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
            token_response = await client.post(token_url, data=token_data, headers=headers)
            token_response.raise_for_status()
            token_info = token_response.json()
            access_token = token_info["access_token"]

        # 2. 使用access token获取用户信息
        userinfo_url = "https://api.github.com/user"
        emails_url = "https://api.github.com/user/emails"
        headers = {"Authorization": f"token {access_token}", "Accept": "application/json"}

        async with httpx.AsyncClient() as client:
            # 获取用户基本信息
            userinfo_response = await client.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            github_user = userinfo_response.json()

            # 获取用户邮箱（需要额外请求）
            emails_response = await client.get(emails_url, headers=headers)
            emails_response.raise_for_status()
            emails = emails_response.json()

        # 3. 获取主邮箱
        primary_email = next((email["email"] for email in emails if email["primary"]), None)
        if not primary_email:
            primary_email = github_user.get("email", f"{github_user['login']}@users.noreply.github.com")

        # 4. 创建或获取本地用户
        user_id = f"github_{github_user['id']}"
        email = primary_email
        username = github_user["login"]
        avatar_url = github_user.get("avatar_url")

        if user_id not in users_db:
            user = User(
                id=user_id,
                email=email,
                username=username,
                avatar_url=avatar_url,
                provider="github"
            )
            users_db[user_id] = user.dict()

        # 5. 生成JWT token
        jwt_token = create_jwt_token(user_id, email)

        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": users_db[user_id]
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"GitHub OAuth错误: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")

# 现有的认证端点（保持不变）
@app.post("/auth/login")
async def login():
    """现有的邮箱密码登录"""
    pass

@app.post("/auth/register")
async def register():
    """现有的邮箱注册"""
    pass

@app.get("/auth/me")
async def get_current_user():
    """获取当前用户信息"""
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)