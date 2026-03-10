// Dashboard 主应用组件
import { createSignal, createEffect, Show, For } from 'solid-js'
import { Router, Route, A } from '@solidjs/router'
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

// 内部应用组件（在AuthProvider内部使用）
function AppContent() {
  const auth = useAuth()
  const [error, setError] = createSignal(null)

  return (
    <Show when={!auth.loading()} fallback={
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
          <Router>
            <Route path="/" component={() => {
              const auth = useAuth()
              return auth.isAuthenticated() ? <HomePage /> : <LoginPage />
            }} />
            <Route path="/login" component={LoginPage} />
            <Route path="/history" component={() => {
              const auth = useAuth()
              return auth.isAuthenticated() ? <HistoryPage /> : <LoginPage />
            }} />
            <Route path="/analysis/:id" component={() => {
              const auth = useAuth()
              return auth.isAuthenticated() ? <AnalysisDetailPage /> : <LoginPage />
            }} />
            <Route path="/settings" component={() => {
              const auth = useAuth()
              return auth.isAuthenticated() ? <SettingsPage /> : <LoginPage />
            }} />
            <Route path="/billing" component={() => {
              const auth = useAuth()
              return auth.isAuthenticated() ? <BillingPage /> : <LoginPage />
            }} />
            <Route path="*" component={NotFoundPage} />
          </Router>
        </Layout>
      </Show>
    </Show>
  )
}

// 主应用组件
function DashboardApp() {
  return (
    <AuthProvider>
      <APIProvider>
        <AppContent />
      </APIProvider>
    </AuthProvider>
  )
}

export default DashboardApp