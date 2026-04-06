"""
迁移脚本：将数据库中的base64图片迁移到对象存储
"""
import os
import sys
import argparse
from typing import List, Tuple, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from storage import storage_service, storage_config


def get_database_connection(database_url: Optional[str] = None):
    """获取数据库连接"""
    if not database_url:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            # 尝试从.env.local文件读取
            env_file = ".env.local"
            if os.path.exists(env_file):
                with open(env_file, 'r') as f:
                    for line in f:
                        if line.startswith("DATABASE_URL="):
                            database_url = line.split("=", 1)[1].strip()
                            break

    if not database_url:
        raise ValueError("未找到DATABASE_URL环境变量")

    print(f"连接数据库: {database_url[:20]}...")
    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    return Session()


def get_images_to_migrate(db_session, limit: int = 100) -> List[Tuple[int, int, str, str]]:
    """获取需要迁移的图片记录

    Returns:
        List[(record_id, user_id, image_hash, image_base64)]
    """
    print(f"查询需要迁移的图片记录（最多{limit}条）...")

    # 查询有image_data且不是URL的记录
    sql = text("""
        SELECT id, user_id, image_hash, image_data
        FROM analysis_records
        WHERE image_data IS NOT NULL
          AND image_data != ''
          AND NOT (image_data LIKE 'http://%' OR image_data LIKE 'https://%')
        ORDER BY created_at DESC
        LIMIT :limit
    """)

    result = db_session.execute(sql, {"limit": limit})
    records = []

    for row in result:
        record_id, user_id, image_hash, image_data = row
        if image_data and len(image_data) > 100:  # 确保是有效的base64数据
            records.append((record_id, user_id, image_hash, image_data))

    print(f"找到 {len(records)} 条需要迁移的记录")
    return records


def migrate_image(db_session, record_id: int, user_id: int, image_hash: str, image_base64: str) -> bool:
    """迁移单张图片到对象存储"""
    try:
        print(f"迁移记录 {record_id} (用户 {user_id})...")

        # 上传到对象存储
        image_url = storage_service.upload_image(
            user_id=user_id,
            image_hash=image_hash,
            image_base64=image_base64
        )

        # 更新数据库记录
        update_sql = text("""
            UPDATE analysis_records
            SET image_data = :image_url
            WHERE id = :record_id
        """)

        db_session.execute(update_sql, {
            "image_url": image_url,
            "record_id": record_id
        })
        db_session.commit()

        print(f"✅ 记录 {record_id} 迁移成功: {image_url[:50]}...")
        return True

    except Exception as e:
        print(f"❌ 记录 {record_id} 迁移失败: {e}")
        db_session.rollback()
        return False


def main():
    parser = argparse.ArgumentParser(description="迁移数据库图片到对象存储")
    parser.add_argument("--limit", type=int, default=100, help="迁移记录数量限制")
    parser.add_argument("--dry-run", action="store_true", help="只显示要迁移的记录，不实际执行")
    parser.add_argument("--database-url", type=str, help="数据库连接URL")

    args = parser.parse_args()

    # 检查对象存储配置
    if not storage_config.is_enabled():
        print("❌ 对象存储未启用")
        print("请设置以下环境变量:")
        print("  AWS_ACCESS_KEY_ID")
        print("  AWS_SECRET_ACCESS_KEY")
        print("  S3_BUCKET")
        print("  S3_ENDPOINT_URL")
        print("  IMAGE_STORAGE_TYPE=object_storage")
        sys.exit(1)

    # 测试对象存储连接
    print("测试对象存储连接...")
    connection_ok, error_msg = storage_service.test_connection()
    if not connection_ok:
        print(f"❌ 对象存储连接失败: {error_msg}")
        sys.exit(1)

    print("✅ 对象存储连接成功")

    # 获取数据库连接
    try:
        db_session = get_database_connection(args.database_url)
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        sys.exit(1)

    # 获取需要迁移的记录
    records = get_images_to_migrate(db_session, args.limit)

    if not records:
        print("没有需要迁移的记录")
        return

    print(f"\n准备迁移 {len(records)} 条记录")

    if args.dry_run:
        print("\n干运行模式，不会实际迁移")
        for i, (record_id, user_id, image_hash, image_data) in enumerate(records, 1):
            print(f"{i}. 记录 {record_id} (用户 {user_id}), 图片大小: {len(image_data)} 字节")
        return

    # 执行迁移
    print("\n开始迁移...")
    success_count = 0
    fail_count = 0

    for i, (record_id, user_id, image_hash, image_data) in enumerate(records, 1):
        print(f"\n[{i}/{len(records)}] ", end="")

        if migrate_image(db_session, record_id, user_id, image_hash, image_data):
            success_count += 1
        else:
            fail_count += 1

    # 关闭数据库连接
    db_session.close()

    print(f"\n迁移完成:")
    print(f"  成功: {success_count}")
    print(f"  失败: {fail_count}")
    print(f"  总计: {len(records)}")


if __name__ == "__main__":
    main()