// 简化的登录页面 - 专注于解决基本登录问题
import { createSignal } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../contexts/AuthContext'
import { shouldUseMockAPI } from '../utils/mockAuth'

function SimpleLoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal('')

  // 表单数据
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')

  // 处理登录
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email() || !password()) {
      setError('请输入邮箱和密码')
      setLoading(false)
      return
    }

    try {
      const result = await auth.loginJson(email(), password())

      if (result.success) {
        // 登录成功，跳转到首页
        navigate('/')
      } else {
        setError(result.error || '登录失败，请重试')
      }
    } catch (err) {
      setError(err.message || '网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  // 测试登录（用于调试）
  const handleTestLogin = async () => {
    setLoading(true)
    setError('')

    try {
      // 使用测试账号
      const result = await auth.loginJson('test@example.com', 'password123')

      if (result.success) {
        navigate('/')
      } else {
        setError('测试登录失败: ' + (result.error || '未知错误'))
      }
    } catch (err) {
      setError('测试登录错误: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 切换模拟API模式
  const toggleMockMode = () => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('mock')) {
      url.searchParams.delete('mock')
    } else {
      url.searchParams.set('mock', 'true')
    }
    window.location.href = url.toString()
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* 品牌标识 */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>📊</span>
            <span style={styles.logoText}>Candlebot</span>
          </div>
          <div style={styles.subtitle}>K线专家 · 智能图表分析</div>
        </div>

        {/* 登录卡片 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>登录 Candlebot</h2>
            <p style={styles.cardSubtitle}>输入您的邮箱和密码继续</p>
          </div>

          {/* 错误提示 */}
          {error() && (
            <div style={styles.errorAlert}>
              <span style={styles.errorIcon}>⚠️</span>
              <span style={styles.errorText}>{error()}</span>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleLogin} style={styles.form}>
            {/* 邮箱 */}
            <div style={styles.formGroup}>
              <label for="email" style={styles.formLabel}>邮箱地址</label>
              <input
                type="email"
                id="email"
                value={email()}
                onInput={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading()}
                style={styles.input}
              />
            </div>

            {/* 密码 */}
            <div style={styles.formGroup}>
              <label for="password" style={styles.formLabel}>密码</label>
              <input
                type="password"
                id="password"
                value={password()}
                onInput={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required
                disabled={loading()}
                style={styles.input}
              />
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading()}
              style={loading() ? { ...styles.button, ...styles.buttonLoading } : styles.button}
            >
              {loading() ? '登录中...' : '登录'}
            </button>

            {/* 调试按钮 */}
            <div style={styles.debugSection}>
              <button
                type="button"
                onClick={handleTestLogin}
                disabled={loading()}
                style={styles.testButton}
              >
                测试登录
              </button>
              <button
                type="button"
                onClick={toggleMockMode}
                style={styles.mockButton}
              >
                {shouldUseMockAPI() ? '使用真实API' : '使用模拟API'}
              </button>
              <div style={styles.debugInfo}>
                <div>状态: {auth.loading() ? '加载中...' : auth.isAuthenticated() ? '已登录' : '未登录'}</div>
                <div>用户: {auth.user.email || '未登录'}</div>
                <div>模式: {shouldUseMockAPI() ? '模拟API' : '真实API'}</div>
              </div>
            </div>
          </form>

          {/* 功能说明 */}
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🔍</span>
              <span style={styles.featureText}>AI智能图表分析</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📊</span>
              <span style={styles.featureText}>专业K线解读</span>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            免费用户每日可进行 {auth.user.quota_total || 5} 次分析
          </p>
        </div>
      </div>
    </div>
  )
}

// 内联样式
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '1rem',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#ffffff',
  },
  logoIcon: {
    fontSize: '2.5rem',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    marginBottom: '1.5rem',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#ffffff',
  },
  cardSubtitle: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    color: '#f87171',
  },
  errorIcon: {
    fontSize: '1rem',
  },
  errorText: {
    fontSize: '0.875rem',
  },
  form: {
    marginBottom: '1.5rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  formLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.25rem',
    color: '#e2e8f0',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '0.5rem',
    color: '#ffffff',
    fontSize: '0.875rem',
  },
  inputDisabled: {
    opacity: '0.7',
    cursor: 'not-allowed',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonLoading: {
    opacity: '0.7',
    cursor: 'not-allowed',
  },
  debugSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #334155',
  },
  testButton: {
    width: '100%',
    padding: '0.5rem',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    marginBottom: '0.25rem',
  },
  mockButton: {
    width: '100%',
    padding: '0.5rem',
    background: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
    marginBottom: '0.5rem',
  },
  debugInfo: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  featureIcon: {
    fontSize: '1rem',
  },
  featureText: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  footer: {
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
}

export default SimpleLoginPage