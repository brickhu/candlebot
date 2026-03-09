// 顶部导航栏组件
import { createSignal, Show } from 'solid-js'
import { useAuth } from '../contexts/AuthContext'

function Header(props) {
  const auth = useAuth()
  const [showUserMenu, setShowUserMenu] = createSignal(false)
  const [showNotifications, setShowNotifications] = createSignal(false)

  // 通知数据（模拟）
  const notifications = [
    { id: 1, title: '分析完成', message: 'ETH/USD 分析已完成', time: '2分钟前', read: false },
    { id: 2, title: '配额提醒', message: '今日剩余 3 次分析', time: '1小时前', read: true },
    { id: 3, title: '系统更新', message: 'v2.0.0 已发布', time: '1天前', read: true }
  ]

  // 未读通知数量
  const unreadCount = () => notifications.filter(n => !n.read).length

  return (
    <header class="header">
      <div class="header-left">
        <button class="header-menu-btn" onClick={props.onMenuClick}>
          ☰
        </button>
        <div class="header-title">
          <span class="title-text">Candlebot Dashboard</span>
          <span class="title-subtext">· K线专家</span>
        </div>
      </div>

      <div class="header-right">
        {/* 搜索框 */}
        <div class="search-container">
          <input
            type="text"
            placeholder="搜索分析记录..."
            class="search-input"
          />
          <button class="search-btn">
            🔍
          </button>
        </div>

        {/* 通知按钮 */}
        <div class="notification-container">
          <button
            class="notification-btn"
            onClick={() => setShowNotifications(!showNotifications())}
          >
            🔔
            <Show when={unreadCount() > 0}>
              <span class="notification-badge">{unreadCount()}</span>
            </Show>
          </button>

          <Show when={showNotifications()}>
            <div class="notification-dropdown">
              <div class="notification-header">
                <span class="notification-title">通知</span>
                <button class="notification-mark-all">标记全部已读</button>
              </div>
              <div class="notification-list">
                <For each={notifications}>
                  {(notification) => (
                    <div class={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                      <div class="notification-icon">
                        {notification.read ? '○' : '●'}
                      </div>
                      <div class="notification-content">
                        <div class="notification-message">
                          <strong>{notification.title}</strong>: {notification.message}
                        </div>
                        <div class="notification-time">{notification.time}</div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <div class="notification-footer">
                <a href="#" class="notification-view-all">查看所有通知</a>
              </div>
            </div>
          </Show>
        </div>

        {/* 用户菜单 */}
        <div class="user-menu-container">
          <button
            class="user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu())}
          >
            <div class="user-avatar-small">
              {auth.user.avatar_url ? (
                <img src={auth.user.avatar_url} alt={auth.user.username} />
              ) : (
                <div class="avatar-placeholder-small">
                  {auth.user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <span class="user-name-small">{auth.user.username || auth.user.email}</span>
            <span class="user-menu-arrow">▾</span>
          </button>

          <Show when={showUserMenu()}>
            <div class="user-menu-dropdown">
              <div class="user-menu-header">
                <div class="user-menu-avatar">
                  {auth.user.avatar_url ? (
                    <img src={auth.user.avatar_url} alt={auth.user.username} />
                  ) : (
                    <div class="avatar-placeholder-menu">
                      {auth.user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div class="user-menu-info">
                  <div class="user-menu-name">{auth.user.username || auth.user.email}</div>
                  <div class="user-menu-email">{auth.user.email}</div>
                  <div class="user-menu-plan">
                    <span class={`plan-badge-small plan-${auth.user.plan_type}`}>
                      {auth.user.plan_type === 'premium' ? '高级版' : '免费版'}
                    </span>
                  </div>
                </div>
              </div>

              <div class="user-menu-quota">
                <div class="quota-info">
                  <span class="quota-label">剩余次数</span>
                  <span class="quota-value">
                    {auth.user.quota_remaining} / {auth.user.quota_total}
                  </span>
                </div>
                <div class="quota-bar-small">
                  <div
                    class="quota-progress-small"
                    style={{ width: `${(auth.user.quota_used / auth.user.quota_total) * 100}%` }}
                  />
                </div>
              </div>

              <div class="user-menu-items">
                <a href="/settings" class="user-menu-item">
                  <span class="menu-item-icon">👤</span>
                  <span class="menu-item-text">个人资料</span>
                </a>
                <a href="/billing" class="user-menu-item">
                  <span class="menu-item-icon">💳</span>
                  <span class="menu-item-text">套餐与计费</span>
                </a>
                <a href="/settings/notifications" class="user-menu-item">
                  <span class="menu-item-icon">🔔</span>
                  <span class="menu-item-text">通知设置</span>
                </a>
                <div class="menu-divider"></div>
                <button class="user-menu-item" onClick={auth.logout}>
                  <span class="menu-item-icon">🚪</span>
                  <span class="menu-item-text">退出登录</span>
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>

      <style>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .header-menu-btn {
          display: none;
          background: none;
          border: none;
          font-size: 1.25rem;
          color: var(--color-text);
          cursor: pointer;
          padding: var(--space-xs);
        }

        .header-title {
          display: flex;
          align-items: baseline;
          gap: var(--space-xs);
        }

        .title-text {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .title-subtext {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 200px;
          padding-right: 2.5rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }

        .search-input:focus {
          width: 300px;
          transition: width 0.3s ease;
        }

        .search-btn {
          position: absolute;
          right: 0.5rem;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: var(--space-xs);
        }

        .notification-container {
          position: relative;
        }

        .notification-btn {
          position: relative;
          background: none;
          border: none;
          font-size: 1.25rem;
          color: var(--color-text);
          cursor: pointer;
          padding: var(--space-xs);
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--color-error);
          color: white;
          font-size: 0.625rem;
          font-weight: 600;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }

        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 320px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          margin-top: var(--space-sm);
          z-index: 1000;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          border-bottom: 1px solid var(--color-border);
        }

        .notification-title {
          font-weight: 600;
        }

        .notification-mark-all {
          background: none;
          border: none;
          color: var(--color-accent);
          font-size: 0.75rem;
          cursor: pointer;
        }

        .notification-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          padding: var(--space-md);
          border-bottom: 1px solid var(--color-border-light);
          transition: background-color 0.2s;
        }

        .notification-item:hover {
          background: var(--color-surface-light);
        }

        .notification-item.unread {
          background: rgba(59, 130, 246, 0.05);
        }

        .notification-icon {
          margin-right: var(--space-sm);
          color: var(--color-accent);
          font-size: 0.75rem;
        }

        .notification-item.read .notification-icon {
          color: var(--color-text-secondary);
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          font-size: 0.875rem;
          margin-bottom: var(--space-xs);
        }

        .notification-time {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .notification-footer {
          padding: var(--space-md);
          text-align: center;
          border-top: 1px solid var(--color-border);
        }

        .notification-view-all {
          font-size: 0.875rem;
          color: var(--color-accent);
        }

        .user-menu-container {
          position: relative;
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: none;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-xs) var(--space-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .user-menu-btn:hover {
          border-color: var(--color-border-light);
          background: var(--color-surface-light);
        }

        .user-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
        }

        .user-avatar-small img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder-small {
          width: 100%;
          height: 100%;
          background: var(--color-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .user-name-small {
          font-size: 0.875rem;
          font-weight: 500;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-menu-arrow {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .user-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 280px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          margin-top: var(--space-sm);
          z-index: 1000;
        }

        .user-menu-header {
          display: flex;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .user-menu-avatar {
          margin-right: var(--space-md);
        }

        .avatar-placeholder-menu {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .user-menu-info {
          flex: 1;
        }

        .user-menu-name {
          font-weight: 600;
          margin-bottom: var(--space-xs);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-menu-email {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xs);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .plan-badge-small {
          display: inline-block;
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

        .user-menu-quota {
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .quota-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-xs);
        }

        .quota-label {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .quota-value {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .quota-bar-small {
          height: 4px;
          background: var(--color-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .quota-progress-small {
          height: 100%;
          background: var(--color-accent);
        }

        .user-menu-items {
          padding: var(--space-sm) 0;
        }

        .user-menu-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: var(--space-sm) var(--space-lg);
          background: none;
          border: none;
          color: var(--color-text);
          text-decoration: none;
          cursor: pointer;
          transition: background-color 0.2s;
          text-align: left;
        }

        .user-menu-item:hover {
          background: var(--color-surface-light);
        }

        .menu-item-icon {
          margin-right: var(--space-sm);
          font-size: 1.125rem;
        }

        .menu-item-text {
          font-size: 0.875rem;
        }

        .menu-divider {
          height: 1px;
          background: var(--color-border);
          margin: var(--space-sm) 0;
        }

        @media (max-width: 768px) {
          .header-menu-btn {
            display: block;
          }

          .search-container {
            display: none;
          }

          .title-subtext {
            display: none;
          }

          .user-name-small {
            display: none;
          }

          .user-menu-dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            margin-top: 0;
          }
        }
      `}</style>
    </header>
  )
}

export default Header