#!/usr/bin/env python3
"""
添加visibility字段到analysis_records表
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# 数据库连接URL - 从环境变量或默认值获取
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/candlebot"
)

def add_visibility_column():
    """添加visibility字段到analysis_records表"""
    try:
        # 创建数据库引擎
        engine = create_engine(DATABASE_URL)

        # 检查字段是否已存在
        with engine.connect() as conn:
            # 检查表是否存在
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'analysis_records'
                AND column_name = 'visibility'
            """))

            if result.fetchone():
                print("✅ visibility字段已存在")
                return True

            # 添加字段
            print("正在添加visibility字段...")
            conn.execute(text("""
                ALTER TABLE analysis_records
                ADD COLUMN visibility VARCHAR(20) DEFAULT 'private'
            """))

            # 创建索引
            conn.execute(text("""
                CREATE INDEX idx_analysis_records_visibility
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

def check_table_structure():
    """检查表结构"""
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'analysis_records'
                ORDER BY ordinal_position
            """))

            print("\n📊 analysis_records表结构:")
            print("-" * 80)
            for row in result:
                print(f"{row.column_name:25} {row.data_type:20} nullable: {row.is_nullable:8} default: {row.column_default}")
            print("-" * 80)

    except Exception as e:
        print(f"❌ 检查表结构失败: {e}")

if __name__ == "__main__":
    print("🔧 开始数据库迁移...")

    # 检查当前表结构
    check_table_structure()

    # 添加字段
    if add_visibility_column():
        # 再次检查表结构
        check_table_structure()
        print("\n✅ 数据库迁移完成")
        sys.exit(0)
    else:
        print("\n❌ 数据库迁移失败")
        sys.exit(1)