"""
对象存储服务
支持Railway的S3兼容对象存储
"""
import os
import base64
import uuid
import mimetypes
from typing import Optional, Tuple
import boto3
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)


class ObjectStorageConfig:
    """对象存储配置"""

    def __init__(self):
        self.access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        self.secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.region = os.getenv("AWS_DEFAULT_REGION", "auto")
        self.bucket = os.getenv("AWS_S3_BUCKET_NAME")
        self.endpoint_url = os.getenv("AWS_ENDPOINT_URL")
        self.public_url_prefix = os.getenv("S3_PUBLIC_URL_PREFIX")

        # 图片存储类型：database 或 object_storage
        self.storage_type = os.getenv("IMAGE_STORAGE_TYPE", "database")

        # 最大图片大小（MB）
        self.max_image_size_mb = int(os.getenv("IMAGE_MAX_SIZE_MB", "10"))

    def is_enabled(self) -> bool:
        """检查对象存储是否已配置"""
        return all([
            self.access_key_id,
            self.secret_access_key,
            self.bucket,
            self.endpoint_url
        ]) and self.storage_type == "object_storage"

    def validate(self) -> Tuple[bool, Optional[str]]:
        """验证配置是否完整"""
        if not self.is_enabled():
            return False, "对象存储未启用或配置不完整"

        missing = []
        if not self.access_key_id:
            missing.append("AWS_ACCESS_KEY_ID")
        if not self.secret_access_key:
            missing.append("AWS_SECRET_ACCESS_KEY")
        if not self.bucket:
            missing.append("AWS_S3_BUCKET_NAME")
        if not self.endpoint_url:
            missing.append("AWS_ENDPOINT_URL")

        if missing:
            return False, f"缺少必要的环境变量: {', '.join(missing)}"

        return True, None


class ObjectStorageService:
    """对象存储服务"""

    def __init__(self, config: Optional[ObjectStorageConfig] = None):
        self.config = config or ObjectStorageConfig()
        self._client = None
        self._resource = None

    @property
    def client(self):
        """获取S3客户端（懒加载）"""
        if self._client is None:
            self._client = boto3.client(
                's3',
                aws_access_key_id=self.config.access_key_id,
                aws_secret_access_key=self.config.secret_access_key,
                endpoint_url=self.config.endpoint_url,
                region_name=self.config.region
            )
        return self._client

    @property
    def resource(self):
        """获取S3资源（懒加载）"""
        if self._resource is None:
            self._resource = boto3.resource(
                's3',
                aws_access_key_id=self.config.access_key_id,
                aws_secret_access_key=self.config.secret_access_key,
                endpoint_url=self.config.endpoint_url,
                region_name=self.config.region
            )
        return self._resource

    def generate_object_key(self, user_id: int, image_hash: str, extension: str = "png") -> str:
        """生成对象存储键名

        Args:
            user_id: 用户ID
            image_hash: 图片哈希
            extension: 文件扩展名

        Returns:
            对象键名，格式: images/{user_id}/{image_hash[:8]}/{uuid}.{extension}
        """
        # 使用UUID确保唯一性，避免哈希冲突
        unique_id = str(uuid.uuid4())[:8]
        return f"images/{user_id}/{image_hash[:8]}/{unique_id}.{extension}"

    def extract_image_info(self, image_base64: str) -> Tuple[bytes, str, str]:
        """从base64字符串提取图片信息和二进制数据

        Args:
            image_base64: base64编码的图片数据

        Returns:
            (图片二进制数据, 内容类型, 文件扩展名)
        """
        # 清理base64前缀（如果有）
        if image_base64.startswith('data:'):
            # 提取真正的base64数据
            parts = image_base64.split(',', 1)
            if len(parts) == 2:
                image_base64 = parts[1]

        # 解码base64
        try:
            image_data = base64.b64decode(image_base64)
        except Exception as e:
            raise ValueError(f"无效的base64图片数据: {e}")

        # 检查图片大小
        size_mb = len(image_data) / (1024 * 1024)
        if size_mb > self.config.max_image_size_mb:
            raise ValueError(f"图片大小超过限制: {size_mb:.2f}MB > {self.config.max_image_size_mb}MB")

        # 尝试检测图片类型
        content_type = self._detect_image_type(image_data)
        extension = mimetypes.guess_extension(content_type) or '.png'

        # 移除扩展名前的点
        if extension.startswith('.'):
            extension = extension[1:]

        return image_data, content_type, extension

    def _detect_image_type(self, image_data: bytes) -> str:
        """检测图片类型

        Args:
            image_data: 图片二进制数据

        Returns:
            内容类型，如 'image/png', 'image/jpeg'
        """
        # 通过魔数检测图片类型
        if image_data.startswith(b'\xff\xd8\xff'):
            return 'image/jpeg'
        elif image_data.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'image/png'
        elif image_data.startswith(b'GIF87a') or image_data.startswith(b'GIF89a'):
            return 'image/gif'
        elif image_data.startswith(b'RIFF') and image_data[8:12] == b'WEBP':
            return 'image/webp'
        else:
            # 默认返回PNG
            return 'image/png'

    def upload_image(self, user_id: int, image_hash: str, image_base64: str) -> str:
        """上传图片到对象存储

        Args:
            user_id: 用户ID
            image_hash: 图片哈希
            image_base64: base64编码的图片数据

        Returns:
            图片的公开访问URL
        """
        if not self.config.is_enabled():
            raise RuntimeError("对象存储未启用")

        try:
            # 提取图片信息
            image_data, content_type, extension = self.extract_image_info(image_base64)

            # 生成对象键名
            object_key = self.generate_object_key(user_id, image_hash, extension)

            logger.info(f"上传图片到对象存储: bucket={self.config.bucket}, key={object_key}")

            # 上传到S3
            self.client.put_object(
                Bucket=self.config.bucket,
                Key=object_key,
                Body=image_data,
                ContentType=content_type,
                # 设置公开读取（如果需要）
                ACL='public-read' if self.config.public_url_prefix else 'private'
            )

            # 生成访问URL
            if self.config.public_url_prefix:
                # 使用公共URL前缀
                url = f"{self.config.public_url_prefix}/{object_key}"
            else:
                # 生成预签名URL（24小时有效）
                url = self.client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.config.bucket, 'Key': object_key},
                    ExpiresIn=86400  # 24小时
                )

            logger.info(f"图片上传成功: {url}")
            return url

        except ClientError as e:
            logger.error(f"S3上传失败: {e}")
            raise RuntimeError(f"图片上传失败: {e}")
        except Exception as e:
            logger.error(f"上传图片失败: {e}")
            raise

    def delete_image(self, image_url: str) -> bool:
        """从对象存储删除图片

        Args:
            image_url: 图片URL

        Returns:
            是否删除成功
        """
        if not self.config.is_enabled():
            logger.warning("对象存储未启用，跳过删除操作")
            return False

        try:
            # 从URL中提取对象键名
            object_key = self._extract_object_key_from_url(image_url)
            if not object_key:
                logger.warning(f"无法从URL提取对象键名: {image_url}")
                return False

            logger.info(f"从对象存储删除图片: bucket={self.config.bucket}, key={object_key}")

            # 删除对象
            self.client.delete_object(Bucket=self.config.bucket, Key=object_key)

            logger.info(f"图片删除成功: {object_key}")
            return True

        except ClientError as e:
            logger.error(f"S3删除失败: {e}")
            return False
        except Exception as e:
            logger.error(f"删除图片失败: {e}")
            return False

    def _extract_object_key_from_url(self, url: str) -> Optional[str]:
        """从URL中提取对象键名

        Args:
            url: 图片URL

        Returns:
            对象键名或None
        """
        if self.config.public_url_prefix and url.startswith(self.config.public_url_prefix):
            # 公共URL格式
            return url[len(self.config.public_url_prefix) + 1:]  # 移除前缀和斜杠

        # 尝试从预签名URL中提取
        # 这里简化处理，实际可能需要更复杂的解析
        if 'amazonaws.com' in url or 'railway.app' in url:
            # 尝试提取key参数
            import urllib.parse
            parsed = urllib.parse.urlparse(url)
            query_params = urllib.parse.parse_qs(parsed.query)
            if 'key' in query_params:
                return query_params['key'][0]

        return None

    def get_image_url(self, image_url_or_key: str) -> str:
        """获取图片访问URL

        Args:
            image_url_or_key: 图片URL或对象键名

        Returns:
            可访问的图片URL
        """
        if not self.config.is_enabled():
            raise RuntimeError("对象存储未启用")

        # 如果已经是URL，直接返回
        if image_url_or_key.startswith('http'):
            return image_url_or_key

        # 否则认为是对象键名，生成URL
        if self.config.public_url_prefix:
            return f"{self.config.public_url_prefix}/{image_url_or_key}"
        else:
            # 生成预签名URL
            return self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.config.bucket, 'Key': image_url_or_key},
                ExpiresIn=86400  # 24小时
            )

    def test_connection(self) -> Tuple[bool, Optional[str]]:
        """测试对象存储连接

        Returns:
            (是否成功, 错误信息)
        """
        if not self.config.is_enabled():
            return False, "对象存储未启用"

        try:
            # 尝试列出bucket（只获取一个对象）
            response = self.client.list_objects_v2(Bucket=self.config.bucket, MaxKeys=1)
            logger.info(f"对象存储连接测试成功: bucket={self.config.bucket}")
            return True, None
        except ClientError as e:
            error_msg = f"对象存储连接失败: {e}"
            logger.error(error_msg)
            return False, error_msg
        except Exception as e:
            error_msg = f"连接测试异常: {e}"
            logger.error(error_msg)
            return False, error_msg


# 全局存储服务实例
storage_config = ObjectStorageConfig()
storage_service = ObjectStorageService(storage_config)