-- 为analysis_records表添加visibility字段
-- 在Railway数据库控制台或任何PostgreSQL客户端执行此脚本

-- 1. 检查字段是否已存在
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'analysis_records'
AND column_name = 'visibility';

-- 如果上述查询返回空结果，执行以下语句：

-- 2. 添加visibility字段
ALTER TABLE analysis_records
ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';

-- 3. 为visibility字段创建索引（提高查询性能）
CREATE INDEX idx_analysis_records_visibility
ON analysis_records(visibility);

-- 4. 更新现有记录的visibility字段（默认为private）
UPDATE analysis_records
SET visibility = 'private'
WHERE visibility IS NULL;

-- 5. 验证字段已添加
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'analysis_records'
ORDER BY ordinal_position;

-- 6. 验证数据
SELECT
    id,
    user_id,
    platform,
    visibility,
    created_at
FROM analysis_records
LIMIT 10;