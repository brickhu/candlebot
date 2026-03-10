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

# 处理端口参数
PORT=${PORT:-8000}

# 验证端口是否为有效数字
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "错误: PORT 环境变量 '$PORT' 不是有效整数"
    echo "使用默认端口: 8000"
    PORT=8000
fi

# 确保端口在有效范围内
if [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    echo "错误: 端口 $PORT 不在有效范围内 (1-65535)"
    echo "使用默认端口: 8000"
    PORT=8000
fi

echo "监听端口: $PORT"

if [ "$ENVIRONMENT" = "development" ]; then
    exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --reload
else
    exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
fi