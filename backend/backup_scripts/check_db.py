#!/usr/bin/env python3
"""
检查数据库表结构
"""
from database import engine
from sqlalchemy import inspect

def check_table_structure():
    """检查表结构"""
    inspector = inspect(engine)

    # 检查所有表
    tables = inspector.get_table_names()
    print("📊 数据库中的表:")
    for table in tables:
        print(f"  - {table}")

    # 检查analysis_records表结构
    if 'analysis_records' in tables:
        print(f"\n📊 analysis_records表结构:")
        columns = inspector.get_columns('analysis_records')
        for col in columns:
            print(f"  {col['name']:25} {str(col['type']):20} nullable: {col.get('nullable', True)}")

        # 检查是否有visibility字段
        has_visibility = any(col['name'] == 'visibility' for col in columns)
        if has_visibility:
            print("\n✅ visibility字段已存在")
        else:
            print("\n❌ visibility字段不存在")

if __name__ == "__main__":
    check_table_structure()