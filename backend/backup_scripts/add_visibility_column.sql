-- 添加visibility字段到analysis_records表
ALTER TABLE analysis_records ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private';

-- 为visibility字段创建索引
CREATE INDEX IF NOT EXISTS idx_analysis_records_visibility ON analysis_records(visibility);

-- 更新现有记录的visibility字段（默认为private）
UPDATE analysis_records SET visibility = 'private' WHERE visibility IS NULL;