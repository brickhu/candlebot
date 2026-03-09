// 404页面
import { A } from '@solidjs/router'

function NotFoundPage() {
  return (
    <div class="not-found-page">
      <div class="not-found-content">
        <div class="not-found-icon">🔍</div>
        <h1 class="not-found-title">页面未找到</h1>
        <p class="not-found-description">
          抱歉，您访问的页面不存在或已被移除
        </p>
        <div class="not-found-actions">
          <A href="/" class="btn btn-primary">
            返回首页
          </A>
          <A href="/history" class="btn btn-outline">
            查看分析记录
          </A>
        </div>
        <div class="not-found-links">
          <A href="/settings" class="link">设置</A>
          <A href="/billing" class="link">套餐与计费</A>
          <A href="/help" class="link">帮助中心</A>
        </div>
      </div>

      <style>{`
        .not-found-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          padding: var(--space-2xl);
        }

        .not-found-content {
          text-align: center;
          max-width: 400px;
        }

        .not-found-icon {
          font-size: 4rem;
          margin-bottom: var(--space-lg);
        }

        .not-found-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: var(--space-md);
        }

        .not-found-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xl);
          line-height: 1.5;
        }

        .not-found-actions {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          margin-bottom: var(--space-xl);
        }

        .not-found-links {
          display: flex;
          gap: var(--space-lg);
          justify-content: center;
        }

        .link {
          color: var(--color-accent);
          text-decoration: none;
          font-size: 0.875rem;
        }

        .link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .not-found-actions {
            flex-direction: column;
          }

          .not-found-links {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  )
}

export default NotFoundPage