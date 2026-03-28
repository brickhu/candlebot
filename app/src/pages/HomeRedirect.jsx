import { onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'

const HomeRedirect = () => {
  const navigate = useNavigate()

  onMount(() => {
    console.log('🏠 Home page redirecting to Dashboard')
    navigate('/dashboard', { replace: true })
  })

  return (
    <div class="min-h-screen flex items-center justify-center bg-bg">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-muted">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

export default HomeRedirect