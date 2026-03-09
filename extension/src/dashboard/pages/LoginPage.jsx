// 登录页面
import { createSignal, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../contexts/AuthContext'

function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = createSignal(true)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal('')

  // 表单数据
  const [formData, setFormData] = createSignal({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  })

  // 更新表单字段
  const updateField = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    setError('') // 清除错误信息
  }

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { email, password, username, confirmPassword } = formData()

    // 表单验证
    if (!email || !password) {
      setError('请输入邮箱和密码')
      setLoading(false)
      return
    }

    if (!isLogin()) {
      if (!username) {
        setError('请输入用户名')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError('两次输入的密码不一致')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('密码长度至少6位')
        setLoading(false)
        return
      }
    }

    try {
      let result

      if (isLogin()) {
        // 登录
        result = await auth.loginJson(email, password)
      } else {
        // 注册
        result = await auth.register(email, password, username)
      }

      if (result.success) {
        // 登录/注册成功，跳转到首页
        navigate('/')
      } else {
        setError(result.error || '操作失败，请重试')
      }
    } catch (err) {
      setError(err.message || '网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  // 切换登录/注册模式
  const toggleMode = () => {
    setIsLogin(!isLogin())
    setError('')
    setFormData({
      email: '',
      password: '',
      username: '',
      confirmPassword: ''
    })
  }

  return (
    <div class="login-page">
      <div class="login-container">
        {/* 品牌标识 */}
        <div class="login-header">
          <div class="login-logo">
            <span class="logo-icon">📊</span>
            <span class="logo-text">Candlebot</span>
          </div>
          <div class="login-subtitle">K线专家 · 智能图表分析</div>
        </div>

        {/* 表单卡片 */}
        <div class="login-card">
          <div class="card-header">
            <h2 class="card-title">{isLogin() ? '欢迎回来' : '创建账户'}</h2>
            <p class="card-subtitle">
              {isLogin() ? '登录以继续使用 Candlebot' : '注册新账户，开始智能分析'}
            </p>
          </div>

          {/* 错误提示 */}
          <Show when={error()}>
            <div class="error-alert">
              <span class="error-icon">⚠️</span>
              <span class="error-text">{error()}</span>
            </div>
          </Show>

          {/* 表单 */}
          <form onSubmit={handleSubmit} class="login-form">
            {/* 邮箱 */}
            <div class="form-group">
              <label for="email" class="form-label">邮箱地址</label>
              <input
                type="email"
                id="email"
                value={formData().email}
                onInput={updateField('email')}
                placeholder="your@email.com"
                required
                disabled={loading()}
                class="form-input"
              />
            </div>

            {/* 用户名（仅注册时显示） */}
            <Show when={!isLogin()}>
              <div class="form-group">
                <label for="username" class="form-label">用户名</label>
                <input
                  type="text"
                  id="username"
                  value={formData().username}
                  onInput={updateField('username')}
                  placeholder="选择用户名"
                  required
                  disabled={loading()}
                  class="form-input"
                />
              </div>
            </Show>

            {/* 密码 */}
            <div class="form-group">
              <label for="password" class="form-label">密码</label>
              <input
                type="password"
                id="password"
                value={formData().password}
                onInput={updateField('password')}
                placeholder="输入密码"
                required
                disabled={loading()}
                class="form-input"
              />
            </div>

            {/* 确认密码（仅注册时显示） */}
            <Show when={!isLogin()}>
              <div class="form-group">
                <label for="confirmPassword" class="form-label">确认密码</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData().confirmPassword}
                  onInput={updateField('confirmPassword')}
                  placeholder="再次输入密码"
                  required
                  disabled={loading()}
                  class="form-input"
                />
              </div>
            </Show>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading()}
              class="btn btn-primary w-full"
            >
              <Show when={loading()} fallback={
                <span>{isLogin() ? '登录' : '注册'}</span>
              }>
                <span class="loading-spinner-small"></span>
                <span>{isLogin() ? '登录中...' : '注册中...'}</span>
              </Show>
            </button>

            {/* 切换模式 */}
            <div class="form-footer">
              <span class="form-footer-text">
                {isLogin() ? '还没有账户？' : '已有账户？'}
              </span>
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading()}
                class="form-footer-link"
              >
                {isLogin() ? '立即注册' : '立即登录'}
              </button>
            </div>

            {/* 分隔线 */}
            <div class="form-divider">
              <span class="divider-text">或</span>
            </div>

            {/* 第三方登录（占位） */}
            <div class="social-login">
              <button type="button" class="btn btn-outline w-full" disabled>
                <span class="social-icon">G</span>
                <span>使用 Google 登录</span>
              </button>
              <button type="button" class="btn btn-outline w-full mt-2" disabled>
                <span class="social-icon">GitHub</span>
                <span>使用 GitHub 登录</span>
              </button>
            </div>
          </form>

          {/* 功能说明 */}
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">🔍</span>
              <span class="feature-text">AI智能图表分析</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span class="feature-text">专业K线解读</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💾</span>
              <span class="feature-text">历史记录保存</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💬</span>
              <span class="feature-text">交互式问答</span>
            </div>
          </div>
        </div>

        {/* 页脚信息 */}
        <div class="login-footer">
          <p class="footer-text">
            登录即表示您同意我们的
            <a href="#" class="footer-link">服务条款</a>
            和
            <a href="#" class="footer-link">隐私政策</a>
          </p>
          <p class="footer-text">
            免费用户每日可进行 {auth.user.quota_total} 次分析
          </p>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-bg) 0%, #1a1a2e 100%);
          padding: var(--space-lg);
        }

        .login-container {
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: var(--space-2xl);
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: var(--space-sm);
        }

        .logo-icon {
          font-size: 2.5rem;
        }

        .login-subtitle {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .login-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-2xl);
          box-shadow: var(--shadow-xl);
          margin-bottom: var(--space-xl);
        }

        .card-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .card-subtitle {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          margin-bottom: var(--space-lg);
          color: var(--color-error);
        }

        .error-icon {
          font-size: 1rem;
        }

        .error-text {
          font-size: 0.875rem;
        }

        .login-form {
          margin-bottom: var(--space-xl);
        }

        .form-group {
          margin-bottom: var(--space-lg);
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: var(--space-xs);
          color: var(--color-text);
        }

        .form-input {
          width: 100%;
        }

        .form-input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner-small {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: var(--space-sm);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--space-xs);
          margin-top: var(--space-lg);
        }

        .form-footer-text {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .form-footer-link {
          background: none;
          border: none;
          color: var(--color-accent);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }

        .form-footer-link:hover {
          text-decoration: underline;
        }

        .form-footer-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-divider {
          display: flex;
          align-items: center;
          margin: var(--space-xl) 0;
        }

        .form-divider::before,
        .form-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }

        .divider-text {
          padding: 0 var(--space-md);
          color: var(--color-text-secondary);
          font-size: 0.75rem;
        }

        .social-login {
          margin-bottom: var(--space-xl);
        }

        .social-icon {
          margin-right: var(--space-sm);
          font-weight: 500;
        }

        .feature-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-md);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .feature-icon {
          font-size: 1rem;
        }

        .feature-text {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .login-footer {
          text-align: center;
        }

        .footer-text {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xs);
        }

        .footer-link {
          color: var(--color-accent);
          margin: 0 var(--space-xs);
        }

        @media (max-width: 480px) {
          .login-card {
            padding: var(--space-xl);
          }

          .feature-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default LoginPage