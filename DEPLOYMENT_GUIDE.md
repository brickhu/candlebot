# Candlebot v2.0 部署指南

## 概述

Candlebot v2.0 引入了完整的用户系统、Dashboard界面和历史记录管理功能。本文档提供部署和配置指南。

## 系统架构

### 1. 后端 (FastAPI + PostgreSQL)
- 用户认证系统 (JWT)
- 分析记录存储
- 对话历史管理
- API配额限制

### 2. 前端扩展 (Chrome Extension)
- Popup界面 (简化版)
- Dashboard SPA应用
- 用户状态管理
- 本地存储同步

### 3. 数据库 (PostgreSQL)
- 用户表
- 分析记录表
- 对话表
- 支付记录表

## 部署步骤

### 第一步：后端部署

#### 1.1 数据库设置
```bash
# 创建PostgreSQL数据库
createdb candlebot

# 运行数据库迁移
cd backend
python -c "from database import engine; import models; models.Base.metadata.create_all(bind=engine)"
```

#### 1.2 环境变量配置
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，设置以下变量：
# DATABASE_URL=postgresql://username:password@localhost:5432/candlebot
# SECRET_KEY=your-secret-key-change-in-production
# DEEPSEEK_API_KEY=your-deepseek-api-key
# MINIMAX_API_KEY=your-minimax-api-key
```

#### 1.3 启动后端服务
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 第二步：前端扩展构建

#### 2.1 安装依赖
```bash
cd extension
npm install
```

#### 2.2 配置API地址
编辑 `extension/src/popup/Popup.jsx` 和 `extension/src/dashboard/contexts/APIContext.jsx`：
```javascript
const API_BASE = 'http://localhost:8000'  // 开发环境
// 或
const API_BASE = 'https://your-backend-domain.com'  // 生产环境
```

#### 2.3 构建扩展
```bash
cd extension
npm run build
```

构建完成后，扩展文件将在 `extension/dist` 目录中。

#### 2.4 加载扩展到Chrome
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `extension/dist` 目录

### 第三步：测试

#### 3.1 后端API测试
```bash
cd backend
python test_api.py
```

#### 3.2 扩展功能测试
1. 打开 aggr.trade 或 TradingView
2. 点击Candlebot扩展图标
3. 测试登录/注册流程
4. 测试图表分析功能
5. 测试Dashboard访问

## 配置说明

### 后端配置 (backend/.env)
```env
# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT认证
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AI提供商
MODEL_PROVIDER=deepseek  # deepseek 或 minimax
DEEPSEEK_API_KEY=your-key
MINIMAX_API_KEY=your-key

# 配额设置
DEFAULT_FREE_QUOTA=5
PREMIUM_QUOTA=100
```

### 扩展配置
- **Popup**: 简化界面，只保留核心分析功能
- **Dashboard**: 完整的管理界面，包含历史记录、设置、套餐管理
- **用户状态**: 通过chrome.storage.local同步

## 功能验证清单

### 后端API
- [ ] `/auth/register` - 用户注册
- [ ] `/auth/login` - 用户登录
- [ ] `/auth/me` - 获取用户信息
- [ ] `/analyze` - 分析图表 (需要认证)
- [ ] `/analysis/history` - 获取历史记录
- [ ] `/conversation/{id}/ask` - 提问关于分析报告

### 前端扩展
- [ ] Popup用户状态显示
- [ ] Popup图表分析功能
- [ ] Dashboard登录/注册
- [ ] Dashboard历史记录查看
- [ ] Dashboard报告详情和问答
- [ ] Dashboard用户设置
- [ ] Dashboard套餐管理

### 数据流
- [ ] 用户认证状态同步
- [ ] 分析记录存储和检索
- [ ] 配额限制和更新
- [ ] 图片压缩和上传

## 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查DATABASE_URL配置
- 确保PostgreSQL服务正在运行
- 验证用户名/密码权限

#### 2. AI API调用失败
- 检查API密钥配置
- 验证网络连接
- 查看后端日志错误信息

#### 3. 扩展加载失败
- 检查Chrome开发者控制台
- 验证manifest.json配置
- 确保所有依赖已安装

#### 4. 用户认证问题
- 检查JWT token存储
- 验证token过期时间
- 查看chrome.storage.local内容

### 日志查看

#### 后端日志
```bash
# 查看FastAPI日志
tail -f backend.log

# 查看数据库查询
export SQLALCHEMY_ECHO=1
```

#### 扩展日志
- 打开Chrome开发者工具 (F12)
- 查看Console标签页
- 查看Network标签页的API请求

## 生产部署

### Railway部署 (推荐)
```bash
# 配置Railway环境变量
railway variables set DATABASE_URL=...
railway variables set SECRET_KEY=...
railway variables set DEEPSEEK_API_KEY=...

# 部署
railway up
```

### Docker部署
```bash
# 构建镜像
docker build -t candlebot-backend ./backend

# 运行容器
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/dbname \
  -e SECRET_KEY=your-secret-key \
  candlebot-backend
```

### 扩展发布
1. 打包扩展: `cd extension && npm run build`
2. 创建ZIP文件: `zip -r candlebot.zip dist/`
3. 提交到Chrome Web Store开发者控制台

## 更新和维护

### 数据库迁移
```bash
# 创建新迁移
alembic revision --autogenerate -m "描述"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

### 扩展更新
1. 更新版本号: `extension/manifest.json`
2. 重新构建: `npm run build`
3. 提交到Chrome Web Store

### 监控和告警
- 监控API响应时间
- 监控数据库连接池
- 设置配额使用告警
- 监控错误率

## 安全注意事项

1. **JWT密钥**: 生产环境必须使用强密钥
2. **数据库密码**: 使用强密码，定期更换
3. **API密钥**: 不要提交到版本控制
4. **CORS配置**: 生产环境限制来源域名
5. **输入验证**: 所有API端点都需要输入验证
6. **SQL注入防护**: 使用SQLAlchemy参数化查询
7. **XSS防护**: 前端转义用户输入

## 性能优化

### 后端优化
- 数据库连接池配置
- API响应缓存
- 图片处理优化
- 异步任务队列

### 前端优化
- 图片懒加载
- 代码分割
- 本地存储缓存
- 请求去重

## 支持联系方式

- GitHub Issues: [项目仓库地址]
- 邮箱: [支持邮箱]
- 文档: [文档网站地址]

---

**版本**: v2.0.0
**更新日期**: 2026-03-09
**作者**: Candlebot开发团队