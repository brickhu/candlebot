import { Route } from '@solidjs/router'
import { createSignal, onMount } from 'solid-js'
import { AuthProvider } from './lib/auth'
import Layout from './layouts/Layout'
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import DashboardPage from './pages/Dashboard'
import NotFound from './pages/NotFound'

function App() {
  const [isLoading, setIsLoading] = createSignal(true)

  onMount(() => {
    // Simulate initial loading
    setTimeout(() => setIsLoading(false), 500)
  })

  if (isLoading()) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-bg">
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-muted font-mono text-sm">Loading Candlebot...</p>
        </div>
      </div>
    )
  }

  return (
    // <AuthProvider>
    //   <Layout>
    //     <Route path="/" component={HomePage} />
    //     <Route path="/login" component={LoginPage} />
    //     <Route path="/register" component={RegisterPage} />
    //     <Route path="/dashboard" component={DashboardPage} />
    //     <Route path="*" component={NotFound} />
    //   </Layout>
    // </AuthProvider>
    <div>ddddd</div>
  )
}

export default App