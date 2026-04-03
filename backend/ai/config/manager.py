"""
配置管理器
负责加载和管理外部化的提示词配置
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
import hashlib

from .models import ConfigError, PlatformConfig, ValidationConfig, OutputFormatConfig


class ConfigManager:
    """提示词配置管理器"""

    def __init__(self, base_path: str = "ai/prompts"):
        self.base_path = Path(base_path)
        self.cache: Dict[str, str] = {}
        self.config_cache: Dict[str, Any] = {}

        # 确保基础目录存在
        if not self.base_path.exists():
            raise ConfigError(f"配置目录不存在: {self.base_path}")

        print(f"✅ 配置管理器初始化完成，基础路径: {self.base_path}")

    def _get_cache_key(self, category: str, name: str, lang: str) -> str:
        """生成缓存键"""
        return f"{category}:{name}:{lang}"

    def _load_file_content(self, file_path: Path) -> str:
        """加载文件内容"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            raise ConfigError(f"文件不存在: {file_path}")
        except Exception as e:
            raise ConfigError(f"读取文件失败 {file_path}: {str(e)}")

    def _load_json_config(self, file_path: Path) -> Dict[str, Any]:
        """加载JSON配置文件"""
        try:
            content = self._load_file_content(file_path)
            return json.loads(content)
        except json.JSONDecodeError as e:
            raise ConfigError(f"JSON解析失败 {file_path}: {str(e)}")

    def load_prompt(self, category: str, name: str, lang: str = "zh") -> str:
        """加载指定分类和语言的提示词"""
        cache_key = self._get_cache_key(category, name, lang)

        # 检查缓存
        if cache_key in self.cache:
            return self.cache[cache_key]

        # 构建文件路径
        file_path = self.base_path / category / name / f"{lang}.md"

        # 如果指定语言的文件不存在，尝试使用默认语言（zh）
        if not file_path.exists() and lang != "zh":
            file_path = self.base_path / category / name / "zh.md"

        # 加载内容
        content = self._load_file_content(file_path)

        # 缓存结果
        self.cache[cache_key] = content
        print(f"📄 加载提示词: {category}/{name}/{lang}")

        return content

    def get_validation_prompt(self, lang: str = "zh") -> str:
        """获取验证提示词"""
        # 验证提示词在 validation/validation/ 目录下
        return self.load_prompt("validation", "validation", lang)

    def get_platform_prompt(self, platform: str, lang: str = "zh") -> str:
        """获取平台分析提示词"""
        return self.load_prompt("platforms", platform, lang)

    def get_output_format(self, lang: str = "zh") -> str:
        """获取输出格式模板"""
        return self.load_prompt("output_format", "output_format", lang)

    def get_combined_prompt(self, platform: str, lang: str = "zh") -> str:
        """获取组合提示词（平台提示词 + 输出格式 + 语言指令）"""
        platform_prompt = self.get_platform_prompt(platform, lang)
        output_format = self.get_output_format(lang)

        # 添加语言指令
        lang_note = "请用中文输出报告。" if lang == "zh" else "Please output the report in English."

        return f"{platform_prompt}\n\n{output_format}\n\n{lang_note}"

    def get_platform_config(self, platform: str) -> PlatformConfig:
        """获取平台配置"""
        cache_key = f"platform_config:{platform}"

        if cache_key in self.config_cache:
            return self.config_cache[cache_key]

        config_path = self.base_path / "platforms" / platform / "config.json"
        if not config_path.exists():
            # 返回默认配置
            config = PlatformConfig(
                name=platform,
                description=f"{platform}交易平台",
                supported_languages=["zh", "en"],
                features=[],
                validation_requirements={
                    "min_width": 600,
                    "aspect_ratio": [1.5, 2.5],
                    "required_elements": ["K线图", "价格轴", "时间轴"]
                }
            )
        else:
            config_data = self._load_json_config(config_path)
            config = PlatformConfig.from_dict(config_data)

        self.config_cache[cache_key] = config
        return config

    def get_validation_config(self) -> ValidationConfig:
        """获取验证配置"""
        cache_key = "validation_config"

        if cache_key in self.config_cache:
            return self.config_cache[cache_key]

        config_path = self.base_path / "validation" / "config.json"
        if not config_path.exists():
            # 返回默认配置
            config = ValidationConfig.from_dict({})
        else:
            config_data = self._load_json_config(config_path)
            config = ValidationConfig.from_dict(config_data)

        self.config_cache[cache_key] = config
        return config

    def get_output_format_config(self) -> OutputFormatConfig:
        """获取输出格式配置"""
        cache_key = "output_format_config"

        if cache_key in self.config_cache:
            return self.config_cache[cache_key]

        config_path = self.base_path / "output_format" / "config.json"
        if not config_path.exists():
            # 返回默认配置
            config = OutputFormatConfig.from_dict({})
        else:
            config_data = self._load_json_config(config_path)
            config = OutputFormatConfig.from_dict(config_data)

        self.config_cache[cache_key] = config
        return config

    def list_platforms(self) -> List[str]:
        """列出所有支持的平台"""
        platforms_dir = self.base_path / "platforms"
        if not platforms_dir.exists():
            return []

        platforms = []
        for item in platforms_dir.iterdir():
            if item.is_dir() and not item.name.startswith("."):
                platforms.append(item.name)

        return sorted(platforms)

    def list_supported_languages(self, category: str, name: str) -> List[str]:
        """列出指定分类支持的语言"""
        target_dir = self.base_path / category / name
        if not target_dir.exists():
            return ["zh"]  # 默认支持中文

        languages = []
        for file in target_dir.iterdir():
            if file.suffix == ".md":
                lang = file.stem
                if lang not in languages:
                    languages.append(lang)

        return sorted(languages) if languages else ["zh"]

    def clear_cache(self):
        """清空缓存"""
        self.cache.clear()
        self.config_cache.clear()
        print("🧹 配置缓存已清空")

    def reload_config(self, platform: Optional[str] = None):
        """重新加载配置"""
        if platform:
            # 清除特定平台的缓存
            keys_to_remove = [k for k in self.cache.keys() if f"platforms:{platform}" in k]
            for key in keys_to_remove:
                del self.cache[key]

            config_keys_to_remove = [k for k in self.config_cache.keys() if f"platform_config:{platform}" in k]
            for key in config_keys_to_remove:
                del self.config_cache[key]

            print(f"🔄 重新加载平台配置: {platform}")
        else:
            # 清除所有缓存
            self.clear_cache()
            print("🔄 重新加载所有配置")