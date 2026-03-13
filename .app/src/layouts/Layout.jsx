import { Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../lib/auth'
import Navbar from '../components/Navbar'

const Layout = (props) => {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <div class="min-h-screen bg-bg text-text">
      <Navbar />
      <main class="pt-16">
        {/* <Show when={auth.isLoading()}>
          <div class="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div class="text-center">
              <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-muted font-mono text-sm">Loading...</p>
            </div>
          </div>
        </Show> */}
        {props.children}
      </main>
      <footer class="border-t border-border py-8 mt-16">
        <div class="max-w-6xl mx-auto px-6">
          <div class="flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span class="text-bg font-bold text-sm">C</span>
              </div>
              <div>
                <div class="font-mono font-bold text-primary text-sm tracking-widest">CANDLEBOT</div>
                <div class="text-muted text-xs mt-0.5">AI-powered chart analysis</div>
              </div>
            </div>
            <div class="text-muted text-sm">
              © {new Date().getFullYear()} Candlebot. All rights reserved.
            </div>
            <div class="flex gap-6">
              <a href="#" class="text-muted hover:text-primary text-sm transition-colors">
                Privacy
              </a>
              <a href="#" class="text-muted hover:text-primary text-sm transition-colors">
                Terms
              </a>
              <a href="#" class="text-muted hover:text-primary text-sm transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout