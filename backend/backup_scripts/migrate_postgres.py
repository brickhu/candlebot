#!/usr/bin/env python3
"""
PostgreSQL数据库迁移脚本
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# 从环境变量获取数据库URL
def get_database_url():
    """获取数据库连接URL"""
    # 优先从环境变量读取（Railway、Docker等环境使用）
    env_database_url = os.getenv('DATABASE_URL')
    if env_database_url:
        print(f"📄 从环境变量读取DATABASE_URL: {env_database_url[:50]}...")
        return env_database_url

    # 尝试从多个环境变量文件读取（本地开发使用）
    env_files = ['.env.local', '.env.development', '.env']

    for env_file in env_files:
        if os.path.exists(env_file):
            print(f"📄 读取环境变量文件: {env_file}")
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('DATABASE_URL='):
                        url = line.split('=', 1)[1]
                        print(f"📄 从文件读取DATABASE_URL: {url[:50]}...")
                        return url

    # 默认值
    default_url = "postgresql://postgres:postgres@localhost:5432/candlebot"
    print(f"⚠️  未找到DATABASE_URL，使用默认值: {default_url}")
    return default_url

def add_visibility_column():
    """为PostgreSQL数据库添加visibility字段"""
    database_url = get_database_url()

    try:
        print(f"🔗 连接数据库: {database_url}")
        engine = create_engine(database_url)

        with engine.connect() as conn:
            # 检查字段是否已存在
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'analysis_records'
                AND column_name = 'visibility'
            """))

            if result.fetchone():
                print("✅ visibility字段已存在")
                return True

            print("正在添加visibility字段到analysis_records表...")

            # 添加字段
            conn.execute(text("""
                ALTER TABLE analysis_records
                ADD COLUMN visibility VARCHAR(20) DEFAULT 'private'
            """))

            # 创建索引
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_analysis_records_visibility
                ON analysis_records(visibility)
            """))

            # 更新现有记录
            conn.execute(text("""
                UPDATE analysis_records
                SET visibility = 'private'
                WHERE visibility IS NULL
            """))

            conn.commit()
            print("✅ visibility字段添加成功")
            return True

    except SQLAlchemyError as e:
        print(f"❌ 数据库错误: {e}")
        return False
    except Exception as e:
        print(f"❌ 未知错误: {e}")
        return False

def check_postgres_connection():
    """检查PostgreSQL连接"""
    database_url = get_database_url()

    try:
        engine = create_engine(database_url)
        with engine.connect() as conn:
            # 简单查询测试连接
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ PostgreSQL连接成功")
            print(f"📊 PostgreSQL版本: {version}")
            return True
    except Exception as e:
        print(f"❌ PostgreSQL连接失败: {e}")
        print("请确保:")
        print("1. PostgreSQL服务正在运行")
        print("2. 数据库URL正确")
        print("3. 数据库用户有权限")
        return False

if __name__ == "__main__":
    print("🔧 PostgreSQL数据库迁移开始...")

    # 检查连接
    if not check_postgres_connection():
        sys.exit(1)

    # 添加字段
    if add_visibility_column():
        print("\n✅ 数据库迁移完成")
        sys.exit(0)
    else:
        print("\n❌ 数据库迁移失败")
        sys.exit(1)