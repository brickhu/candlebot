"""
测试对象存储功能
"""
import os
import sys
import base64

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from storage import storage_config, storage_service


def test_config():
    """测试配置"""
    print("=== 测试对象存储配置 ===")

    is_enabled = storage_config.is_enabled()
    config_valid, config_error = storage_config.validate()

    print(f"启用状态: {is_enabled}")
    print(f"配置有效: {config_valid}")
    if config_error:
        print(f"配置错误: {config_error}")

    print(f"存储类型: {storage_config.storage_type}")
    print(f"最大图片大小: {storage_config.max_image_size_mb}MB")
    print(f"存储桶: {storage_config.bucket}")
    print(f"端点URL: {storage_config.endpoint_url}")
    print(f"公共URL前缀: {storage_config.public_url_prefix}")
    print(f"区域: {storage_config.region}")
    print(f"访问密钥ID已设置: {bool(storage_config.access_key_id)}")
    print(f"秘密访问密钥已设置: {bool(storage_config.secret_access_key)}")

    return is_enabled and config_valid


def test_connection():
    """测试连接"""
    print("\n=== 测试对象存储连接 ===")

    if not storage_config.is_enabled():
        print("对象存储未启用，跳过连接测试")
        return False

    connection_ok, error_msg = storage_service.test_connection()

    if connection_ok:
        print("✅ 对象存储连接成功")
    else:
        print(f"❌ 对象存储连接失败: {error_msg}")

    return connection_ok


def test_image_extraction():
    """测试图片信息提取"""
    print("\n=== 测试图片信息提取 ===")

    # 创建一个简单的base64图片（1x1像素的PNG）
    test_image_base64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    )

    try:
        image_data, content_type, extension = storage_service.extract_image_info(test_image_base64)
        print(f"✅ 图片信息提取成功")
        print(f"   图片大小: {len(image_data)} 字节")
        print(f"   内容类型: {content_type}")
        print(f"   文件扩展名: {extension}")
        return True
    except Exception as e:
        print(f"❌ 图片信息提取失败: {e}")
        return False


def test_object_key_generation():
    """测试对象键名生成"""
    print("\n=== 测试对象键名生成 ===")

    user_id = 123
    image_hash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

    object_key = storage_service.generate_object_key(user_id, image_hash, "png")
    print(f"生成的对象键名: {object_key}")

    # 检查格式
    expected_prefix = f"images/{user_id}/{image_hash[:8]}/"
    if object_key.startswith(expected_prefix) and object_key.endswith(".png"):
        print("✅ 对象键名格式正确")
        return True
    else:
        print("❌ 对象键名格式不正确")
        return False


def main():
    """主测试函数"""
    print("开始测试对象存储功能...\n")

    tests_passed = 0
    tests_total = 4

    # 测试1: 配置
    if test_config():
        tests_passed += 1

    # 测试2: 连接（仅在配置正确时测试）
    if storage_config.is_enabled():
        if test_connection():
            tests_passed += 1
    else:
        print("\n⚠️  对象存储未启用，跳过连接测试")
        tests_total -= 1

    # 测试3: 图片信息提取
    if test_image_extraction():
        tests_passed += 1

    # 测试4: 对象键名生成
    if test_object_key_generation():
        tests_passed += 1

    # 总结
    print(f"\n=== 测试总结 ===")
    print(f"通过: {tests_passed}/{tests_total}")

    if tests_passed == tests_total:
        print("✅ 所有测试通过")
    else:
        print("⚠️  部分测试失败")

    # 提供配置建议
    if not storage_config.is_enabled():
        print("\n=== 配置建议 ===")
        print("要启用对象存储，请设置以下环境变量:")
        print("  AWS_ACCESS_KEY_ID")
        print("  AWS_SECRET_ACCESS_KEY")
        print("  S3_BUCKET")
        print("  S3_ENDPOINT_URL")
        print("  IMAGE_STORAGE_TYPE=object_storage")
        print("\n可以从Railway的Storage插件获取这些配置。")


if __name__ == "__main__":
    main()