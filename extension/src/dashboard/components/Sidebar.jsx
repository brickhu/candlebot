// 侧边栏组件
import { A, useLocation } from '@solidjs/router'
import { useAuth } from '../contexts/AuthContext'
import { createSignal, Show } from 'solid-js'

function Sidebar(props) {
  const auth = useAuth()
  const location = useLocation()
  const [expandedSections, setExpandedSections] = createSignal({
    analysis: true,
    account: false
  })

  // 导航菜单项
  const navItems = [
    {
      id: 'dashboard',
      label: '仪表板',
      icon: '📊',
      path: '/',
      exact: true
    },
    {
      id: 'analysis',
      label: '分析记录',
      icon: '📈',
      path: '/history',
      children: [
        { label: '所有记录', path: '/history' },
        { label: '最近分析', path: '/history?filter=recent' },
        { label: '高评级', path: '/history?filter=high_rating' }
      ]
    },
    {
      id: 'account',
      label: '账户设置',
      icon: '👤',
      path: '/settings',
      children: [
        { label: '个人资料', path: '/settings' },
        { label: '通知设置', path: '/settings/notifications' },
        { label: '隐私设置', path: '/settings/privacy' }
      ]
    },
    {
      id: 'billing',
      label: '套餐与计费',
      icon: '💳',
      path: '/billing'
    },
    {
      id: 'help',
      label: '帮助与支持',
      icon: '❓',
      path: '/help'
    }
  ]

  // 切换章节展开状态
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // 检查是否激活
  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  // 检查是否有激活的子项
  const hasActiveChild = (children) => {
    return children?.some(child => isActive(child.path))
  }

  return (
    <Show when={props.open}>
      <aside class="sidebar">
        {/* 侧边栏头部 */}
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <span class="logo-icon">📊</span>
            <span class="logo-text">Candlebot</span>
          </div>
          <button class="sidebar-close" onClick={props.onClose}>
            ✕
          </button>
        </div>

        {/* 用户信息 */}
        <div class="user-info">
          <div class="user-avatar">
            {auth.user.avatar_url ? (
              <img src={auth.user.avatar_url} alt={auth.user.username} />
            ) : (
              <div class="avatar-placeholder">
                {auth.user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div class="user-details">
            <div class="user-name">{auth.user.username || auth.user.email}</div>
            <div class="user-plan">
              <span class={`plan-badge plan-${auth.user.plan_type}`}>
                {auth.user.plan_type === 'premium' ? '高级版' : '免费版'}
              </span>
            </div>
          </div>
          <div class="user-quota">
            <div class="quota-label">剩余次数</div>
            <div class="quota-value">
              {auth.user.quota_remaining} / {auth.user.quota_total}
            </div>
            <div class="quota-bar">
              <div
                class="quota-progress"
                style={{ width: `${(auth.user.quota_used / auth.user.quota_total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav class="sidebar-nav">
          <ul class="nav-list">
            <For each={navItems}>
              {(item) => (
                <li class="nav-item">
                  <Show when={!item.children} fallback={
                    <>
                      <div
                        class={`nav-parent ${hasActiveChild(item.children) ? 'active' : ''}`}
                        onClick={() => toggleSection(item.id)}
                      >
                        <span class="nav-icon">{item.icon}</span>
                        <span class="nav-label">{item.label}</span>
                        <span class="nav-arrow">
                          {expandedSections()[item.id] ? '▾' : '▸'}
                        </span>
                      </div>
                      <Show when={expandedSections()[item.id]}>
                        <ul class="nav-children">
                          <For each={item.children}>
                            {(child) => (
                              <li class="nav-child">
                                <A
                                  href={child.path}
                                  class={`nav-link ${isActive(child.path) ? 'active' : ''}`}
                                >
                                  {child.label}
                                </A>
                              </li>
                            )}
                          </For>
                        </ul>
                      </Show>
                    </>
                  }>
                    <A
                      href={item.path}
                      class={`nav-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
                    >
                      <span class="nav-icon">{item.icon}</span>
                      <span class="nav-label">{item.label}</span>
                    </A>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </nav>

        {/* 快速操作 */}
        <div class="sidebar-actions">
          <button class="btn btn-primary w-full">
            <span class="btn-icon">🔍</span>
            快速分析
          </button>
          <button class="btn btn-outline w-full mt-2" onClick={auth.logout}>
            <span class="btn-icon">🚪</span>
            退出登录
          </button>
        </div>

        {/* 版本信息 */}
        <div class="sidebar-footer">
          <div class="version-info">
            <span class="text-xs text-muted">v2.0.0 · 专业版</span>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 250px;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow-y: auto;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-weight: 700;
          font-size: 1.125rem;
        }

        .logo-icon {
          font-size: 1.25rem;
        }

        .sidebar-close {
          display: none;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 1.25rem;
          cursor: pointer;
          padding: var(--space-xs);
        }

        .user-info {
          padding: var(--space-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .user-avatar {
          display: flex;
          justify-content: center;
          margin-bottom: var(--space-md);
        }

        .avatar-placeholder {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--color-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .user-avatar img {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-details {
          text-align: center;
          margin-bottom: var(--space-md);
        }

        .user-name {
          font-weight: 600;
          margin-bottom: var(--space-xs);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-plan {
          display: flex;
          justify-content: center;
        }

        .plan-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .plan-free {
          background: var(--color-surface-light);
          color: var(--color-text-secondary);
        }

        .plan-premium {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #000;
        }

        .user-quota {
          background: var(--color-bg);
          border-radius: var(--radius-md);
          padding: var(--space-sm);
        }

        .quota-label {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xs);
        }

        .quota-value {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .quota-bar {
          height: 4px;
          background: var(--color-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .quota-progress {
          height: 100%;
          background: var(--color-accent);
          transition: width 0.3s ease;
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-lg) 0;
          overflow-y: auto;
        }

        .nav-list {
          list-style: none;
        }

        .nav-item {
          margin-bottom: var(--space-xs);
        }

        .nav-parent {
          display: flex;
          align-items: center;
          padding: var(--space-sm) var(--space-lg);
          color: var(--color-text-secondary);
          cursor: pointer;
          user-select: none;
          transition: all var(--transition-fast);
        }

        .nav-parent:hover {
          background: var(--color-surface-light);
          color: var(--color-text);
        }

        .nav-parent.active {
          color: var(--color-accent);
          background: rgba(59, 130, 246, 0.1);
        }

        .nav-icon {
          margin-right: var(--space-sm);
          font-size: 1.125rem;
        }

        .nav-label {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .nav-arrow {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .nav-children {
          list-style: none;
          padding-left: var(--space-xl);
          margin-top: var(--space-xs);
        }

        .nav-child {
          margin-bottom: var(--space-xs);
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: var(--space-sm) var(--space-lg);
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: all var(--transition-fast);
          border-left: 2px solid transparent;
        }

        .nav-link:hover {
          background: var(--color-surface-light);
          color: var(--color-text);
        }

        .nav-link.active {
          color: var(--color-accent);
          background: rgba(59, 130, 246, 0.1);
          border-left-color: var(--color-accent);
        }

        .sidebar-actions {
          padding: var(--space-lg);
          border-top: 1px solid var(--color-border);
        }

        .btn-icon {
          margin-right: var(--space-sm);
        }

        .sidebar-footer {
          padding: var(--space-md) var(--space-lg);
          border-top: 1px solid var(--color-border);
          text-align: center;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .sidebar-close {
            display: block;
          }
        }
      `}</style>
    </Show>
  )
}

export default Sidebar