-- Candlebot 数据库表结构
-- 版本：1.0.0
-- 创建日期：2026-03-09

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    avatar_url TEXT,
    plan_type VARCHAR(50) DEFAULT 'free',
    quota_total INTEGER DEFAULT 5,  -- 总配额
    quota_used INTEGER DEFAULT 0,   -- 已使用配额
    quota_reset_date DATE,          -- 配额重置日期
    settings JSONB DEFAULT '{}',    -- 用户设置
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 分析记录表
CREATE TABLE analysis_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,  -- aggr/tradingview
    image_hash VARCHAR(64),         -- 图片哈希（去重）
    image_data TEXT,                -- base64编码的图片（可选存储）
    report_data JSONB NOT NULL,     -- 完整的报告数据
    analysis_metadata JSONB NOT NULL,        -- 元数据：rating, pair, price等
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 索引
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_platform (platform),
    INDEX idx_pair (analysis_metadata->>'pair')
);

-- 对话记录表
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    analysis_id INTEGER REFERENCES analysis_records(id) ON DELETE CASCADE,
    messages JSONB NOT NULL,        -- 对话消息数组
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_analysis (user_id, analysis_id)
);

-- 支付记录表
CREATE TABLE payment_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    payment_id VARCHAR(255) UNIQUE,  -- 第三方支付ID
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    plan_type VARCHAR(50) NOT NULL,
    quota_added INTEGER NOT NULL,    -- 增加的配额
    status VARCHAR(50) DEFAULT 'pending',  -- pending/success/failed/refunded
    payment_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    INDEX idx_user_status (user_id, status),
    INDEX idx_payment_id (payment_id)
);

-- API访问日志表（用于监控和调试）
CREATE TABLE api_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_endpoint (user_id, endpoint),
    INDEX idx_created (created_at)
);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为对话表添加触发器
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初始化默认用户（用于测试）
INSERT INTO users (email, password_hash, username, plan_type, quota_total, quota_used)
VALUES
    ('test@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '测试用户', 'free', 5, 0),
    ('demo@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '演示用户', 'premium', 100, 25);

-- 创建视图：用户配额信息
CREATE VIEW user_quota_info AS
SELECT
    u.id,
    u.email,
    u.username,
    u.plan_type,
    u.quota_total,
    u.quota_used,
    u.quota_total - u.quota_used as quota_remaining,
    u.quota_reset_date,
    COUNT(DISTINCT ar.id) as total_analyses,
    COUNT(DISTINCT c.id) as total_conversations,
    MAX(ar.created_at) as last_analysis_at
FROM users u
LEFT JOIN analysis_records ar ON u.id = ar.user_id
LEFT JOIN conversations c ON u.id = c.user_id
GROUP BY u.id, u.email, u.username, u.plan_type, u.quota_total, u.quota_used, u.quota_reset_date;