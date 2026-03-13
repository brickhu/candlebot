import { A } from '@solidjs/router'

const NotFound = () => {
  return (
    <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 animate-fade-in">
      <div class="text-center max-w-md">
        <div class="text-9xl font-bold text-primary/20 mb-8">404</div>
        <h1 class="text-3xl font-bold mb-4">Page Not Found</h1>
        <p class="text-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <A
            href="/"
            class="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Go Home
          </A>
          <A
            href="/dashboard"
            class="px-6 py-3 bg-surface border border-border rounded-lg font-medium hover:border-primary transition-colors"
          >
            Go to Dashboard
          </A>
        </div>
      </div>
    </div>
  )
}

export default NotFound