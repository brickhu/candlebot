"""
配置管理模块
包含配置管理器和数据模型
"""

from .manager import ConfigManager
from .models import ConfigError

__all__ = ["ConfigManager", "ConfigError"]