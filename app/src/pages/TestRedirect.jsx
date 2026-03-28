import { createSignal, onMount } from 'solid-js'
import { useNavigate, A } from '@solidjs/router'
import { getCurrentFullUrl, parseFullUrl, getLoginRedirectUrl, getRegisterRedirectUrl } from '../lib/redirect'

const TestRedirectPage = () => {
  const [currentUrl, setCurrentUrl] = createSignal('')
  const [parsedUrl, setParsedUrl] = createSignal({})
  const [loginRedirectUrl, setLoginRedirectUrl] = createSignal('')
  const [registerRedirectUrl, setRegisterRedirectUrl] = createSignal('')
  const navigate = useNavigate()

  onMount(() => {
    // 获取当前URL信息
    const url = getCurrentFullUrl()
    setCurrentUrl(url)

    const parsed = parseFullUrl(url)
    setParsedUrl(parsed)

    // 获取重定向URL
    setLoginRedirectUrl(getLoginRedirectUrl())
    setRegisterRedirectUrl(getRegisterRedirectUrl())

    console.log('测试页面加载完成')
    console.log('当前URL:', url)
    console.log('解析结果:', parsed)
    console.log('登录重定向URL:', getLoginRedirectUrl())
    console.log('注册重定向URL:', getRegisterRedirectUrl())
  })

  const handleTestProtectedPage = () => {
    // 模拟访问受保护页面
    navigate('/new?test=123&auto=true')
  }

  const handleTestWithComplexParams = () => {
    // 模拟访问带复杂参数的页面
    navigate('/dashboard?filter=recent&sort=date&page=2&search=test%20query')
  }

  const handleClearLocalStorage = () => {
    localStorage.removeItem('oauth_redirect_url')
    alert('已清除OAuth重定向URL')
  }

  const handleSetOAuthRedirect = () => {
    localStorage.setItem('oauth_redirect_url', '/new?from=extension&screenshot=base64data')
    alert('已设置OAuth重定向URL')
  }

  return (
    <div class="min-h-screen bg-bg p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">重定向逻辑测试页面</h1>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 当前URL信息 */}
          <div class="bg-surface border border-border rounded-2xl p-6">
            <h2 class="text-xl font-bold mb-4">当前URL信息</h2>
            <div class="space-y-4">
              <div>
                <div class="text-sm text-muted mb-1">完整URL:</div>
                <div class="bg-bg border border-border rounded-lg p-3 font-mono text-sm break-all">
                  {currentUrl()}
                </div>
              </div>

              <div>
                <div class="text-sm text-muted mb-1">解析结果:</div>
                <div class="bg-bg border border-border rounded-lg p-3">
                  <pre class="text-sm whitespace-pre-wrap">{JSON.stringify(parsedUrl(), null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* 重定向URL信息 */}
          <div class="bg-surface border border-border rounded-2xl p-6">
            <h2 class="text-xl font-bold mb-4">重定向URL</h2>
            <div class="space-y-4">
              <div>
                <div class="text-sm text-muted mb-1">登录重定向URL:</div>
                <div class="bg-bg border border-border rounded-lg p-3 font-mono text-sm break-all">
                  {loginRedirectUrl()}
                </div>
                <A
                  href={loginRedirectUrl()}
                  class="mt-2 inline-block px-4 py-2 bg-primary text-bg rounded-lg hover:bg-primary-dark transition-colors"
                >
                  测试登录重定向
                </A>
              </div>

              <div>
                <div class="text-sm text-muted mb-1">注册重定向URL:</div>
                <div class="bg-bg border border-border rounded-lg p-3 font-mono text-sm break-all">
                  {registerRedirectUrl()}
                </div>
                <A
                  href={registerRedirectUrl()}
                  class="mt-2 inline-block px-4 py-2 bg-primary text-bg rounded-lg hover:bg-primary-dark transition-colors"
                >
                  测试注册重定向
                </A>
              </div>
            </div>
          </div>

          {/* 测试操作 */}
          <div class="bg-surface border border-border rounded-2xl p-6 md:col-span-2">
            <h2 class="text-xl font-bold mb-4">测试操作</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={handleTestProtectedPage}
                class="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-bg transition-colors"
              >
                测试受保护页面
              </button>

              <button
                onClick={handleTestWithComplexParams}
                class="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-bg transition-colors"
              >
                测试复杂参数
              </button>

              <button
                onClick={handleSetOAuthRedirect}
                class="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-bg transition-colors"
              >
                设置OAuth重定向
              </button>

              <button
                onClick={handleClearLocalStorage}
                class="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-bg transition-colors"
              >
                清除OAuth重定向
              </button>
            </div>
          </div>

          {/* 测试用例说明 */}
          <div class="bg-surface border border-border rounded-2xl p-6 md:col-span-2">
            <h2 class="text-xl font-bold mb-4">测试用例说明</h2>
            <div class="space-y-4">
              <div class="border-l-4 border-primary pl-4 py-2">
                <h3 class="font-bold mb-1">用例1: 普通页面重定向</h3>
                <p class="text-sm text-muted">
                  访问受保护页面 → 重定向到登录页 → 登录成功 → 返回原页面
                </p>
              </div>

              <div class="border-l-4 border-primary pl-4 py-2">
                <h3 class="font-bold mb-1">用例2: 带参数页面重定向</h3>
                <p class="text-sm text-muted">
                  访问带查询参数的页面 → 重定向到登录页 → 登录成功 → 返回原页面并保留参数
                </p>
              </div>

              <div class="border-l-4 border-primary pl-4 py-2">
                <h3 class="font-bold mb-1">用例3: OAuth登录重定向</h3>
                <p class="text-sm text-muted">
                  从扩展跳转 → OAuth登录 → 登录成功 → 返回扩展跳转的页面
                </p>
              </div>

              <div class="border-l-4 border-primary pl-4 py-2">
                <h3 class="font-bold mb-1">用例4: 注册后重定向</h3>
                <p class="text-sm text-muted">
                  访问受保护页面 → 重定向到注册页 → 注册成功 → 返回原页面
                </p>
              </div>
            </div>
          </div>

          {/* 快速链接 */}
          <div class="bg-surface border border-border rounded-2xl p-6 md:col-span-2">
            <h2 class="text-xl font-bold mb-4">快速链接</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <A
                href="/new?test=simple"
                class="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-bg transition-colors text-center"
              >
                /new?test=simple
              </A>

              <A
                href="/dashboard?filter=recent&page=1"
                class="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-bg transition-colors text-center"
              >
                /dashboard?filter=recent
              </A>

              <A
                href="/new?from=extension&auto=true"
                class="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-bg transition-colors text-center"
              >
                /new?from=extension
              </A>

              <A
                href="/login"
                class="px-4 py-3 bg-surface border border-border rounded-lg hover:bg-bg transition-colors text-center"
              >
                直接登录页
              </A>
            </div>
          </div>
        </div>

        <div class="mt-8 text-center text-sm text-muted">
          <p>测试完成后，请检查浏览器控制台查看详细的日志输出。</p>
          <p class="mt-2">注意：实际登录/注册功能需要后端API支持才能完全测试。</p>
        </div>
      </div>
    </div>
  )
}

export default TestRedirectPage