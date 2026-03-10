# Candlebot 后端 API

基于 FastAPI 的 AI K线图表分析后端，支持用户系统、历史记录和交互式问答。

## 功能特性

- ✅ 用户认证系统（JWT）
- ✅ 基于用户的API配额限制
- ✅ 分析历史记录存储
- ✅ 交互式问答功能
- ✅ 多AI提供商支持（DeepSeek、MiniMax）
- ✅ 完整的RESTful API
- ✅ 数据库迁移支持
- ✅ Docker容器化部署

## 技术栈

- **Python 3.11+**
- **FastAPI** - 高性能Web框架
- **SQLAlchemy** - ORM数据库工具
- **PostgreSQL** - 关系型数据库
- **JWT** - 用户认证
- **Alembic** - 数据库迁移
- **Docker** - 容器化部署

## 快速开始

### 1. 环境配置

```bash
# 克隆项目
git clone <repository-url>
cd candlebot/backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 数据库设置

```bash
# 创建PostgreSQL数据库
createdb candlebot

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接和其他配置
```

### 3. 运行服务

```bash
# 开发模式（自动重载）
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 或使用启动脚本
./start.sh
```

### 4. 访问API文档

服务启动后，访问以下地址：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API端点

### 认证相关
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户信息
- `PUT /auth/me` - 更新用户信息

### 分析相关
- `POST /analyze` - 分析K线图表（需要认证）
- `GET /analysis/history` - 获取分析历史
- `GET /analysis/{record_id}` - 获取分析记录详情
- `DELETE /analysis/{record_id}` - 删除分析记录
- `GET /analysis/stats/summary` - 获取分析统计

### 对话相关
- `GET /conversation/{analysis_id}` - 获取或创建对话
- `POST /conversation/{analysis_id}/ask` - 提问关于分析报告
- `DELETE /conversation/{conversation_id}` - 删除对话

### 其他
- `GET /` - API根端点
- `GET /health` - 健康检查

## 数据库架构

### 主要表结构

1. **users** - 用户表
   - id, email, password_hash, plan_type, quota_total, quota_used, settings

2. **analysis_records** - 分析记录表
   - id, user_id, platform, image_hash, report_data, analysis_metadata, created_at

3. **conversations** - 对话表
   - id, user_id, analysis_id, messages, created_at, updated_at

4. **payment_records** - 支付记录表
   - id, user_id, payment_id, amount, plan_type, status

### 数据库迁移

```bash
# 初始化Alembic
alembic init alembic

# 创建迁移
alembic revision --autogenerate -m "描述"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

## 部署

### Docker部署

```bash
# 构建镜像
docker build -t candlebot-backend .

# 运行容器
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e SECRET_KEY=your-secret-key \
  candlebot-backend
```

### Railway部署

项目已配置 Railway 部署，详细部署指南请查看 [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)。

**重要步骤：**
1. 连接 GitHub 仓库到 Railway
2. **必须手动创建 PostgreSQL 数据库服务**
3. Railway 会自动注入 `DATABASE_URL` 环境变量
4. 配置其他必要的环境变量（SECRET_KEY、API密钥等）

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| DATABASE_URL | PostgreSQL连接URL | postgresql://postgres:postgres@localhost:5432/candlebot |
| SECRET_KEY | JWT密钥 | your-secret-key-change-in-production |
| MODEL_PROVIDER | AI提供商 (deepseek/minimax) | deepseek |
| DEEPSEEK_API_KEY | DeepSeek API密钥 | - |
| MINIMAX_API_KEY | MiniMax API密钥 | - |
| ACCESS_TOKEN_EXPIRE_MINUTES | JWT过期时间(分钟) | 10080 (7天) |
| DEFAULT_FREE_QUOTA | 免费用户配额 | 5 |
| PREMIUM_QUOTA | 付费用户配额 | 100 |

## 测试

```bash
# 运行API测试
python test_api.py

# 修改测试配置
# 编辑 test_api.py 中的 BASE_URL 和其他测试参数
```

## 开发指南

### 添加新API端点

1. 在 `routers/` 目录下创建新的路由文件
2. 在 `main.py` 中导入并包含路由
3. 在 `schemas.py` 中定义数据模型
4. 在 `models.py` 中定义数据库模型（如果需要）

### 数据库操作

```python
from database import get_db
from sqlalchemy.orm import Session

# 在依赖中使用
def some_endpoint(db: Session = Depends(get_db)):
    # 查询数据
    users = db.query(User).filter(User.is_active == True).all()

    # 创建数据
    new_user = User(email="test@example.com", ...)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 更新数据
    user = db.query(User).filter(User.id == user_id).first()
    user.email = "new@example.com"
    db.commit()
```

### 错误处理

使用 FastAPI 的 HTTPException：

```python
from fastapi import HTTPException, status

raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="资源不存在"
)
```

## 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License