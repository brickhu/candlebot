"""
简化的提示词管理器
替代复杂的技能系统，提供直接的提示词配置功能
"""
import os
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
import hashlib


class PromptConfigError(Exception):
    """提示词配置错误"""
    pass


class PromptManager:
    """简化的提示词管理器"""

    def __init__(self, base_path: str = "ai/prompts"):
        self.base_path = Path(base_path)
        self.cache: Dict[str, str] = {}
        self.config_cache: Dict[str, Any] = {}

        # 确保基础目录存在
        if not self.base_path.exists():
            raise PromptConfigError(f"提示词目录不存在: {self.base_path}")

        print(f"✅ 提示词管理器初始化完成，基础路径: {self.base_path}")

    def _get_cache_key(self, category: str, name: str, lang: str) -> str:
        """生成缓存键"""
        return f"{category}:{name}:{lang}"

    def _load_file_content(self, file_path: Path) -> str:
        """加载文件内容"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            raise PromptConfigError(f"文件不存在: {file_path}")
        except Exception as e:
            raise PromptConfigError(f"读取文件失败 {file_path}: {str(e)}")

    def _save_file_content(self, file_path: Path, content: str) -> bool:
        """保存文件内容"""
        try:
            # 确保目录存在
            file_path.parent.mkdir(parents=True, exist_ok=True)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            # 清除相关缓存
            self._clear_related_cache(file_path)
            return True
        except Exception as e:
            raise PromptConfigError(f"保存文件失败 {file_path}: {str(e)}")

    def _clear_related_cache(self, file_path: Path):
        """清除相关缓存"""
        # 根据文件路径确定缓存键并清除
        relative_path = file_path.relative_to(self.base_path)
        parts = relative_path.parts

        if len(parts) >= 3:  # platforms/aggr/zh.md
            category, name, filename = parts[0], parts[1], parts[2]
            if filename.endswith('.md'):
                lang = filename[:-3]  # 移除 .md 后缀
                cache_key = self._get_cache_key(category, name, lang)
                if cache_key in self.cache:
                    del self.cache[cache_key]
                    print(f"🧹 清除缓存: {cache_key}")

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

    def save_prompt(self, category: str, name: str, lang: str, content: str) -> bool:
        """保存提示词"""
        # 构建文件路径
        file_path = self.base_path / category / name / f"{lang}.md"

        # 保存内容
        success = self._save_file_content(file_path, content)

        if success:
            print(f"💾 保存提示词: {category}/{name}/{lang}")
            # 更新缓存
            cache_key = self._get_cache_key(category, name, lang)
            self.cache[cache_key] = content

        return success

    def get_validation_prompt(self, lang: str = "zh") -> str:
        """获取验证提示词"""
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

    def get_enhanced_prompt(self, platform: str, lang: str = "zh") -> str:
        """获取增强版提示词（输出格式已包含示例）"""
        # 直接使用组合提示词，因为输出格式已经包含了完整的示例
        return self.get_combined_prompt(platform, lang)

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

    def get_platform_info(self, platform: str) -> Dict[str, Any]:
        """获取平台信息"""
        try:
            # 检查平台是否存在
            if platform not in self.list_platforms():
                return {
                    "error": f"平台不存在: {platform}",
                    "exists": False
                }

            # 获取支持的语言
            languages = self.list_supported_languages("platforms", platform)

            # 获取文件信息
            platform_dir = self.base_path / "platforms" / platform
            files = []
            total_size = 0

            for file in platform_dir.iterdir():
                if file.is_file():
                    stat = file.stat()
                    files.append({
                        "name": file.name,
                        "size": stat.st_size,
                        "modified": stat.st_mtime,
                        "type": "config" if file.suffix == ".json" else "prompt"
                    })
                    total_size += stat.st_size

            # 获取提示词预览
            prompt_preview = {}
            for lang in languages[:2]:  # 只预览前两种语言
                try:
                    prompt = self.get_platform_prompt(platform, lang)
                    prompt_preview[lang] = {
                        "length": len(prompt),
                        "preview": prompt[:100] + "..." if len(prompt) > 100 else prompt
                    }
                except Exception:
                    prompt_preview[lang] = {"error": "无法加载提示词"}

            return {
                "name": platform,
                "exists": True,
                "languages": languages,
                "files": files,
                "total_size": total_size,
                "prompt_preview": prompt_preview,
                "directory": str(platform_dir)
            }

        except Exception as e:
            return {
                "error": str(e),
                "exists": False
            }

    def create_platform(self, platform: str, description: str = "") -> bool:
        """创建新平台"""
        try:
            platform_dir = self.base_path / "platforms" / platform

            # 检查是否已存在
            if platform_dir.exists():
                raise PromptConfigError(f"平台已存在: {platform}")

            # 创建目录
            platform_dir.mkdir(parents=True)

            # 创建默认提示词文件
            default_prompt = f"""你是 Candlebot · K线专家，专门解读 {platform} 的行情截图，用小白也能看懂的语言输出分析报告。

从截图识别以下指标：
- 交易对、时间周期、当前价格
- K线形态与趋势
- 关键支撑阻力位
- 成交量情况
- 其他可见技术指标

请按照输出格式要求进行分析。"""

            # 创建中文提示词
            zh_file = platform_dir / "zh.md"
            with open(zh_file, 'w', encoding='utf-8') as f:
                f.write(default_prompt)

            # 创建英文提示词
            en_prompt = f"""You are Candlebot · Candlestick Expert, specialized in analyzing {platform} chart screenshots, output analysis reports in easy-to-understand language.

Identify the following indicators from the screenshot:
- Trading pair, timeframe, current price
- Candlestick patterns and trends
- Key support and resistance levels
- Volume situation
- Other visible technical indicators

Please analyze according to the output format requirements."""

            en_file = platform_dir / "en.md"
            with open(en_file, 'w', encoding='utf-8') as f:
                f.write(en_prompt)

            print(f"✅ 创建平台: {platform}")
            return True

        except Exception as e:
            print(f"❌ 创建平台失败: {platform}, error: {e}")
            return False

    def delete_platform(self, platform: str) -> bool:
        """删除平台"""
        try:
            platform_dir = self.base_path / "platforms" / platform

            # 检查是否存在
            if not platform_dir.exists():
                raise PromptConfigError(f"平台不存在: {platform}")

            # 删除目录
            import shutil
            shutil.rmtree(platform_dir)

            # 清除相关缓存
            for cache_key in list(self.cache.keys()):
                if f"platforms:{platform}" in cache_key:
                    del self.cache[cache_key]

            print(f"🗑️  删除平台: {platform}")
            return True

        except Exception as e:
            print(f"❌ 删除平台失败: {platform}, error: {e}")
            return False

    def clear_cache(self):
        """清空缓存"""
        self.cache.clear()
        self.config_cache.clear()
        print("🧹 提示词缓存已清空")

    def reload_platform(self, platform: str):
        """重新加载平台配置"""
        # 清除相关缓存
        keys_to_remove = [k for k in self.cache.keys() if f"platforms:{platform}" in k]
        for key in keys_to_remove:
            del self.cache[key]

        print(f"🔄 重新加载平台: {platform}")

    def get_directory_structure(self) -> Dict[str, Any]:
        """获取目录结构"""
        def scan_directory(path: Path, level: int = 0):
            result = {
                "name": path.name,
                "path": str(path.relative_to(self.base_path) if path != self.base_path else "."),
                "is_dir": path.is_dir(),
                "level": level
            }

            if path.is_dir():
                result["children"] = []
                try:
                    for child in sorted(path.iterdir()):
                        if child.name.startswith("."):
                            continue
                        result["children"].append(scan_directory(child, level + 1))
                except Exception as e:
                    result["error"] = str(e)
            else:
                result["size"] = path.stat().st_size
                result["modified"] = path.stat().st_mtime
                result["extension"] = path.suffix

            return result

        return scan_directory(self.base_path)


# 全局实例
_prompt_manager: Optional[PromptManager] = None


def get_prompt_manager() -> PromptManager:
    """获取全局提示词管理器实例"""
    global _prompt_manager

    if _prompt_manager is None:
        _prompt_manager = PromptManager()

    return _prompt_manager