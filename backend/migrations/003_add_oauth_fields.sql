-- 添加OAuth相关字段到users表
-- 迁移ID: 003_add_oauth_fields
-- 创建时间: 2026-04-02

-- 添加OAuth相关字段
ALTER TABLE users
ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS oauth_metadata JSONB;

-- 为provider_id创建索引
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);

-- 更新password_hash字段为可空（OAuth用户可能没有密码）
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- 注释
COMMENT ON COLUMN users.provider IS 'OAuth提供商：google, github等';
COMMENT ON COLUMN users.provider_id IS '第三方平台用户ID';
COMMENT ON COLUMN users.oauth_metadata IS '原始OAuth数据';