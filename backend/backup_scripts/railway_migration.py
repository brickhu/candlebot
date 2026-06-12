#!/usr/bin/env python3
"""
Railway环境数据库迁移脚本
在Railway环境中运行此脚本添加visibility字段
"""
import os
import sys
from sqlalchemy import create_engine, text

def main():
    # Railway会自动注入DATABASE_URL环境变量
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ DATABASE_URL环境变量未设置")
        print("Railway应该会自动注入此变量")
        sys.exit(1)

    print(f"🔗 数据库URL: {database_url[:50]}...")

    try:
        engine = create_engine(database_url)

        with engine.connect() as conn:
            print("检查visibility字段...")

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

            print("添加visibility字段...")

            # 添加字段
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

            # 验证
            result = conn.execute(text("""
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN visibility = 'private' THEN 1 ELSE 0 END) as private_count,
                       SUM(CASE WHEN visibility = 'public' THEN 1 ELSE 0 END) as public_count
                FROM analysis_records
            """))

            stats = result.fetchone()
            print(f"📊 统计: 总记录数={stats[0]}, 私有记录={stats[1]}, 公开记录={stats[2]}")

            return True

    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 Railway数据库迁移开始...")
    if main():
        print("\n✅ 迁移完成")
        sys.exit(0)
    else:
        print("\n❌ 迁移失败")
        sys.exit(1)