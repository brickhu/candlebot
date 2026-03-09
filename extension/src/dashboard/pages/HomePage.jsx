// 首页
import { createSignal, createEffect, Show, For } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../contexts/AuthContext'
import { useAPI } from '../contexts/APIContext'

function HomePage() {
  const auth = useAuth()
  const api = useAPI()
  const navigate = useNavigate()

  const [stats, setStats] = createSignal(null)
  const [recentAnalyses, setRecentAnalyses] = createSignal([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')

  // 加载数据
  createEffect(async () => {
    try {
      setLoading(true)

      // 并行加载统计和最近分析
      const [statsData, historyData] = await Promise.all([
        api.analysis.getStats(),
        api.analysis.getHistory({ page: 1, per_page: 5 })
      ])

      setStats(statsData)
      setRecentAnalyses(historyData.items || [])
    } catch (err) {
      console.error('加载首页数据失败:', err)
      setError('加载数据失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  })

  // 快速操作
  const quickActions = [
    {
      id: 'new-analysis',
      label: '新建分析',
      description: '开始新的图表分析',
      icon: '🔍',
      color: 'blue',
      action: () => {
        // 打开Popup进行新分析
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' })
      }
    },
    {
      id: 'view-history',
      label: '查看历史',
      description: '浏览所有分析记录',
      icon: '📊',
      color: 'green',
      action: () => navigate('/history')
    },
    {
      id: 'upgrade-plan',
      label: '升级套餐',
      description: '获取更多分析次数',
      icon: '💎',
      color: 'purple',
      action: () => navigate('/billing')
    },
    {
      id: 'settings',
      label: '设置',
      description: '个性化您的体验',
      icon: '⚙️',
      color: 'gray',
      action: () => navigate('/settings')
    }
  ]

  // 评级颜色
  const getRatingColor = (rating) => {
    if (rating?.includes('🟢')) return 'success'
    if (rating?.includes('🔴')) return 'error'
    return 'muted'
  }

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div class="home-page">
      {/* 欢迎横幅 */}
      <div class="welcome-banner">
        <div class="welcome-content">
          <h1 class="welcome-title">
            欢迎回来，{auth.user.username || auth.user.email}！
          </h1>
          <p class="welcome-subtitle">
            今日剩余 {auth.user.quota_remaining} 次分析机会
          </p>
        </div>
        <div class="welcome-actions">
          <button
            class="btn btn-primary"
            onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_POPUP' })}
          >
            <span class="btn-icon">🔍</span>
            开始分析
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <Show when={!loading() && stats()}>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">📈</div>
            <div class="stat-content">
              <div class="stat-value">{stats().total_analyses || 0}</div>
              <div class="stat-label">总分析次数</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon success">✅</div>
            <div class="stat-content">
              <div class="stat-value">{stats().quota_remaining || 0}</div>
              <div class="stat-label">今日剩余</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card">
              <div class="stat-icon platform">🖥️</div>
              <div class="stat-content">
                <div class="stat-value">
                  {Object.keys(stats().platform_stats || {}).length}
                </div>
                <div class="stat-label">使用平台</div>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon pairs">💰</div>
            <div class="stat-content">
              <div class="stat-value">
                {(stats().top_pairs || []).length}
              </div>
              <div class="stat-label">关注交易对</div>
            </div>
          </div>
        </div>
      </Show>

      {/* 快速操作 */}
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">快速操作</h2>
          <p class="section-subtitle">快速访问常用功能</p>
        </div>
        <div class="quick-actions-grid">
          <For each={quickActions}>
            {(action) => (
              <button class="quick-action-card" onClick={action.action}>
                <div class={`action-icon action-${action.color}`}>
                  {action.icon}
                </div>
                <div class="action-content">
                  <div class="action-title">{action.label}</div>
                  <div class="action-description">{action.description}</div>
                </div>
                <div class="action-arrow">→</div>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* 最近分析 */}
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">最近分析</h2>
          <button class="btn btn-outline" onClick={() => navigate('/history')}>
            查看全部
          </button>
        </div>

        <Show when={loading()}>
          <div class="loading-placeholder">
            <div class="loading-spinner"></div>
            <div>加载中...</div>
          </div>
        </Show>

        <Show when={!loading() && recentAnalyses().length > 0}>
          <div class="recent-analyses">
            <For each={recentAnalyses()}>
              {(analysis) => (
                <div
                  class="analysis-card"
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <div class="analysis-header">
                    <div class="analysis-pair">
                      <span class="pair-symbol">{analysis.metadata?.pair || '未知'}</span>
                      <span class="pair-timeframe">{analysis.metadata?.timeframe || ''}</span>
                    </div>
                    <div class={`analysis-rating rating-${getRatingColor(analysis.metadata?.rating)}`}>
                      {analysis.metadata?.rating || '⚫⚫⚫'}
                    </div>
                  </div>

                  <div class="analysis-body">
                    <div class="analysis-summary">
                      {analysis.metadata?.summary || '暂无摘要'}
                    </div>
                    <div class="analysis-meta">
                      <span class="meta-platform">{analysis.platform}</span>
                      <span class="meta-time">{formatTime(analysis.created_at)}</span>
                    </div>
                  </div>

                  <div class="analysis-footer">
                    <div class="analysis-price">
                      ${analysis.metadata?.price || '--'}
                    </div>
                    <div class="analysis-actions">
                      <button
                        class="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/analysis/${analysis.id}`)
                        }}
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={!loading() && recentAnalyses().length === 0}>
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <div class="empty-title">暂无分析记录</div>
            <div class="empty-description">
              开始您的第一次图表分析，获取专业的交易建议
            </div>
            <button
              class="btn btn-primary"
              onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_POPUP' })}
            >
              开始分析
            </button>
          </div>
        </Show>
      </div>

      {/* 平台使用情况 */}
      <Show when={!loading() && stats()?.platform_stats}>
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">平台使用情况</h2>
          </div>
          <div class="platform-stats">
            <For each={Object.entries(stats().platform_stats || {})}>
              {([platform, count]) => (
                <div class="platform-stat">
                  <div class="platform-name">{platform}</div>
                  <div class="platform-bar">
                    <div
                      class="platform-progress"
                      style={{
                        width: `${(count / stats().total_analyses) * 100}%`
                      }}
                    />
                  </div>
                  <div class="platform-count">{count} 次</div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <style>{`
        .home-page {
          padding-bottom: var(--space-2xl);
        }

        .welcome-banner {
          background: linear-gradient(135deg, var(--color-accent) 0%, #2563eb 100%);
          border-radius: var(--radius-xl);
          padding: var(--space-2xl);
          margin-bottom: var(--space-xl);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-content {
          flex: 1;
        }

        .welcome-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .welcome-subtitle {
          font-size: 1rem;
          opacity: 0.9;
        }

        .welcome-actions .btn {
          background: white;
          color: var(--color-accent);
        }

        .welcome-actions .btn:hover {
          background: rgba(255, 255, 255, 0.9);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          transition: all var(--transition-fast);
        }

        .stat-card:hover {
          border-color: var(--color-border-light);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 2rem;
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.total {
          background: rgba(59, 130, 246, 0.1);
          color: var(--color-accent);
        }

        .stat-icon.success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
        }

        .stat-icon.platform {
          background: rgba(245, 158, 11, 0.1);
          color: var(--color-warning);
        }

        .stat-icon.pairs {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--space-xs);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .section {
          margin-bottom: var(--space-2xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .section-subtitle {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          margin-top: var(--space-xs);
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-lg);
        }

        .quick-action-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          width: 100%;
        }

        .quick-action-card:hover {
          border-color: var(--color-border-light);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .action-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .action-blue {
          background: rgba(59, 130, 246, 0.1);
          color: var(--color-accent);
        }

        .action-green {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
        }

        .action-purple {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .action-gray {
          background: rgba(107, 114, 128, 0.1);
          color: var(--color-text-secondary);
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .action-description {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .action-arrow {
          color: var(--color-text-secondary);
          font-size: 1.25rem;
        }

        .loading-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--space-md);
        }

        .recent-analyses {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-lg);
        }

        .analysis-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .analysis-card:hover {
          border-color: var(--color-border-light);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }

        .analysis-pair {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .pair-symbol {
          font-weight: 600;
          font-size: 1.125rem;
        }

        .pair-timeframe {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          background: var(--color-surface-light);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .analysis-rating {
          font-size: 1rem;
          font-weight: 500;
        }

        .rating-success {
          color: var(--color-success);
        }

        .rating-error {
          color: var(--color-error);
        }

        .rating-muted {
          color: var(--color-text-secondary);
        }

        .analysis-body {
          margin-bottom: var(--space-md);
        }

        .analysis-summary {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin-bottom: var(--space-sm);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .analysis-meta {
          display: flex;
          gap: var(--space-md);
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .analysis-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .analysis-price {
          font-weight: 600;
          font-size: 1.125rem;
        }

        .btn-icon {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 1rem;
          cursor: pointer;
          padding: var(--space-xs);
        }

        .btn-icon:hover {
          color: var(--color-text);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: var(--space-lg);
        }

        .empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .empty-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--space-lg);
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        .platform-stats {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .platform-stat {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }

        .platform-stat:last-child {
          margin-bottom: 0;
        }

        .platform-name {
          width: 120px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .platform-bar {
          flex: 1;
          height: 8px;
          background: var(--color-border);
          border-radius: 4px;
          overflow: hidden;
        }

        .platform-progress {
          height: 100%;
          background: var(--color-accent);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .platform-count {
          width: 80px;
          text-align: right;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        @media (max-width: 768px) {
          .welcome-banner {
            flex-direction: column;
            text-align: center;
            gap: var(--space-lg);
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .quick-actions-grid {
            grid-template-columns: 1fr;
          }

          .recent-analyses {
            grid-template-columns: 1fr;
          }

          .platform-stat {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-sm);
          }

          .platform-name {
            width: auto;
          }

          .platform-count {
            width: auto;
            text-align: left;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default HomePage