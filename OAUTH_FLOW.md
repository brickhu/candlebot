# OAuth 2.0 完整流程（你的项目）

## 角色说明
- **用户**: 在浏览器中操作
- **前端WebApp**: `http://localhost:5173` (SolidJS)
- **后端API**: `http://localhost:8000` (FastAPI)
- **OAuth提供商**: Google/GitHub

## 完整流程

### 步骤1: 用户点击登录按钮
```
前端页面 (localhost:5173/login)
    ↓
用户点击 "Continue with Google"
    ↓
前端生成授权URL并重定向
```

### 步骤2: 跳转到OAuth提供商
```
前端重定向到:
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:5173/oauth/callback&  ← 前端地址！
  scope=email profile&
  response_type=code
    ↓
用户在Google页面授权
```

### 步骤3: OAuth提供商回调
```
Google重定向回:
http://localhost:5173/oauth/callback?
  code=AUTHORIZATION_CODE&
  state=RANDOM_STATE
    ↓
前端OAuthCallback页面处理
```

### 步骤4: 前端发送授权码给后端
```
前端提取code，发送POST请求到:
POST http://localhost:8000/auth/oauth/google/callback
{
  "code": "AUTHORIZATION_CODE",
  "redirect_uri": "http://localhost:5173/oauth/callback"
}
    ↓
后端验证code，向Google交换access_token
```

### 步骤5: 后端返回JWT
```
后端返回:
{
  "access_token": "JWT_TOKEN",
  "user": { ... }
}
    ↓
前端保存token，用户登录成功
```

## 关键配置总结

### 前端配置 (.env.local)
```env
# 前端回调地址（OAuth提供商需要这个）
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback

# 后端API地址（前端发送授权码到这里）
VITE_API_URL=http://localhost:8000
```

### OAuth提供商配置
**Google Cloud Console** → 已获授权的重定向URI:
```
http://localhost:5173/oauth/callback
https://your-webapp.com/oauth/callback
```

**GitHub OAuth Apps** → Authorization callback URL:
```
http://localhost:5173/oauth/callback,https://your-webapp.com/oauth/callback
```

### 后端API端点
```
POST /auth/oauth/google/callback   # 处理Google授权码
POST /auth/oauth/github/callback   # 处理GitHub授权码
```

## 常见错误

### 错误: redirect_uri_mismatch
**原因**: OAuth提供商配置的回调地址 ≠ 前端实际使用的地址
**解决**: 确保完全匹配（协议、域名、端口、路径）

### 错误: 回调到后端地址
**错误配置**: `redirect_uri=http://localhost:8000/...`
**正确配置**: `redirect_uri=http://localhost:5173/oauth/callback`

### 错误: 生产地址在本地使用
**现象**: 本地开发使用 `https://yourdomain.com/oauth/callback`
**结果**: Google重定向到生产地址，本地无法接收
**解决**: 使用 `http://localhost:5173/oauth/callback`

## 测试步骤

1. **启动服务**
   ```bash
   # 终端1: 启动后端
   cd backend && python main.py

   # 终端2: 启动前端
   cd app && npm run dev
   ```

2. **访问测试页面**
   ```
   http://localhost:5173/oauth-test
   ```

3. **检查配置**
   - 重定向URI: `http://localhost:5173/oauth/callback`
   - Google OAuth URL: 包含正确的client_id和redirect_uri

4. **完整测试**
   - 访问 `http://localhost:5173/login`
   - 点击Google登录
   - 完成授权
   - 应该成功登录并跳转到仪表板
```

## 一句话总结
**OAuth回调地址 = 前端WebApp地址，不是后端API地址！**