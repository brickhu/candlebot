#!/usr/bin/env python3
"""
立即修复 visibility 列问题
在 Railway 环境中直接运行此脚本
"""
import os
import sys
from sqlalchemy import create_engine, text

def main():
    # 直接从环境变量获取数据库URL
    database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("❌ 错误: DATABASE_URL 环境变量未设置")
        print("在 Railway 中，请确保数据库服务已连接")
        sys.exit(1)

    print(f"🔗 数据库URL: {database_url[:50]}...")

    try:
        engine = create_engine(database_url)

        with engine.connect() as conn:
            print("检查 visibility 字段...")

            # 检查字段是否已存在
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'analysis_records'
                AND column_name = 'visibility'
            """))

            if result.fetchone():
                print("✅ visibility 字段已存在")
                return True

            print("添加 visibility 字段...")

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
            print("✅ visibility 字段添加成功")

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
        print(f"❌ 修复失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 立即修复 visibility 字段问题...")
    if main():
        print("\n✅ 修复完成")
        sys.exit(0)
    else:
        print("\n❌ 修复失败")
        sys.exit(1)