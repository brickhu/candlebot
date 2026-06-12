"""
配置数据模型
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json
from pathlib import Path


class ConfigError(Exception):
    """配置相关异常"""
    pass


@dataclass
class PlatformConfig:
    """平台配置"""
    name: str
    description: str
    supported_languages: List[str]
    features: List[str]
    validation_requirements: Dict[str, Any]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PlatformConfig':
        """从字典创建平台配置"""
        return cls(
            name=data.get("name", ""),
            description=data.get("description", ""),
            supported_languages=data.get("supported_languages", ["zh", "en"]),
            features=data.get("features", []),
            validation_requirements=data.get("validation_requirements", {})
        )

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "name": self.name,
            "description": self.description,
            "supported_languages": self.supported_languages,
            "features": self.features,
            "validation_requirements": self.validation_requirements
        }


@dataclass
class ValidationConfig:
    """验证配置"""
    size_validation: Dict[str, Any]
    ai_validation: Dict[str, Any]
    reference_comparison: Dict[str, Any]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ValidationConfig':
        """从字典创建验证配置"""
        return cls(
            size_validation=data.get("size_validation", {
                "min_width": 600,
                "min_height": 400,
                "max_size_mb": 5
            }),
            ai_validation=data.get("ai_validation", {
                "max_tokens": 100,
                "temperature": 0.1
            }),
            reference_comparison=data.get("reference_comparison", {
                "enabled": True,
                "threshold": 0.7,
                "platforms": ["aggr", "tradingview"]
            })
        )

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "size_validation": self.size_validation,
            "ai_validation": self.ai_validation,
            "reference_comparison": self.reference_comparison
        }


@dataclass
class OutputFormatConfig:
    """输出格式配置"""
    name: str
    description: str
    supported_languages: List[str]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'OutputFormatConfig':
        """从字典创建输出格式配置"""
        return cls(
            name=data.get("name", "output_format"),
            description=data.get("description", "输出格式模板"),
            supported_languages=data.get("supported_languages", ["zh", "en"])
        )

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "name": self.name,
            "description": self.description,
            "supported_languages": self.supported_languages
        }