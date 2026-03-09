// Dashboard 主应用组件
import { createSignal, createEffect, Show, For } from 'solid-js'
import { useRoutes, A } from '@solidjs/router'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { APIProvider } from './contexts/APIContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import HistoryPage from './pages/HistoryPage'
import AnalysisDetailPage from './pages/AnalysisDetailPage'
import SettingsPage from './pages/SettingsPage'
import BillingPage from './pages/BillingPage'
import NotFoundPage from './pages/NotFoundPage'

// 路由配置
const routes = [
  {
    path: '/',
    component: () => {
      const auth = useAuth()
      return auth.isAuthenticated ? <HomePage /> : <LoginPage />
    }
  },
  {
    path: '/login',
    component: LoginPage
  },
  {
    path: '/history',
    component: () => {
      const auth = useAuth()
      return auth.isAuthenticated ? <HistoryPage /> : <LoginPage />
    }
  },
  {
    path: '/analysis/:id',
    component: () => {
      const auth = useAuth()
      return auth.isAuthenticated ? <AnalysisDetailPage /> : <LoginPage />
    }
  },
  {
    path: '/settings',
    component: () => {
      const auth = useAuth()
      return auth.isAuthenticated ? <SettingsPage /> : <LoginPage />
    }
  },
  {
    path: '/billing',
    component: () => {
      const auth = useAuth()
      return auth.isAuthenticated ? <BillingPage /> : <LoginPage />
    }
  },
  {
    path: '*',
    component: NotFoundPage
  }
]

// 主应用组件
function DashboardApp() {
  const Route = useRoutes(routes)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal(null)

  createEffect(() => {
    // 初始化检查
    setTimeout(() => {
      setLoading(false)
    }, 500)
  })

  return (
    <AuthProvider>
      <APIProvider>
        <Show when={!loading()} fallback={
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <div>加载 Candlebot Dashboard...</div>
          </div>
        }>
          <Show when={!error()} fallback={
            <div class="error-container">
              <div class="error-icon">⚠️</div>
              <div class="error-message">{error()}</div>
              <button class="retry-button" onClick={() => window.location.reload()}>
                重新加载
              </button>
            </div>
          }>
            <Layout>
              <Route />
            </Layout>
          </Show>
        </Show>
      </APIProvider>
    </AuthProvider>
  )
}

export default DashboardApp