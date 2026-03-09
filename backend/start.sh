#!/bin/bash

# Candlebot 后端启动脚本

echo "启动 Candlebot 后端服务..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "警告: DATABASE_URL 未设置，使用默认值"
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/candlebot"
fi

if [ -z "$SECRET_KEY" ]; then
    echo "警告: SECRET_KEY 未设置，使用默认值（不安全，仅用于开发）"
    export SECRET_KEY="dev-secret-key-change-in-production"
fi

# 检查数据库连接
echo "检查数据库连接..."
python -c "
import os
from sqlalchemy import create_engine, text
try:
    engine = create_engine(os.getenv('DATABASE_URL'))
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('数据库连接成功')
except Exception as e:
    print(f'数据库连接失败: {e}')
    print('请确保数据库服务已启动并正确配置 DATABASE_URL')
    exit(1)
"

# 运行数据库迁移（如果使用Alembic）
if [ -f "alembic.ini" ]; then
    echo "运行数据库迁移..."
    alembic upgrade head
fi

# 启动服务
echo "启动 FastAPI 服务..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --reload