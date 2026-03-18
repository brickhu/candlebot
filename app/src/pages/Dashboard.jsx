import { Show, createSignal, onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'

const DashboardPage = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const [analyses, setAnalyses] = createSignal([])
  const [isLoading, setIsLoading] = createSignal(true)
  const [authInitialized, setAuthInitialized] = createSignal(false)

  onMount(() => {
    console.log('=== Dashboard mounted ===')
    console.log('1. auth对象:', auth)
    console.log('2. auth类型:', typeof auth)
    console.log('3. auth.user类型:', typeof auth?.user)
    console.log('4. auth?.user:', auth?.user)
    console.log('5. auth?.user():', auth?.user ? auth.user() : 'N/A')

    // 检查localStorage中的token
    const token = localStorage.getItem('auth_token')
    console.log('6. localStorage auth_token:', token ? `存在 (${token.substring(0, 20)}...)` : '不存在')

    // 等待auth上下文初始化
    let retryCount = 0
    const maxRetries = 30 // 最多等待3秒 (100ms * 30)

    const checkAuth = () => {
      retryCount++
      console.log(`检查auth上下文 (尝试 ${retryCount}/${maxRetries}):`, auth)

      if (auth === undefined) {
        console.log('auth上下文尚未初始化，等待...')
        if (retryCount < maxRetries) {
          setTimeout(checkAuth, 100)
        } else {
          console.error('等待auth上下文超时！')
          setAuthInitialized(true) // 即使超时也设置为true，显示错误状态
        }
        return
      }

      setAuthInitialized(true)
      console.log('✅ auth上下文已初始化:', auth)
      console.log('auth对象结构:', Object.keys(auth || {}))

      // 检查auth对象的方法
      console.log('auth.refreshUser类型:', typeof auth?.refreshUser)
      console.log('auth.login类型:', typeof auth?.login)
      console.log('auth.logout类型:', typeof auth?.logout)

      // Redirect if not authenticated
      if (!auth || !auth.user()) {
        console.log('❌ 用户未认证，重定向到登录页')
        console.log('auth.user():', auth?.user ? auth.user() : 'auth.user不存在')
        navigate('/login')
        return
      }

      console.log('✅ 用户已认证，加载分析数据')
      console.log('用户信息:', auth.user())
      loadAnalyses()
    }

    checkAuth()
  })

  const loadAnalyses = async () => {
    setIsLoading(true)
    try {
      const response = await api.getAnalyses()
      if (response.success && response.data) {
        setAnalyses(response.data)
      }
    } catch (error) {
      console.error('Failed to load analyses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewAnalysis = () => {
    // TODO: Implement new analysis flow
    alert('New analysis feature coming soon!')
  }

  const handleViewAnalysis = (id) => {
    // TODO: Navigate to analysis detail page
    alert(`Viewing analysis ${id}`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getRatingColor = (score) => {
    if (score >= 2) return 'text-green-400'
    if (score >= 1) return 'text-yellow-400'
    if (score >= -1) return 'text-gray-400'
    if (score >= -2) return 'text-orange-400'
    return 'text-red-400'
  }

  const getRatingEmoji = (score) => {
    if (score >= 2) return '🟢🟢🟢'
    if (score >= 1) return '🟢🟢⚫'
    if (score >= -1) return '⚫⚫⚫'
    if (score >= -2) return '🔴🔴⚫'
    return '🔴🔴🔴'
  }

  return (
    <div class="animate-fade-in">
      <Show when={!authInitialized()}>
        <div class="text-center py-20">
          <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-muted">Initializing authentication...</p>
        </div>
      </Show>

      <Show when={authInitialized() && (!auth || !auth.user())}>
        <div class="text-center py-20">
          <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-muted">Loading dashboard...</p>
        </div>
      </Show>

      <Show when={authInitialized() && auth && auth.user()}>
        {/* Dashboard Header */}
        <div class="border-b border-border">
          <div class="max-w-6xl mx-auto px-6 py-8">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 class="text-3xl font-bold mb-2">Welcome back, {auth?.user()?.username}!</h1>
                <p class="text-muted">
                  You have {auth?.user()?.quota_total - (auth?.user()?.quota_used || 0)} free analyses remaining today
                </p>
              </div>
              <button
                onClick={handleNewAnalysis}
                class="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                New Analysis
              </button>
            </div>

            {/* Stats */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                {
                  label: 'Total Analyses',
                  value: analyses().length.toString(),
                  change: '+12%',
                },
                {
                  label: 'Today Used',
                  value: auth?.user()?.quota_used?.toString() || '0',
                  change: `${auth?.user()?.quota_used || 0}/${auth?.user()?.quota_total || 0}`,
                },
                {
                  label: 'Avg. Rating',
                  value: '2.1',
                  change: '+0.3',
                },
                {
                  label: 'Accuracy',
                  value: '87%',
                  change: '+5%',
                },
              ].map((stat) => (
                <div class="bg-surface border border-border rounded-xl p-4">
                  <div class="text-sm text-muted mb-1">{stat.label}</div>
                  <div class="flex items-baseline gap-2">
                    <div class="text-2xl font-bold">{stat.value}</div>
                    <div class="text-xs text-green-400">{stat.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        <div class="max-w-6xl mx-auto px-6 py-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">Recent Analyses</h2>
            <button
              onClick={loadAnalyses}
              class="px-4 py-2 text-sm text-muted hover:text-primary transition-colors"
            >
              Refresh
            </button>
          </div>

          <Show
            when={!isLoading()}
            fallback={
              <div class="text-center py-12">
                <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-muted">Loading analyses...</p>
              </div>
            }
          >
            <Show
              when={analyses().length > 0}
              fallback={
                <div class="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                  <div class="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-2xl">📊</span>
                  </div>
                  <h3 class="text-xl font-bold mb-2">No analyses yet</h3>
                  <p class="text-muted mb-6">Start by analyzing your first chart!</p>
                  <button
                    onClick={handleNewAnalysis}
                    class="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors"
                  >
                    Analyze First Chart
                  </button>
                </div>
              }
            >
              <div class="grid gap-4">
                {analyses().map((analysis) => (
                  <div class="bg-surface border border-border rounded-xl p-6 hover:border-primary transition-colors">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <div class="flex items-center gap-3 mb-2">
                          <span class={`text-2xl ${getRatingColor(analysis.analysis_metadata.rating_score)}`}>
                            {getRatingEmoji(analysis.analysis_metadata.rating_score)}
                          </span>
                          <div>
                            <div class="font-bold">
                              {analysis.analysis_metadata.pair} · {analysis.analysis_metadata.timeframe}
                            </div>
                            <div class="text-sm text-muted">
                              ${analysis.analysis_metadata.price} · {formatDate(analysis.created_at)}
                            </div>
                          </div>
                        </div>
                        <p class="text-sm text-muted line-clamp-2">
                          {analysis.analysis_metadata.summary}
                        </p>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="px-3 py-1 bg-bg border border-border rounded-full text-xs">
                          {analysis.platform}
                        </span>
                        <button
                          onClick={() => handleViewAnalysis(analysis.id)}
                          class="px-4 py-2 text-sm text-primary hover:text-primary-dark transition-colors"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                    <div class="border-t border-border pt-4">
                      <div class="flex items-center justify-between text-sm">
                        <span class="text-muted">Analysis ID: {analysis.id.slice(0, 8)}...</span>
                        <div class="flex items-center gap-4">
                          <button class="text-muted hover:text-primary">Share</button>
                          <button class="text-muted hover:text-primary">Export</button>
                          <button class="text-muted hover:text-primary">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div class="flex items-center justify-between mt-8 pt-8 border-t border-border">
                <button class="px-4 py-2 text-sm text-muted hover:text-primary transition-colors disabled:opacity-50">
                  ← Previous
                </button>
                <div class="text-sm text-muted">Page 1 of 1</div>
                <button class="px-4 py-2 text-sm text-muted hover:text-primary transition-colors disabled:opacity-50">
                  Next →
                </button>
              </div>
            </Show>
          </Show>
        </div>

        {/* Quick Actions */}
        <div class="max-w-6xl mx-auto px-6 py-8">
          <h2 class="text-2xl font-bold mb-6">Quick Actions</h2>
          <div class="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '📸',
                title: 'Capture Chart',
                description: 'Take a screenshot from aggr.trade or TradingView',
                action: handleNewAnalysis,
              },
              {
                icon: '📊',
                title: 'View History',
                description: 'Browse all your previous analyses',
                action: () => {/* TODO */},
              },
              {
                icon: '⚙️',
                title: 'Settings',
                description: 'Configure your preferences and account',
                action: () => {/* TODO */},
              },
            ].map((action) => (
              <button
                onClick={action.action}
                class="bg-surface border border-border rounded-xl p-6 text-left hover:border-primary transition-colors"
              >
                <div class="text-3xl mb-4">{action.icon}</div>
                <h3 class="font-bold mb-2">{action.title}</h3>
                <p class="text-sm text-muted">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      </Show>
    </div>
  )
}

export default DashboardPage