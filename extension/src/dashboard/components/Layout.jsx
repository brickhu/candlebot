// 布局组件
import { createSignal, Show } from 'solid-js'
import { A, useLocation } from '@solidjs/router'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'

function Layout(props) {
  const auth = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = createSignal(true)

  // 不需要布局的页面（如登录页）
  const noLayoutPaths = ['/login']

  // 检查当前路径是否需要布局
  const needsLayout = () => {
    return !noLayoutPaths.includes(location.pathname) && auth.isAuthenticated()
  }

  return (
    <Show when={needsLayout()} fallback={props.children}>
      <div class="layout">
        {/* 侧边栏 */}
        <Sidebar open={sidebarOpen()} onClose={() => setSidebarOpen(false)} />

        {/* 主要内容区域 */}
        <div class={`main-content ${sidebarOpen() ? 'with-sidebar' : 'full-width'}`}>
          {/* 顶部导航栏 */}
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen())} />

          {/* 页面内容 */}
          <main class="page-content">
            {props.children}
          </main>

          {/* 页脚 */}
          <footer class="footer">
            <div class="container">
              <div class="footer-content">
                <div class="footer-left">
                  <span class="text-sm text-muted">© 2026 Candlebot · K线专家</span>
                  <span class="text-xs text-muted ml-4">v2.0.0</span>
                </div>
                <div class="footer-right">
                  <a href="#" class="text-xs text-muted hover:text-text mr-4">帮助</a>
                  <a href="#" class="text-xs text-muted hover:text-text mr-4">反馈</a>
                  <a href="#" class="text-xs text-muted hover:text-text">隐私政策</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
          background: var(--color-bg);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s ease;
        }

        .main-content.with-sidebar {
          margin-left: 250px;
        }

        .main-content.full-width {
          margin-left: 0;
        }

        .page-content {
          flex: 1;
          padding: var(--space-lg);
          overflow-y: auto;
        }

        .footer {
          border-top: 1px solid var(--color-border);
          padding: var(--space-md) 0;
          background: var(--color-surface);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-left, .footer-right {
          display: flex;
          align-items: center;
        }

        @media (max-width: 768px) {
          .main-content.with-sidebar {
            margin-left: 0;
          }

          .page-content {
            padding: var(--space-md);
          }

          .footer-content {
            flex-direction: column;
            gap: var(--space-sm);
            text-align: center;
          }

          .footer-left, .footer-right {
            justify-content: center;
          }
        }
      `}</style>
    </Show>
  )
}

export default Layout