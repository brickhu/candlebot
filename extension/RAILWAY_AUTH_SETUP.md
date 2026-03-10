# Railway Auth 第三方登录配置指南

## 概述

本指南将帮助你在Railway上配置Google和GitHub第三方登录。

## 步骤1：在Railway中配置环境变量

1. 登录Railway仪表板
2. 选择你的项目：`candelbot-backend-production`
3. 点击"Settings" -> "Variables"
4. 添加以下环境变量：

### Google OAuth配置
```
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### GitHub OAuth配置
```
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

### 前端环境变量
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GITHUB_CLIENT_ID=your-github-client-id-here
VITE_API_BASE=https://candelbot-backend-production.up.railway.app
```

## 步骤2：创建Google OAuth 2.0客户端

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建或选择项目
3. 进入"APIs & Services" -> "Credentials"
4. 点击"Create Credentials" -> "OAuth 2.0 Client IDs"
5. 配置应用：
   - **Application type**: Web application
   - **Name**: Candlebot Dashboard
   - **Authorized JavaScript origins**:
     - `https://candelbot-backend-production.up.railway.app`
     - `chrome-extension://[your-extension-id]` (扩展ID)
   - **Authorized redirect URIs**:
     - `https://candelbot-backend-production.up.railway.app/auth/oauth/google/callback`
     - `chrome-extension://[your-extension-id]` (Chrome扩展回调)
6. 获取Client ID和Client Secret

## 步骤3：创建GitHub OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击"New OAuth App"
3. 配置应用：
   - **Application name**: Candlebot Dashboard
   - **Homepage URL**: `https://candelbot-backend-production.up.railway.app`
   - **Application description**: Candlebot智能图表分析平台
   - **Authorization callback URL**:
     - `https://candelbot-backend-production.up.railway.app/auth/oauth/github/callback`
4. 获取Client ID和Client Secret

## 步骤4：更新后端API

后端需要添加OAuth路由处理。以下是预期的API端点：

### Google OAuth端点
- `GET /auth/oauth/google` - 发起Google OAuth登录
- `POST /auth/oauth/google/callback` - 处理Google OAuth回调

### GitHub OAuth端点
- `GET /auth/oauth/github` - 发起GitHub OAuth登录
- `POST /auth/oauth/github/callback` - 处理GitHub OAuth回调

## 步骤5：测试配置

### 测试Google登录
1. 访问Dashboard登录页面
2. 点击"使用 Google 登录"
3. 应该重定向到Google登录页面
4. 登录后应该返回Dashboard并自动登录

### 测试GitHub登录
1. 访问Dashboard登录页面
2. 点击"使用 GitHub 登录"
3. 应该重定向到GitHub登录页面
4. 授权后应该返回Dashboard并自动登录

## 故障排除

### 常见问题1：OAuth客户端ID未配置
**症状**：点击登录按钮无反应或报错
**解决方案**：
1. 检查环境变量是否已正确设置
2. 确保VITE_GOOGLE_CLIENT_ID和VITE_GITHUB_CLIENT_ID已配置
3. 重新部署应用

### 常见问题2：重定向URI不匹配
**症状**：OAuth提供商返回"redirect_uri_mismatch"错误
**解决方案**：
1. 检查Google Cloud Console中的授权重定向URI
2. 确保与AuthContext.jsx中的redirectUri匹配
3. 对于Chrome扩展，使用`chrome.identity.getRedirectURL('oauth2')`

### 常见问题3：CORS错误
**症状**：浏览器控制台显示CORS错误
**解决方案**：
1. 确保后端配置了正确的CORS头
2. 检查API_BASE地址是否正确
3. 验证请求头是否包含正确的Content-Type

## 安全注意事项

1. **保护Client Secret**：永远不要在前端代码中暴露Client Secret
2. **使用环境变量**：所有敏感信息都应通过环境变量配置
3. **验证state参数**：防止CSRF攻击
4. **HTTPS**：确保所有通信都使用HTTPS
5. **定期轮换密钥**：定期更新OAuth客户端密钥

## 扩展配置

### Chrome扩展特定配置
对于Chrome扩展，需要：
1. 在manifest.json中添加`identity`权限
2. 使用`chrome.identity.launchWebAuthFlow`进行OAuth流程
3. 配置正确的重定向URI

### Railway部署
Railway会自动管理环境变量和部署。确保：
1. 所有环境变量都在Railway仪表板中配置
2. 重新部署应用以使环境变量生效
3. 检查Railway日志以排除错误

## 支持

如有问题，请：
1. 检查Railway部署日志
2. 查看浏览器开发者工具控制台
3. 验证环境变量配置
4. 确保OAuth应用配置正确