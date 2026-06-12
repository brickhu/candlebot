# 老数据兼容性解决方案

## 概述

此解决方案提供了一套完整的工具和流程，用于处理老数据的兼容性问题，特别是：

1. **字段缺失问题**：如`visibility`字段是后来添加的
2. **JSON格式不一致**：老数据中的JSON字段可能存储为字符串
3. **默认值问题**：老数据可能缺少某些字段的默认值
4. **数据库类型差异**：SQLite和PostgreSQL的兼容性

## 工具集

### 1. 迁移管理工具 (`migration_manager.py`)

统一的数据库迁移管理系统，支持：
- 渐进式迁移
- 版本管理
- 回滚机制
- 迁移验证

#### 使用方法：
```bash
# 查看当前状态
python migration_manager.py --action status

# 查看待处理迁移
python migration_manager.py --action pending

# 应用所有待处理迁移
python migration_manager.py --action run-all

# 创建新迁移
python migration_manager.py --action create --description "添加新字段"

# 回滚到指定版本
python migration_manager.py --action rollback --version 002_add_visibility_field

# 查看迁移历史
python migration_manager.py --action history
```

### 2. 数据验证工具 (`data_validator.py`)

数据完整性检查和修复工具：
- 表结构验证
- 数据完整性检查
- JSON格式验证
- 自动修复常见问题

#### 使用方法：
```bash
# 生成验证报告
python data_validator.py --report-only

# 验证并修复所有问题
python data_validator.py --fix

# 验证特定表
python data_validator.py --table analysis_records --fix
```

### 3. 紧急修复工具 (`emergency_fix.py`)

处理最紧急的兼容性问题：
- 检查并修复`visibility`字段
- 修复JSON字段格式
- 修复用户数据问题
- 自动创建备份

#### 使用方法：
```bash
# 运行所有修复（自动创建备份）
python emergency_fix.py

# 运行所有修复（不创建备份）
python emergency_fix.py --no-backup

# 只修复特定问题
python emergency_fix.py --fix visibility
python emergency_fix.py --fix json
python emergency_fix.py --fix users
```

## 迁移文件

迁移文件位于 `migrations/` 目录：

### `001_initial_schema.sql`
- 创建基本表结构
- 用户表、分析记录表、对话表
- 索引和触发器

### `002_add_visibility_field.sql`
- 添加`visibility`字段到`analysis_records`表
- 为现有记录设置默认值
- 创建相关索引

### `003_add_oauth_fields.sql`
- 添加OAuth相关字段到`users`表
- 更新`password_hash`字段为可空
- 创建索引

## 集成到启动流程

新的 `start.sh` 脚本已集成所有工具：

1. **数据库连接检查**
2. **Alembic迁移**（如果存在）
3. **迁移管理系统**
4. **数据验证和修复**
5. **紧急修复**
6. **启动服务**

## 兼容性代码

现有的API代码已经包含兼容性处理：

### 1. 动态字段检查
```python
# 检查visibility字段是否存在
check_sql = text("""
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'analysis_records'
    AND column_name = 'visibility'
""")
```

### 2. 条件SQL构建
```python
# 根据字段存在情况构建不同的SQL
if has_visibility:
    sql_base = """SELECT ..., visibility, ..."""
else:
    sql_base = """SELECT ..., 'private' as visibility, ..."""
```

### 3. JSON解析函数
```python
def parse_json_field(value: Any) -> dict:
    """解析JSON字段，处理字符串或字典类型"""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value) if value.strip() else {}
        except json.JSONDecodeError:
            return {}
    return {}
```

## 实施策略

### 阶段1：只读兼容性（立即）
- 保持老数据可读
- 新写入的数据使用新格式
- 代码处理格式差异

### 阶段2：数据迁移（1-2周）
- 批量迁移老数据到新格式
- 保持数据一致性
- 提供回滚机制

### 阶段3：完全迁移（1个月）
- 所有数据使用新格式
- 移除兼容性代码
- 优化性能

## 监控和日志

### 迁移日志
- 所有迁移操作都被记录到`schema_migrations`表
- 包含版本、描述、时间戳、状态和校验和

### 验证报告
- 数据验证工具生成详细的JSON报告
- 包含发现的问题和修复建议
- 报告保存为时间戳文件

### 备份机制
- 紧急修复前自动创建备份
- 备份文件保存在`backups/`目录
- 支持SQLite和PostgreSQL

## 风险缓解

### 1. 数据丢失风险
- ✅ 实施前自动备份
- ✅ 提供回滚机制
- ✅ 分阶段实施

### 2. 性能影响
- ✅ 监控兼容性代码性能
- ✅ 逐步优化
- ✅ 使用缓存减少开销

### 3. 业务中断
- ✅ 在低流量时段实施
- ✅ 提供维护窗口
- ✅ 保持服务降级能力

## 成功标准

1. ✅ 所有老数据可正常访问
2. ✅ 新数据使用标准格式
3. ✅ 迁移过程零数据丢失
4. ✅ 性能影响在可接受范围内
5. ✅ 有完整的回滚机制
6. ✅ 迁移过程可监控和审计

## 紧急情况处理

如果遇到紧急兼容性问题：

1. **立即运行紧急修复**：
   ```bash
   python emergency_fix.py
   ```

2. **检查数据完整性**：
   ```bash
   python data_validator.py --report-only
   ```

3. **查看迁移状态**：
   ```bash
   python migration_manager.py --action status
   ```

4. **如果需要回滚**：
   ```bash
   python migration_manager.py --action rollback --version <目标版本>
   ```

## 维护指南

### 添加新字段
1. 创建迁移文件：
   ```bash
   python migration_manager.py --action create --description "添加新字段"
   ```

2. 编辑生成的迁移文件
3. 测试迁移：
   ```bash
   python migration_manager.py --action run-all
   ```

### 修复数据问题
1. 运行数据验证：
   ```bash
   python data_validator.py --report-only
   ```

2. 查看报告并决定修复策略
3. 执行修复：
   ```bash
   python data_validator.py --fix
   ```

### 监控迁移状态
```bash
# 查看当前状态
python migration_manager.py --action status

# 查看迁移历史
python migration_manager.py --action history

# 验证迁移完整性
python migration_manager.py --action validate
```

## 故障排除

### 常见问题

#### 1. 迁移失败
- 检查数据库连接
- 查看迁移日志
- 验证SQL语法

#### 2. 数据验证失败
- 检查JSON格式
- 验证外键关系
- 检查必需字段

#### 3. 性能问题
- 监控迁移过程
- 分批处理大数据量
- 优化索引

### 获取帮助
- 查看详细的验证报告
- 检查迁移日志
- 使用`--help`参数查看工具用法

## 未来改进

### 短期（1-2周）
- 添加更多数据验证规则
- 优化迁移性能
- 增强错误处理

### 中期（1个月）
- 实现Web管理界面
- 添加实时监控
- 集成到CI/CD流程

### 长期（3个月）
- 完全自动化迁移
- 智能数据修复
- 预测性维护