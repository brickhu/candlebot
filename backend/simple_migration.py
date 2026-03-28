#!/usr/bin/env python3
"""
简单的数据库迁移脚本
使用SQLAlchemy自动创建/更新表结构
"""
import os
import sys
from database import engine, Base
import models

def migrate_database():
    """使用SQLAlchemy自动创建/更新表结构"""
    try:
        print("🔧 开始数据库迁移...")
        print("注意：这只会创建缺失的表和字段，不会删除现有字段")

        # 创建所有表（如果不存在）
        Base.metadata.create_all(bind=engine)

        print("✅ 数据库迁移完成")
        print("注意：如果已有数据，可能需要手动添加缺失字段")
        return True

    except Exception as e:
        print(f"❌ 数据库迁移失败: {e}")
        return False

if __name__ == "__main__":
    if migrate_database():
        sys.exit(0)
    else:
        sys.exit(1)