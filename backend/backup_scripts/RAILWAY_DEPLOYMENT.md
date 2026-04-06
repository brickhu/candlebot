# Railway 部署指南

## 1. 在 Railway 上创建项目

1. 访问 [Railway.app](https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 连接你的 GitHub 账户并选择 `candlebot/backend` 仓库

## 2. 添加 PostgreSQL 数据库服务

**重要：** Railway 不会自动创建数据库，你需要手动添加数据库服务。

### 步骤：
1. 在 Railway 项目仪表板中，点击 "+ New"
2. 选择 "Database"
3. 选择 "PostgreSQL"
4. Railway 会自动创建并配置 PostgreSQL 数据库

### 数据库连接：
- Railway 会自动为你的应用服务注入 `DATABASE_URL` 环境变量
- 你不需要手动设置这个变量
- 应用会自动使用这个环境变量连接数据库

## 3. 配置环境变量

在 Railway 项目设置中，添加以下环境变量：

### 必需变量：
- `SECRET_KEY`: JWT 密钥（生产环境使用强密码）
  - 示例：`openssl rand -hex 32` 生成一个

### AI 提供商变量（至少设置一个）：
- `MODEL_PROVIDER`: `deepseek` 或 `minimax`
- `DEEPSEEK_API_KEY`: DeepSeek API 密钥（如果使用 DeepSeek）
- `MINIMAX_API_KEY`: MiniMax API 密钥（如果使用 MiniMax）

### 可选变量：
- `ENVIRONMENT`: `production`（默认）或 `development`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT 过期时间（默认 10080，7天）
- `DEFAULT_FREE_QUOTA`: 免费用户配额（默认 5）
- `PREMIUM_QUOTA`: 付费用户配额（默认 100）

## 4. 部署流程

Railway 会自动：
1. 检测到 `railway.toml` 配置文件
2. 使用 Nixpacks 构建器构建 Docker 镜像
3. 安装 `requirements.txt` 中的依赖
4. 执行 `./start.sh` 启动应用
5. 将数据库服务连接到应用服务

## 5. 验证部署

### 检查日志：
1. 在 Railway 仪表板中查看应用日志
2. 确保没有错误信息
3. 应该看到 "启动 FastAPI 服务..." 和 "监听端口: ..." 消息

### 健康检查：
应用启动后，访问：
- `https://你的域名.railway.app/health` - 健康检查端点
- `https://你的域名.railway.app/docs` - Swagger API 文档

## 6. 故障排除

### 常见问题：

#### 1. "DATABASE_URL 未设置" 警告
- 确保已创建 PostgreSQL 数据库服务
- 确保数据库服务已连接到应用服务
- 重启应用服务使环境变量生效

#### 2. 数据库连接失败
- 检查 `DATABASE_URL` 环境变量是否正确
- 确保数据库服务正在运行
- 检查网络连接设置

#### 3. 端口错误
- Railway 会自动设置 `PORT` 环境变量
- 应用已配置为使用 `$PORT` 或默认端口 8000

#### 4. 依赖安装失败
- 检查 `requirements.txt` 格式是否正确
- 确保所有依赖包名称正确

## 7. 数据库迁移

应用启动时会自动运行数据库迁移（如果检测到 `alembic.ini` 文件）。

### 手动运行迁移（如果需要）：
```bash
# 在 Railway 的终端中执行
alembic upgrade head
```

## 8. 监控和维护

### 监控：
- Railway 仪表板提供 CPU、内存、网络使用情况
- 查看应用日志了解运行状态

### 备份：
- Railway PostgreSQL 服务提供自动备份
- 可在数据库服务设置中配置备份策略

## 9. 扩展

### 增加资源：
- 在 Railway 仪表板中调整服务资源（CPU、内存）
- 根据流量需求调整实例数量

### 自定义域名：
- 在 Railway 项目设置中添加自定义域名
- 配置 SSL 证书