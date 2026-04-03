"""
参照图片管理器
"""

import os
import base64
from pathlib import Path
from typing import List, Dict, Optional
import json


class ReferenceImageManager:
    """参照图片管理器"""

    def __init__(self, base_path: str = "ai/validation/images"):
        self.base_path = Path(base_path)

        # 确保基础目录存在
        if not self.base_path.exists():
            self.base_path.mkdir(parents=True, exist_ok=True)
            print(f"📁 创建参照图片目录: {self.base_path}")

        # 加载参照图片索引
        self.index_file = self.base_path / "index.json"
        self.index = self._load_index()

    def _load_index(self) -> Dict[str, List[str]]:
        """加载参照图片索引"""
        if self.index_file.exists():
            try:
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ 加载参照图片索引失败: {e}")
                return {}
        else:
            # 创建初始索引
            initial_index = {}
            self._save_index(initial_index)
            return initial_index

    def _save_index(self, index: Dict[str, List[str]]):
        """保存参照图片索引"""
        try:
            with open(self.index_file, 'w', encoding='utf-8') as f:
                json.dump(index, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ 保存参照图片索引失败: {e}")

    def get_reference_images(self, platform: str) -> List[str]:
        """获取平台参照图片（base64编码）"""
        platform_dir = self.base_path / platform

        if not platform_dir.exists():
            print(f"⚠️ 平台参照图片目录不存在: {platform_dir}")
            return []

        images = []
        for file in platform_dir.iterdir():
            if file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
                try:
                    with open(file, 'rb') as f:
                        image_data = f.read()
                        image_base64 = base64.b64encode(image_data).decode('utf-8')
                        images.append(image_base64)
                        print(f"📸 加载参照图片: {file.name}")
                except Exception as e:
                    print(f"⚠️ 加载参照图片失败 {file}: {e}")

        return images

    def add_reference_image(self, platform: str, image_base64: str, name: str):
        """添加参照图片"""
        platform_dir = self.base_path / platform
        platform_dir.mkdir(parents=True, exist_ok=True)

        # 确定文件扩展名
        # 简单检测：如果是PNG格式
        if image_base64.startswith('iVBOR'):
            ext = '.png'
        else:
            ext = '.jpg'  # 默认使用jpg

        file_path = platform_dir / f"{name}{ext}"

        try:
            # 解码base64并保存
            image_data = base64.b64decode(image_base64)
            with open(file_path, 'wb') as f:
                f.write(image_data)

            # 更新索引
            if platform not in self.index:
                self.index[platform] = []

            if name not in self.index[platform]:
                self.index[platform].append(name)
                self._save_index(self.index)

            print(f"✅ 添加参照图片: {platform}/{name}{ext}")
            return True

        except Exception as e:
            print(f"❌ 添加参照图片失败: {e}")
            return False

    def remove_reference_image(self, platform: str, name: str):
        """删除参照图片"""
        platform_dir = self.base_path / platform

        if not platform_dir.exists():
            print(f"⚠️ 平台目录不存在: {platform_dir}")
            return False

        # 查找并删除文件
        deleted = False
        for ext in ['.png', '.jpg', '.jpeg', '.webp']:
            file_path = platform_dir / f"{name}{ext}"
            if file_path.exists():
                try:
                    file_path.unlink()
                    deleted = True
                    print(f"🗑️ 删除参照图片: {file_path}")
                    break
                except Exception as e:
                    print(f"⚠️ 删除参照图片失败 {file_path}: {e}")

        # 更新索引
        if platform in self.index and name in self.index[platform]:
            self.index[platform].remove(name)
            self._save_index(self.index)

        return deleted

    def list_platforms(self) -> List[str]:
        """列出所有有参照图片的平台"""
        platforms = []
        for item in self.base_path.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                # 检查目录中是否有图片文件
                has_images = any(
                    file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']
                    for file in item.iterdir()
                )
                if has_images:
                    platforms.append(item.name)

        return sorted(platforms)

    def list_reference_images(self, platform: str) -> List[str]:
        """列出平台的所有参照图片"""
        platform_dir = self.base_path / platform

        if not platform_dir.exists():
            return []

        images = []
        for file in platform_dir.iterdir():
            if file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
                images.append(file.stem)

        return sorted(images)

    def get_reference_count(self, platform: str) -> int:
        """获取平台的参照图片数量"""
        platform_dir = self.base_path / platform

        if not platform_dir.exists():
            return 0

        count = 0
        for file in platform_dir.iterdir():
            if file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
                count += 1

        return count

    def clear_platform_references(self, platform: str):
        """清空平台的参照图片"""
        platform_dir = self.base_path / platform

        if not platform_dir.exists():
            print(f"⚠️ 平台目录不存在: {platform_dir}")
            return

        deleted_count = 0
        for file in platform_dir.iterdir():
            if file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
                try:
                    file.unlink()
                    deleted_count += 1
                except Exception as e:
                    print(f"⚠️ 删除文件失败 {file}: {e}")

        # 更新索引
        if platform in self.index:
            self.index[platform] = []
            self._save_index(self.index)

        print(f"🗑️ 清空了 {platform} 平台的 {deleted_count} 个参照图片")