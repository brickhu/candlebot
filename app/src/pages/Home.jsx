import { A } from '@solidjs/router'

const HomePage = () => {
  return (
    <div class="min-h-screen bg-gradient-to-b from-bg to-surface">
      {/* Hero Section */}
      <div class="max-w-6xl mx-auto px-6 py-20">
        <div class="text-center">
          <div class="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span class="text-bg font-bold text-3xl">C</span>
          </div>
          <h1 class="text-5xl font-bold mb-6">
            AI-Powered Chart Analysis
            <span class="block text-primary mt-2">for Traders</span>
          </h1>
          <p class="text-xl text-muted max-w-2xl mx-auto mb-10">
            Upload chart screenshots from TradingView or aggr.trade and get instant AI analysis with actionable insights.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <A
              href={`/login?from=${encodeURIComponent('/dashboard')}`}
              class="px-8 py-4 bg-primary text-bg rounded-xl font-bold text-lg hover:bg-primary-dark transition-colors"
            >
              Get Started Free
            </A>
            <A
              href={`/register?from=${encodeURIComponent('/dashboard')}`}
              class="px-8 py-4 bg-surface border-2 border-primary text-primary rounded-xl font-bold text-lg hover:bg-primary/10 transition-colors"
            >
              Create Account
            </A>
          </div>
        </div>

        {/* Features */}
        <div class="grid md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: '📸',
              title: 'Easy Capture',
              description: 'Take screenshots from any trading platform and upload instantly.'
            },
            {
              icon: '🤖',
              title: 'AI Analysis',
              description: 'Get detailed technical analysis and trading signals powered by AI.'
            },
            {
              icon: '⚡',
              title: 'Instant Results',
              description: 'Receive analysis in seconds, not hours. Make faster trading decisions.'
            }
          ].map((feature, index) => (
            <div class="bg-surface border border-border rounded-2xl p-8 text-center">
              <div class="text-4xl mb-4">{feature.icon}</div>
              <h3 class="text-xl font-bold mb-3">{feature.title}</h3>
              <p class="text-muted">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div class="mb-20">
          <h2 class="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div class="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Capture', desc: 'Take a screenshot of your chart' },
              { step: '2', title: 'Upload', desc: 'Upload to Candlebot' },
              { step: '3', title: 'Analyze', desc: 'AI analyzes the chart' },
              { step: '4', title: 'Trade', desc: 'Get actionable insights' }
            ].map((item) => (
              <div class="text-center">
                <div class="w-12 h-12 bg-primary text-bg rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h4 class="font-bold mb-2">{item.title}</h4>
                <p class="text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div class="bg-primary/10 border border-primary/20 rounded-2xl p-10 text-center">
          <h2 class="text-3xl font-bold mb-4">Start Analyzing Charts Today</h2>
          <p class="text-xl text-muted mb-8 max-w-2xl mx-auto">
            Join thousands of traders who use Candlebot to make better trading decisions.
          </p>
          <A
            href={`/register?from=${encodeURIComponent('/dashboard')}`}
            class="inline-block px-8 py-4 bg-primary text-bg rounded-xl font-bold text-lg hover:bg-primary-dark transition-colors"
          >
            Create Free Account
          </A>
          <p class="mt-4 text-sm text-muted">
            Already have an account?{' '}
            <A href={`/login?from=${encodeURIComponent('/dashboard')}`} class="text-primary hover:text-primary-dark font-medium">
              Sign in here
            </A>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div class="border-t border-border mt-20 py-8">
        <div class="max-w-6xl mx-auto px-6">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <div class="flex items-center gap-3 mb-4 md:mb-0">
              <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span class="text-bg font-bold">C</span>
              </div>
              <span class="font-bold">Candlebot</span>
            </div>
            <div class="text-sm text-muted">
              © 2024 Candlebot. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage