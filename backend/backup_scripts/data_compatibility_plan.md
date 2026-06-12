# 老数据兼容性解决方案

## 问题概述
当前系统需要处理老数据的兼容性问题，特别是：
1. 老数据可能缺少新添加的字段（如`visibility`）
2. JSON字段格式可能不一致
3. 需要支持渐进式迁移而不丢失数据

## 已实施的兼容性措施

### 1. 代码层兼容性
- **动态字段检查**：在`analysis.py`中检查字段是否存在
- **条件SQL构建**：根据字段存在情况构建不同的SQL
- **JSON解析函数**：`parse_json_field`处理字符串/字典JSON
- **默认值处理**：为缺失字段提供默认值

### 2. 迁移脚本
- `add_visibility_field.py` - 添加visibility字段
- `simple_migration.py` - 简单表结构迁移
- `fix_visibility_now.py` - 紧急修复脚本

## 系统化兼容性解决方案

### 1. 创建统一的迁移管理系统

#### 1.1 数据库版本表
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)  -- 用于验证迁移文件完整性
);
```

#### 1.2 迁移脚本目录结构
```
migrations/
├── 001_initial_schema.sql
├── 002_add_visibility_field.sql
├── 003_add_oauth_fields.sql
├── 004_fix_json_format.sql
└── 005_data_cleanup.sql
```

### 2. 增强数据验证

#### 2.1 数据完整性检查脚本
```python
def validate_data_integrity(db):
    """验证数据完整性"""
    issues = []

    # 检查必需字段
    issues.extend(check_required_fields(db))

    # 检查JSON格式
    issues.extend(check_json_fields(db))

    # 检查外键关系
    issues.extend(check_foreign_keys(db))

    return issues
```

#### 2.2 数据清理脚本
```python
def cleanup_old_data(db):
    """清理和修复老数据"""
    # 1. 为NULL字段设置默认值
    fix_null_fields(db)

    # 2. 修复JSON格式
    fix_json_fields(db)

    # 3. 更新索引和约束
    update_indexes(db)
```

### 3. 渐进式迁移策略

#### 3.1 阶段1：只读兼容性
- 保持老数据可读
- 新写入的数据使用新格式
- 代码处理格式差异

#### 3.2 阶段2：数据迁移
- 批量迁移老数据到新格式
- 保持数据一致性
- 提供回滚机制

#### 3.3 阶段3：完全迁移
- 所有数据使用新格式
- 移除兼容性代码
- 优化性能

### 4. 具体实施步骤

#### 步骤1：创建迁移管理工具
```python
# migration_manager.py
class MigrationManager:
    def __init__(self, db_url):
        self.db_url = db_url
        self.engine = create_engine(db_url)

    def get_current_version(self):
        """获取当前数据库版本"""

    def apply_migration(self, migration_file):
        """应用单个迁移"""

    def rollback_migration(self, version):
        """回滚到指定版本"""

    def validate_migrations(self):
        """验证所有迁移"""
```

#### 步骤2：创建数据验证工具
```python
# data_validator.py
class DataValidator:
    def validate_table(self, table_name):
        """验证表数据"""

    def fix_common_issues(self):
        """修复常见问题"""

    def generate_report(self):
        """生成验证报告"""
```

#### 步骤3：创建兼容性中间件
```python
# compatibility_middleware.py
class CompatibilityMiddleware:
    """处理老数据格式的中间件"""

    def process_query(self, query):
        """处理查询兼容性"""

    def process_result(self, result):
        """处理结果兼容性"""

    def process_insert(self, data):
        """处理插入数据兼容性"""
```

### 5. 紧急修复方案

#### 5.1 字段缺失紧急修复
```sql
-- 检查并添加缺失字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'analysis_records'
        AND column_name = 'visibility'
    ) THEN
        ALTER TABLE analysis_records ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';
    END IF;
END $$;
```

#### 5.2 JSON格式修复
```sql
-- 修复无效的JSON数据
UPDATE analysis_records
SET analysis_metadata = '{}'
WHERE analysis_metadata IS NULL OR analysis_metadata = '';

UPDATE analysis_records
SET report_data = '{}'
WHERE report_data IS NULL OR report_data = '';
```

### 6. 监控和日志

#### 6.1 迁移日志
```python
class MigrationLogger:
    def log_migration(self, version, success, details):
        """记录迁移日志"""

    def get_migration_history(self):
        """获取迁移历史"""

    def check_consistency(self):
        """检查数据一致性"""
```

#### 6.2 性能监控
```python
class PerformanceMonitor:
    def monitor_compatibility_overhead(self):
        """监控兼容性代码的性能开销"""

    def suggest_optimizations(self):
        """建议优化方案"""
```

## 实施优先级

### 高优先级（立即实施）
1. 创建统一的迁移管理工具
2. 添加数据完整性检查
3. 实施紧急修复脚本

### 中优先级（1-2周内）
1. 创建数据验证工具
2. 实施渐进式迁移策略
3. 添加监控和日志

### 低优先级（1个月内）
1. 优化兼容性代码性能
2. 移除过时的兼容性代码
3. 完全迁移到新格式

## 风险缓解

### 1. 数据丢失风险
- 实施前备份所有数据
- 提供回滚机制
- 分阶段实施

### 2. 性能影响
- 监控兼容性代码性能
- 逐步优化
- 使用缓存减少开销

### 3. 业务中断
- 在低流量时段实施
- 提供维护窗口
- 保持服务降级能力

## 成功标准

1. ✅ 所有老数据可正常访问
2. ✅ 新数据使用标准格式
3. ✅ 迁移过程零数据丢失
4. ✅ 性能影响在可接受范围内
5. ✅ 有完整的回滚机制
6. ✅ 迁移过程可监控和审计