-- 添加visibility字段到analysis_records表
-- 迁移ID: 002_add_visibility_field
-- 创建时间: 2026-04-02

-- 添加visibility字段
ALTER TABLE analysis_records
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private';

-- 为现有记录设置默认值
UPDATE analysis_records
SET visibility = 'private'
WHERE visibility IS NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_analysis_records_visibility ON analysis_records(visibility);

-- 添加对pair字段的索引（从analysis_metadata JSON中提取）
CREATE INDEX IF NOT EXISTS idx_analysis_records_pair
ON analysis_records((analysis_metadata->>'pair'));

-- 注释
COMMENT ON COLUMN analysis_records.visibility IS '记录可见性: private（私有）或 public（公开）';