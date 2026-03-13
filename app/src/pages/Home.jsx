import { useNavigate } from '@solidjs/router'
import { useAuth } from '../lib/auth'
import DaisyUITemplate from '../components/DaisyUITemplate'

const HomePage = () => {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (auth?.user()) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  // 你可以选择使用DaisyUI模板或者原来的简单页面
  // 这里我们展示DaisyUI模板作为示例
  // return <DaisyUITemplate />

  // 如果你想保留原来的简单页面，取消下面的注释：
  return (
    <div class="animate-fade-in">
      {/* Hero Section */}
      <button onClick={handleGetStarted}>Get started</button>
    </div>
  )
}

export default HomePage