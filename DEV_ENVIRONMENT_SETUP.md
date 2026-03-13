# Candlebot 开发环境配置指南

## 环境架构
```
前端 (本地) → 后端 (Railway dev分支) → 数据库 (Railway PostgreSQL)
```

## 配置步骤

### 1. 创建Railway开发环境
1. 访问 https://railway.app
2. 点击 **New Project**
3. 选择 **Deploy from GitHub repo**
4. 选择你的candlebot仓库
5. 选择 **dev** 分支
6. 项目名称: `candlebot-dev`

### 2. 配置Railway环境变量
在Railway项目设置中添加：

#### 必需变量
```
DATABASE_URL=自动生成
SECRET_KEY=candlebot-dev-secret-key-2026-03-13
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
MODEL_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的DeepSeek API密钥
```

#### OAuth配置（开发环境）
```
GITHUB_CLIENT_ID=你的GitHub开发Client ID
GITHUB_CLIENT_SECRET=你的GitHub开发Client Secret
GOOGLE_CLIENT_ID=你的Google开发Client ID
GOOGLE_CLIENT_SECRET=你的Google开发Client Secret
```

#### 可选变量
```
ENVIRONMENT=development
DEBUG=true
DEFAULT_FREE_QUOTA=20
PREMIUM_QUOTA=200
```

### 3. 获取后端URL
部署完成后，在Railway获取：
- **Service URL**: `https://candlebot-dev.up.railway.app`

### 4. 配置前端
修改 `app/.env.local`：
```env
# 连接Railway开发后端
VITE_API_URL=https://candlebot-dev.up.railway.app

# OAuth回调地址（本地前端）
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback

# 可选：前端直接OAuth（不推荐）
# VITE_GITHUB_CLIENT_ID=你的GitHub开发Client ID
# VITE_GOOGLE_CLIENT_ID=你的Google开发Client ID
```

### 5. 启动前端
```bash
cd app
npm run dev
```

## GitHub OAuth配置
1. 访问 https://github.com/settings/developers
2. 确保你的OAuth App配置了：
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5173/oauth/callback`

## 测试流程
1. 前端: http://localhost:5173
2. 点击GitHub登录
3. 应该成功回调并登录

## 数据库管理
开发环境使用独立的数据库，不会影响生产数据。

## 部署流程
```
开发完成 → 提交到dev分支 → Railway自动部署dev环境
测试通过 → 合并到main分支 → Railway自动部署生产环境
```

## 故障排除

### 问题1：OAuth回调失败
- 检查GitHub OAuth App回调地址配置
- 检查前端 `VITE_OAUTH_REDIRECT_URI`
- 检查后端OAuth环境变量

### 问题2：数据库连接失败
- 检查Railway是否已添加PostgreSQL服务
- 检查DATABASE_URL环境变量

### 问题3：API请求失败
- 检查 `VITE_API_URL` 是否正确
- 检查Railway服务是否正常运行