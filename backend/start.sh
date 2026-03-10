#!/bin/bash

# Candlebot 后端启动脚本

echo "启动 Candlebot 后端服务..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  警告: DATABASE_URL 环境变量未设置"
    echo "   在 Railway 中，请确保："
    echo "   1. 已创建 PostgreSQL 数据库服务"
    echo "   2. 数据库服务已连接到当前应用"
    echo "   3. Railway 会自动注入 DATABASE_URL 环境变量"
    echo ""
    echo "   使用本地开发默认值（仅用于测试）"
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
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')
print(f'数据库连接URL: {DATABASE_URL[:50]}...' if DATABASE_URL and len(DATABASE_URL) > 50 else f'数据库连接URL: {DATABASE_URL}')

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('✅ 数据库连接成功')
except Exception as e:
    print(f'⚠️  数据库连接失败: {e}')
    print('   应用将继续启动，但数据库相关功能可能不可用')
    print('   请确保：')
    print('   1. 数据库服务已创建并运行')
    print('   2. DATABASE_URL 环境变量正确设置')
    print('   3. 网络连接正常')
    # 不退出，让应用继续启动
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