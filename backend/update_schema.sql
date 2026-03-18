-- 更新users表，添加OAuth相关字段
ALTER TABLE users
ADD COLUMN provider VARCHAR(50),
ADD COLUMN provider_id VARCHAR(255),
ADD COLUMN oauth_metadata JSONB;

-- 为provider_id创建索引
CREATE INDEX idx_users_provider_id ON users(provider_id);

-- 更新注释
COMMENT ON COLUMN users.provider IS 'OAuth提供商：google, github等';
COMMENT ON COLUMN users.provider_id IS '第三方平台用户ID';
COMMENT ON COLUMN users.oauth_metadata IS '原始OAuth数据';