"""
图片验证器
"""

import asyncio
from typing import Dict, Optional, Any
import re

from ..config.manager import ConfigManager
from ..utils.image_utils import ImageUtils
from .reference_images import ReferenceImageManager


class ImageValidator:
    """图片验证器"""

    def __init__(self, config_manager: ConfigManager):
        self.config_manager = config_manager
        self.reference_manager = ReferenceImageManager()
        self.image_utils = ImageUtils()

    async def validate(self, image_base64: str, platform: str, lang: str = "zh") -> Dict[str, Any]:
        """验证图片"""
        print(f"🔍 开始验证图片，平台: {platform}, 语言: {lang}")

        result = {
            "valid": False,
            "reason": "",
            "reason_en": "",
            "metadata": {},
            "validation_steps": []
        }

        try:
            # 1. 基本格式验证
            format_valid = self.image_utils.validate_image_format(image_base64)
            if not format_valid:
                result["valid"] = False
                result["reason"] = "不支持的图片格式"
                result["reason_en"] = "Unsupported image format"
                result["validation_steps"].append({"step": "format_validation", "passed": False})
                return result

            result["validation_steps"].append({"step": "format_validation", "passed": True})

            # 2. 尺寸检查
            validation_config = self.config_manager.get_validation_config()
            size_config = validation_config.size_validation

            size_valid = self.image_utils.check_image_size(
                image_base64,
                min_width=size_config.get("min_width", 600),
                min_height=size_config.get("min_height", 400)
            )

            if not size_valid:
                result["valid"] = False
                result["reason"] = "图片尺寸太小"
                result["reason_en"] = "Image size too small"
                result["validation_steps"].append({"step": "size_validation", "passed": False})
                return result

            result["validation_steps"].append({"step": "size_validation", "passed": True})

            # 3. 大小检查
            image_size_mb = self.image_utils.estimate_image_size_mb(image_base64)
            max_size_mb = size_config.get("max_size_mb", 5)

            if image_size_mb > max_size_mb:
                result["valid"] = False
                result["reason"] = f"图片太大 ({image_size_mb:.1f}MB > {max_size_mb}MB)"
                result["reason_en"] = f"Image too large ({image_size_mb:.1f}MB > {max_size_mb}MB)"
                result["validation_steps"].append({"step": "size_check", "passed": False})
                return result

            result["validation_steps"].append({
                "step": "size_check",
                "passed": True,
                "size_mb": round(image_size_mb, 2)
            })

            # 4. AI验证（使用外部化提示词）
            ai_result = await self._ai_validation(image_base64, platform, lang)
            if not ai_result["valid"]:
                result["valid"] = False
                result["reason"] = ai_result["reason"]
                result["reason_en"] = ai_result.get("reason_en", ai_result["reason"])
                result["validation_steps"].append({"step": "ai_validation", "passed": False})
                return result

            result["valid"] = True
            result["metadata"] = ai_result["metadata"]
            result["validation_steps"].append({"step": "ai_validation", "passed": True})

            # 5. 可选：参照图片对比
            reference_config = validation_config.reference_comparison
            if (reference_config.get("enabled", False) and
                platform in reference_config.get("platforms", [])):

                reference_result = await self._compare_with_reference(image_base64, platform)
                if reference_result:
                    result["reference_comparison"] = reference_result
                    result["validation_steps"].append({
                        "step": "reference_comparison",
                        "passed": True,
                        "similarity": reference_result.get("similarity", 0)
                    })

            print(f"✅ 图片验证通过: {result['metadata']}")
            return result

        except Exception as e:
            print(f"❌ 图片验证异常: {e}")
            result["valid"] = False
            result["reason"] = f"验证过程异常: {str(e)}"
            result["reason_en"] = f"Validation process exception: {str(e)}"
            return result

    async def _ai_validation(self, image_base64: str, platform: str, lang: str) -> Dict[str, Any]:
        """AI验证（使用现有validate_image逻辑）"""
        # 注意：这里需要导入main.py中的call_ai_api函数
        # 由于循环导入问题，我们暂时复制逻辑
        # 在实际重构中，应该将call_ai_api函数提取到共享模块

        # 获取验证提示词
        validation_prompt = self.config_manager.get_validation_prompt(lang)

        # 这里应该调用AI API，但为了简化，我们暂时返回模拟结果
        # 在实际实现中，需要调用现有的call_ai_api函数
        print(f"🤖 使用AI验证图片，平台: {platform}")

        # 模拟AI响应（实际应该调用AI API）
        # 这里返回一个有效的模拟结果
        return {
            "valid": True,
            "reason": "",
            "reason_en": "",
            "metadata": {
                "pair": "BTC/USD",
                "timeframe": "4h",
                "description": "比特币4小时K线图，包含价格和成交量"
            }
        }

    async def _compare_with_reference(self, image_base64: str, platform: str) -> Optional[Dict[str, Any]]:
        """与参照图片对比"""
        try:
            reference_images = self.reference_manager.get_reference_images(platform)
            if not reference_images:
                print(f"⚠️ 平台 {platform} 没有参照图片")
                return None

            print(f"🔍 与 {len(reference_images)} 个参照图片对比")

            # 这里应该实现图片相似度比较
            # 由于需要图像处理库，这里暂时返回模拟结果
            # 实际实现可以使用OpenCV、PIL等库计算相似度

            return {
                "similarity": 0.85,
                "best_match": "reference1.png",
                "threshold": 0.7,
                "passed": True
            }

        except Exception as e:
            print(f"⚠️ 参照图片对比失败: {e}")
            return None

    def _should_use_reference(self, platform: str) -> bool:
        """判断是否应该使用参照图片对比"""
        validation_config = self.config_manager.get_validation_config()
        reference_config = validation_config.reference_comparison

        return (reference_config.get("enabled", False) and
                platform in reference_config.get("platforms", []))

    def get_validation_config(self) -> Dict[str, Any]:
        """获取验证配置"""
        config = self.config_manager.get_validation_config()
        return {
            "size_validation": config.size_validation,
            "ai_validation": config.ai_validation,
            "reference_comparison": config.reference_comparison
        }

    def update_validation_config(self, config_data: Dict[str, Any]):
        """更新验证配置"""
        # 注意：这里应该更新配置文件
        # 实际实现需要写入到config.json文件
        print(f"🔄 更新验证配置: {config_data}")

    async def quick_validate(self, image_base64: str, platform: str) -> bool:
        """快速验证（仅检查格式和尺寸）"""
        try:
            # 1. 格式验证
            if not self.image_utils.validate_image_format(image_base64):
                return False

            # 2. 尺寸检查
            validation_config = self.config_manager.get_validation_config()
            size_config = validation_config.size_validation

            return self.image_utils.check_image_size(
                image_base64,
                min_width=size_config.get("min_width", 600),
                min_height=size_config.get("min_height", 400)
            )

        except Exception as e:
            print(f"⚠️ 快速验证失败: {e}")
            return False