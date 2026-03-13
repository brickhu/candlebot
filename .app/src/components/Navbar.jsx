import { Show } from 'solid-js'
import { useNavigate, A } from '@solidjs/router'
import { useAuth } from '../lib/auth'

const Navbar = () => {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  const handleRegister = () => {
    navigate('/register')
  }

  const handleDashboard = () => {
    navigate('/dashboard')
  }

  const handleLogout = async () => {
    await auth.logout()
    navigate('/')
  }

  return (
    <nav class="fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur border-b border-border">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <A href="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span class="text-bg font-bold text-sm">C</span>
          </div>
          <div>
            <div class="font-mono font-bold text-primary text-sm tracking-widest">CANDLEBOT</div>
            <div class="text-muted text-xs mt-0.5">AI Chart Analysis</div>
          </div>
        </A>

        {/* Navigation Links */}
        <div class="hidden md:flex items-center gap-8">
          <A href="/" class="text-muted hover:text-primary text-sm transition-colors">
            Home
          </A>
          <A href="/#features" class="text-muted hover:text-primary text-sm transition-colors">
            Features
          </A>
          <A href="/#pricing" class="text-muted hover:text-primary text-sm transition-colors">
            Pricing
          </A>
          <A href="/#faq" class="text-muted hover:text-primary text-sm transition-colors">
            FAQ
          </A>
        </div>

        {/* Auth Buttons */}
        <div class="flex items-center gap-4">
          <Show
            when={auth.user()}
            fallback={
              <>
                <button
                  onClick={handleLogin}
                  class="px-4 py-2 text-sm text-muted hover:text-primary transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegister}
                  class="px-4 py-2 bg-primary text-bg rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Get Started
                </button>
              </>
            }
          >
            <div class="flex items-center gap-4">
              <button
                onClick={handleDashboard}
                class="px-4 py-2 text-sm text-muted hover:text-primary transition-colors"
              >
                Dashboard
              </button>
              <div class="relative group">
                <button class="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:border-primary transition-colors">
                  <div class="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <span class="text-primary text-xs font-bold">
                      {auth.user()?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span class="text-sm font-medium">{auth.user()?.username}</span>
                  <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div class="py-2">
                    <button
                      onClick={handleDashboard}
                      class="w-full px-4 py-2 text-left text-sm hover:bg-bg transition-colors"
                    >
                      Dashboard
                    </button>
                    <button class="w-full px-4 py-2 text-left text-sm hover:bg-bg transition-colors">
                      Settings
                    </button>
                    <div class="border-t border-border my-1"></div>
                    <button
                      onClick={handleLogout}
                      class="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-bg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </nav>
  )
}

export default Navbar