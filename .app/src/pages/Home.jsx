import { useNavigate } from '@solidjs/router'
import { useAuth } from '../lib/auth'

const HomePage = () => {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (auth.user()) {
      navigate('/dashboard')
    } else {
      navigate('/register')
    }
  }

  return (
    <div class="animate-fade-in">
      {/* Hero Section */}
      <section class="pt-20 pb-32 px-6">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <div class="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 mb-8">
              <span class="w-2 h-2 rounded-full bg-primary animate-pulse-slow"></span>
              <span class="font-mono text-xs text-primary">AI-POWERED CHART ANALYSIS</span>
            </div>

            <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span class="block">Read Charts Like</span>
              <span class="text-primary">Never Before</span>
            </h1>

            <p class="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              Candlebot uses advanced AI to analyze trading charts from aggr.trade and TradingView,
              giving you clear, actionable insights in seconds.
            </p>

            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                class="px-8 py-4 bg-primary text-bg rounded-xl font-medium text-lg hover:bg-primary-dark transition-colors hover:scale-105 shadow-lg"
              >
                Start Analyzing Free
              </button>
              <button class="px-8 py-4 bg-surface border border-border rounded-xl font-medium text-lg hover:border-primary transition-colors">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Stats */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {[
              { value: '10K+', label: 'Charts Analyzed' },
              { value: '95%', label: 'Accuracy Rate' },
              { value: '24/7', label: 'AI Availability' },
              { value: 'Free', label: 'Basic Plan' },
            ].map((stat) => (
              <div class="text-center p-6 bg-surface border border-border rounded-xl">
                <div class="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div class="text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features Preview */}
          <div class="mb-20">
            <h2 class="text-3xl font-bold text-center mb-12">Why Choose Candlebot?</h2>
            <div class="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '⚡',
                  title: 'Instant Analysis',
                  description: 'Get AI-powered insights in seconds, not hours.',
                },
                {
                  icon: '🎯',
                  title: 'Clear Signals',
                  description: 'Simple buy/sell/hold recommendations with confidence scores.',
                },
                {
                  icon: '📊',
                  title: 'Multiple Platforms',
                  description: 'Works with aggr.trade, TradingView, and more.',
                },
              ].map((feature) => (
                <div class="p-6 bg-surface border border-border rounded-xl hover:border-primary transition-colors">
                  <div class="text-3xl mb-4">{feature.icon}</div>
                  <h3 class="text-xl font-bold mb-3">{feature.title}</h3>
                  <p class="text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div class="bg-gradient-to-br from-surface to-bg border border-border rounded-2xl p-12 text-center">
            <h2 class="text-3xl font-bold mb-6">Ready to Transform Your Trading?</h2>
            <p class="text-muted text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of traders who use Candlebot to make better decisions.
            </p>
            <button
              onClick={handleGetStarted}
              class="px-10 py-4 bg-primary text-bg rounded-xl font-medium text-lg hover:bg-primary-dark transition-colors hover:scale-105"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage