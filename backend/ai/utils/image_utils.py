"""
图片处理工具
"""

import base64
import io
from typing import Tuple, Optional
import hashlib


class ImageUtils:
    """图片处理工具类"""

    @staticmethod
    def get_image_size_from_base64(image_base64: str) -> Optional[Tuple[int, int]]:
        """
        从base64编码获取图片尺寸
        注意：这是一个简化版本，实际项目中可能需要PIL或imageio
        """
        try:
            # 解码base64
            image_data = base64.b64decode(image_base64)

            # 简单检查：如果是PNG格式，解析IHDR块获取尺寸
            if image_data[:8] == b'\x89PNG\r\n\x1a\n':
                # PNG格式：IHDR块在第16-24字节
                width = int.from_bytes(image_data[16:20], 'big')
                height = int.from_bytes(image_data[20:24], 'big')
                return width, height
            elif image_data[:2] == b'\xff\xd8':
                # JPEG格式：需要更复杂的解析
                # 这里返回None，表示需要更复杂的实现
                return None
            else:
                # 其他格式
                return None

        except Exception as e:
            print(f"⚠️ 获取图片尺寸失败: {e}")
            return None

    @staticmethod
    def check_image_size(image_base64: str, min_width: int = 600, min_height: int = 400) -> bool:
        """检查图片尺寸是否满足最小要求"""
        size = ImageUtils.get_image_size_from_base64(image_base64)

        if size is None:
            # 如果无法获取尺寸，默认通过检查
            print("⚠️ 无法获取图片尺寸，跳过尺寸检查")
            return True

        width, height = size
        print(f"📏 图片尺寸: {width}x{height}")

        if width < min_width or height < min_height:
            print(f"❌ 图片尺寸太小: {width}x{height} < {min_width}x{min_height}")
            return False

        print(f"✅ 图片尺寸检查通过: {width}x{height}")
        return True

    @staticmethod
    def calculate_image_hash(image_base64: str) -> str:
        """计算图片哈希值"""
        return hashlib.sha256(image_base64.encode()).hexdigest()

    @staticmethod
    def estimate_image_size_mb(image_base64: str) -> float:
        """估算图片大小（MB）"""
        # base64编码会增加约33%的大小
        original_size_bytes = len(image_base64) * 3 / 4
        return original_size_bytes / (1024 * 1024)

    @staticmethod
    def validate_image_format(image_base64: str) -> bool:
        """验证图片格式"""
        try:
            image_data = base64.b64decode(image_base64)

            # 检查常见图片格式
            if image_data[:8] == b'\x89PNG\r\n\x1a\n':
                return True  # PNG
            elif image_data[:2] == b'\xff\xd8':
                return True  # JPEG
            elif image_data[:4] == b'RIFF' and image_data[8:12] == b'WEBP':
                return True  # WebP
            else:
                print(f"⚠️ 不支持的图片格式")
                return False

        except Exception as e:
            print(f"⚠️ 验证图片格式失败: {e}")
            return False