"""
缓存管理器
"""

import time
from typing import Any, Dict, Optional
from collections import OrderedDict


class CacheManager:
    """简单的缓存管理器"""

    def __init__(self, max_size: int = 100, ttl: int = 3600):
        """
        初始化缓存管理器

        Args:
            max_size: 最大缓存条目数
            ttl: 缓存存活时间（秒）
        """
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.max_size = max_size
        self.ttl = ttl

    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        if key not in self.cache:
            return None

        entry = self.cache[key]
        timestamp = entry.get("timestamp", 0)

        # 检查是否过期
        if time.time() - timestamp > self.ttl:
            del self.cache[key]
            return None

        # 更新访问顺序
        self.cache.move_to_end(key)
        return entry.get("value")

    def set(self, key: str, value: Any):
        """设置缓存值"""
        # 如果缓存已满，移除最旧的条目
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)

        self.cache[key] = {
            "value": value,
            "timestamp": time.time()
        }

    def delete(self, key: str):
        """删除缓存值"""
        if key in self.cache:
            del self.cache[key]

    def clear(self):
        """清空缓存"""
        self.cache.clear()

    def size(self) -> int:
        """获取缓存大小"""
        return len(self.cache)

    def cleanup(self):
        """清理过期缓存"""
        current_time = time.time()
        keys_to_delete = []

        for key, entry in self.cache.items():
            timestamp = entry.get("timestamp", 0)
            if current_time - timestamp > self.ttl:
                keys_to_delete.append(key)

        for key in keys_to_delete:
            del self.cache[key]

        if keys_to_delete:
            print(f"🧹 清理了 {len(keys_to_delete)} 个过期缓存条目")

    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        self.cleanup()  # 先清理过期缓存

        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "ttl": self.ttl,
            "hit_rate": 0  # 需要记录命中率时需要额外实现
        }