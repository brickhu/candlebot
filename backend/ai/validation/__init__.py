"""
图片验证模块
包含图片验证器和参照图片管理
"""

from .validator import ImageValidator
from .reference_images import ReferenceImageManager

__all__ = ["ImageValidator", "ReferenceImageManager"]