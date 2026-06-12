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
        print(f"🔍 开始验证图片格式，输入长度: {len(image_base64)} 字符")

        # 记录前100个字符用于调试
        if len(image_base64) > 100:
            print(f"🔍 输入前100字符: {image_base64[:100]}...")
        else:
            print(f"🔍 输入内容: {image_base64}")

        try:
            # 清理base64字符串（移除换行符、空格等）
            cleaned_base64 = image_base64.strip()
            # 移除可能的数据URL前缀
            if cleaned_base64.startswith('data:image/'):
                print(f"🔍 检测到数据URL格式")
                # 提取base64部分（data:image/png;base64,actual_base64_data）
                parts = cleaned_base64.split(',', 1)
                if len(parts) == 2:
                    cleaned_base64 = parts[1]
                    print(f"🔍 提取base64部分，长度: {len(cleaned_base64)}")

            # 移除所有空白字符
            original_length = len(cleaned_base64)
            cleaned_base64 = ''.join(cleaned_base64.split())
            if original_length != len(cleaned_base64):
                print(f"🔍 移除了 {original_length - len(cleaned_base64)} 个空白字符")

            print(f"🔍 清理后base64长度: {len(cleaned_base64)} 字符")

            try:
                image_data = base64.b64decode(cleaned_base64, validate=True)
                print(f"✅ base64解码成功，数据大小: {len(image_data)} 字节")
            except Exception as decode_error:
                print(f"❌ base64解码失败: {decode_error}")
                # 尝试使用更宽松的解码
                try:
                    # 添加填充字符
                    padding = 4 - len(cleaned_base64) % 4
                    if padding != 4:
                        cleaned_base64 += '=' * padding
                    image_data = base64.b64decode(cleaned_base64, validate=False)
                    print(f"⚠️ 使用宽松解码成功，数据大小: {len(image_data)} 字节")
                except Exception as e2:
                    print(f"❌ 宽松解码也失败: {e2}")
                    return False

            # 检查数据是否足够大
            if len(image_data) < 10:
                print(f"⚠️ 图片数据太小: {len(image_data)} 字节")
                return False

            # 检查常见图片格式
            if len(image_data) >= 8 and image_data[:8] == b'\x89PNG\r\n\x1a\n':
                print(f"✅ 检测到PNG格式")
                return True  # PNG
            elif len(image_data) >= 2 and image_data[:2] == b'\xff\xd8':
                print(f"✅ 检测到JPEG格式")
                return True  # JPEG
            elif len(image_data) >= 12 and image_data[:4] == b'RIFF' and image_data[8:12] == b'WEBP':
                print(f"✅ 检测到WebP格式")
                return True  # WebP
            elif len(image_data) >= 2 and image_data[:2] == b'BM':
                print(f"✅ 检测到BMP格式")
                return True  # BMP
            elif len(image_data) >= 6 and image_data[:6] in [b'GIF87a', b'GIF89a']:
                print(f"✅ 检测到GIF格式")
                return True  # GIF
            elif len(image_data) >= 4 and image_data[:2] in [b'II', b'MM']:
                print(f"✅ 检测到TIFF格式")
                return True  # TIFF
            else:
                # 检查是否是SVG（XML格式）
                try:
                    decoded_str = image_data[:200].decode('utf-8', errors='ignore').strip()
                    if decoded_str.startswith('<?xml') or '<svg' in decoded_str.lower():
                        print(f"✅ 检测到SVG格式")
                        return True  # SVG
                except:
                    pass

                # 打印前几个字节用于调试
                hex_bytes = ' '.join(f'{b:02x}' for b in image_data[:min(16, len(image_data))])
                print(f"⚠️ 不支持的图片格式，前{min(16, len(image_data))}字节: {hex_bytes}")

                # 尝试检测文件类型
                file_type = self._detect_file_type(image_data[:100])
                if file_type:
                    print(f"🔍 检测到可能的文件类型: {file_type}")

                return False

        except Exception as e:
            print(f"⚠️ 验证图片格式失败: {e}")
            import traceback
            traceback.print_exc()
            return False

    def _detect_file_type(self, data: bytes) -> str:
        """尝试检测文件类型"""
        if len(data) < 10:
            return "数据太小"

        # 检查常见文件签名
        signatures = {
            b'\x89PNG\r\n\x1a\n': 'PNG',
            b'\xff\xd8': 'JPEG',
            b'RIFF': 'RIFF (可能为WebP/AVI/WAV)',
            b'BM': 'BMP',
            b'GIF87a': 'GIF87a',
            b'GIF89a': 'GIF89a',
            b'II': 'TIFF (小端)',
            b'MM': 'TIFF (大端)',
            b'%PDF': 'PDF',
            b'PK\x03\x04': 'ZIP/Office文档',
            b'\x1f\x8b': 'GZIP',
            b'\x7fELF': 'ELF可执行文件',
        }

        for sig, file_type in signatures.items():
            if data[:len(sig)] == sig:
                return file_type

        # 检查文本文件
        try:
            text = data[:100].decode('utf-8', errors='ignore')
            if text.startswith('<?xml'):
                return 'XML'
            elif text.startswith('<!DOCTYPE html') or '<html' in text.lower():
                return 'HTML'
            elif text.startswith('{') or text.startswith('['):
                return 'JSON'
        except:
            pass

        return '未知'