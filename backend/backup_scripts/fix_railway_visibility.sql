-- 修复 Railway 环境中缺少 visibility 列的问题
-- 在 Railway PostgreSQL 控制台中运行此脚本

-- 检查 visibility 列是否存在
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'analysis_records'
AND column_name = 'visibility';

-- 如果上述查询返回空结果，运行以下命令添加列：
ALTER TABLE analysis_records
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private';

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_analysis_records_visibility
ON analysis_records(visibility);

-- 更新现有记录
UPDATE analysis_records
SET visibility = 'private'
WHERE visibility IS NULL;

-- 验证修复
SELECT
    COUNT(*) as total_records,
    COUNT(CASE WHEN visibility = 'private' THEN 1 END) as private_records,
    COUNT(CASE WHEN visibility = 'public' THEN 1 END) as public_records
FROM analysis_records;