// 套餐与计费页面
import { createSignal, Show } from 'solid-js'
import { useAuth } from '../contexts/AuthContext'

function BillingPage() {
  const auth = useAuth()
  const [selectedPlan, setSelectedPlan] = createSignal('premium')
  const [loading, setLoading] = createSignal(false)

  // 套餐数据
  const plans = [
    {
      id: 'free',
      name: '免费版',
      price: '0',
      currency: 'USD',
      period: '每月',
      quota: 5,
      features: [
        '每日5次分析',
        '基础图表分析',
        '历史记录保存',
        '社区支持'
      ],
      limitations: [
        '无高级分析功能',
        '无优先支持',
        '广告支持'
      ],
      recommended: false
    },
    {
      id: 'premium',
      name: '高级版',
      price: '9.99',
      currency: 'USD',
      period: '每月',
      quota: 100,
      features: [
        '每日100次分析',
        '高级图表分析',
        '无限历史记录',
        '优先技术支持',
        '无广告体验',
        '批量分析功能',
        '数据导出'
      ],
      limitations: [],
      recommended: true
    },
    {
      id: 'pro',
      name: '专业版',
      price: '29.99',
      currency: 'USD',
      period: '每月',
      quota: 500,
      features: [
        '每日500次分析',
        '所有高级功能',
        '专属客户经理',
        'API访问权限',
        '自定义分析模板',
        '团队协作功能'
      ],
      limitations: [],
      recommended: false
    }
  ]

  // 支付方式
  const paymentMethods = [
    { id: 'credit_card', name: '信用卡/借记卡', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '🌐' },
    { id: 'alipay', name: '支付宝', icon: '💰' },
    { id: 'wechat', name: '微信支付', icon: '💬' }
  ]

  // 当前套餐
  const currentPlan = () => plans.find(p => p.id === auth.user.plan_type) || plans[0]

  // 处理升级
  const handleUpgrade = async () => {
    if (selectedPlan() === auth.user.plan_type) {
      alert('您已经订阅此套餐')
      return
    }

    setLoading(true)
    try {
      // 这里应该调用支付API
      // 暂时模拟支付成功
      await new Promise(resolve => setTimeout(resolve, 2000))

      alert(`成功升级到${plans.find(p => p.id === selectedPlan())?.name}套餐！`)
      // 实际应该更新用户信息
    } catch (error) {
      console.error('升级失败:', error)
      alert('升级失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 格式化价格
  const formatPrice = (plan) => {
    return `${plan.currency === 'USD' ? '$' : ''}${plan.price}${plan.currency !== 'USD' ? plan.currency : ''}`
  }

  return (
    <div class="billing-page">
      <div class="page-header">
        <h1 class="page-title">套餐与计费</h1>
        <p class="page-subtitle">选择适合您的分析套餐</p>
      </div>

      {/* 当前套餐状态 */}
      <div class="current-plan-card">
        <div class="current-plan-header">
          <div class="current-plan-info">
            <h3 class="current-plan-name">当前套餐：{currentPlan().name}</h3>
            <p class="current-plan-desc">
              每日 {currentPlan().quota} 次分析 · {formatPrice(currentPlan())}/{currentPlan().period}
            </p>
          </div>
          <div class="current-plan-status">
            <span class={`status-badge status-${auth.user.plan_type}`}>
              {auth.user.plan_type === 'free' ? '免费版' : '有效'}
            </span>
          </div>
        </div>

        <div class="current-plan-usage">
          <div class="usage-info">
            <div class="usage-label">今日使用情况</div>
            <div class="usage-value">
              {auth.user.quota_used} / {auth.user.quota_total} 次
            </div>
          </div>
          <div class="usage-bar">
            <div
              class="usage-progress"
              style={{ width: `${(auth.user.quota_used / auth.user.quota_total) * 100}%` }}
            />
          </div>
          <div class="usage-hint">
            剩余 {auth.user.quota_remaining} 次分析，每日重置
          </div>
        </div>
      </div>

      {/* 套餐选择 */}
      <div class="plans-section">
        <h2 class="section-title">选择套餐</h2>
        <p class="section-subtitle">所有套餐均包含核心分析功能，按需选择</p>

        <div class="plans-grid">
          <For each={plans}>
            {(plan) => (
              <div
                class={`plan-card ${plan.recommended ? 'recommended' : ''} ${plan.id === selectedPlan() ? 'selected' : ''} ${plan.id === auth.user.plan_type ? 'current' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <Show when={plan.recommended}>
                  <div class="plan-badge">推荐</div>
                </Show>

                <Show when={plan.id === auth.user.plan_type}>
                  <div class="plan-badge current">当前套餐</div>
                </Show>

                <div class="plan-header">
                  <h3 class="plan-name">{plan.name}</h3>
                  <div class="plan-price">
                    <span class="price-amount">{formatPrice(plan)}</span>
                    <span class="price-period">/{plan.period}</span>
                  </div>
                </div>

                <div class="plan-quota">
                  <div class="quota-icon">📊</div>
                  <div class="quota-info">
                    <div class="quota-value">每日 {plan.quota} 次</div>
                    <div class="quota-label">图表分析</div>
                  </div>
                </div>

                <div class="plan-features">
                  <h4 class="features-title">包含功能</h4>
                  <ul class="features-list">
                    <For each={plan.features}>
                      {(feature) => (
                        <li class="feature-item">
                          <span class="feature-icon">✓</span>
                          <span class="feature-text">{feature}</span>
                        </li>
                      )}
                    </For>
                  </ul>

                  <Show when={plan.limitations.length > 0}>
                    <h4 class="features-title limitations">限制</h4>
                    <ul class="features-list limitations">
                      <For each={plan.limitations}>
                        {(limitation) => (
                          <li class="feature-item">
                            <span class="feature-icon">✗</span>
                            <span class="feature-text">{limitation}</span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </div>

                <button
                  class={`plan-select-btn ${plan.id === auth.user.plan_type ? 'current' : ''}`}
                  disabled={plan.id === auth.user.plan_type}
                >
                  {plan.id === auth.user.plan_type ? '当前套餐' : '选择此套餐'}
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* 支付信息 */}
      <div class="payment-section">
        <h2 class="section-title">支付信息</h2>

        <div class="payment-form">
          {/* 支付方式 */}
          <div class="form-group">
            <label class="form-label">支付方式</label>
            <div class="payment-methods">
              <For each={paymentMethods}>
                {(method) => (
                  <label class="payment-method">
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={method.id === 'credit_card'}
                      class="payment-method-input"
                    />
                    <div class="payment-method-card">
                      <span class="method-icon">{method.icon}</span>
                      <span class="method-name">{method.name}</span>
                    </div>
                  </label>
                )}
              </For>
            </div>
          </div>

          {/* 信用卡信息 */}
          <div class="form-group">
            <label class="form-label">信用卡信息</label>
            <div class="credit-card-form">
              <input
                type="text"
                placeholder="卡号"
                class="form-input"
              />
              <div class="card-details">
                <input
                  type="text"
                  placeholder="MM/YY"
                  class="form-input"
                />
                <input
                  type="text"
                  placeholder="CVC"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          {/* 账单信息 */}
          <div class="form-group">
            <label class="form-label">账单信息</label>
            <input
              type="text"
              placeholder="姓名"
              class="form-input"
            />
            <input
              type="email"
              placeholder="邮箱地址"
              class="form-input"
              value={auth.user.email}
              readOnly
            />
          </div>

          {/* 优惠码 */}
          <div class="form-group">
            <label class="form-label">优惠码（可选）</label>
            <div class="coupon-input">
              <input
                type="text"
                placeholder="输入优惠码"
                class="form-input"
              />
              <button class="btn btn-outline">应用</button>
            </div>
          </div>
        </div>
      </div>

      {/* 订单摘要 */}
      <div class="order-summary">
        <h3 class="summary-title">订单摘要</h3>
        <div class="summary-details">
          <div class="summary-item">
            <span class="item-label">套餐</span>
            <span class="item-value">
              {plans.find(p => p.id === selectedPlan())?.name}
            </span>
          </div>
          <div class="summary-item">
            <span class="item-label">价格</span>
            <span class="item-value">
              {formatPrice(plans.find(p => p.id === selectedPlan()) || plans[0])}
            </span>
          </div>
          <div class="summary-item">
            <span class="item-label">周期</span>
            <span class="item-value">
              {plans.find(p => p.id === selectedPlan())?.period}
            </span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-total">
            <span class="total-label">总计</span>
            <span class="total-value">
              {formatPrice(plans.find(p => p.id === selectedPlan()) || plans[0])}
            </span>
          </div>
        </div>

        <div class="summary-actions">
          <button
            class="btn btn-primary w-full"
            onClick={handleUpgrade}
            disabled={loading() || selectedPlan() === auth.user.plan_type}
          >
            <Show when={loading()} fallback="确认升级">
              <span class="loading-spinner-small"></span>
              处理中...
            </Show>
          </button>
        </div>

        <div class="summary-note">
          <p class="note-text">
            💡 升级后立即生效，未使用的分析次数不会累积
          </p>
          <p class="note-text">
            🔄 随时可以降级或取消，按比例退款
          </p>
          <p class="note-text">
            🔒 支付信息加密处理，安全可靠
          </p>
        </div>
      </div>

      {/* 常见问题 */}
      <div class="faq-section">
        <h2 class="section-title">常见问题</h2>
        <div class="faq-list">
          <div class="faq-item">
            <div class="faq-question">如何取消订阅？</div>
            <div class="faq-answer">
              您可以在"账户设置"中随时取消订阅。取消后，您的套餐将在当前计费周期结束时失效。
            </div>
          </div>
          <div class="faq-item">
            <div class="faq-question">支持退款吗？</div>
            <div class="faq-answer">
              支持7天内无条件退款。超过7天按未使用天数比例退款。
            </div>
          </div>
          <div class="faq-item">
            <div class="faq-question">分析次数会累积吗？</div>
            <div class="faq-answer">
              不会。每日分析次数独立计算，未使用的次数不会累积到第二天。
            </div>
          </div>
          <div class="faq-item">
            <div class="faq-question">支持团队订阅吗？</div>
            <div class="faq-answer">
              支持。请联系客服获取团队订阅方案和优惠价格。
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .billing-page {
          padding-bottom: var(--space-2xl);
        }

        .page-header {
          margin-bottom: var(--space-xl);
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .page-subtitle {
          color: var(--color-text-secondary);
        }

        .current-plan-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .current-plan-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-lg);
        }

        .current-plan-info {
          flex: 1;
        }

        .current-plan-name {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .current-plan-desc {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-free {
          background: var(--color-surface-light);
          color: var(--color-text-secondary);
        }

        .status-premium,
        .status-pro {
          background: linear-gradient(135deg, #10b981, #34d399);
          color: white;
        }

        .current-plan-usage {
          background: var(--color-bg);
          border-radius: var(--radius-md);
          padding: var(--space-md);
        }

        .usage-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .usage-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .usage-value {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .usage-bar {
          height: 6px;
          background: var(--color-border);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: var(--space-sm);
        }

        .usage-progress {
          height: 100%;
          background: var(--color-accent);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .usage-hint {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          text-align: center;
        }

        .plans-section,
        .payment-section,
        .order-summary,
        .faq-section {
          margin-bottom: var(--space-xl);
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .section-subtitle {
          color: var(--color-text-secondary);
          margin-bottom: var(--space-lg);
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-lg);
        }

        .plan-card {
          position: relative;
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .plan-card:hover {
          border-color: var(--color-border-light);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .plan-card.selected {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .plan-card.recommended {
          border-color: var(--color-warning);
        }

        .plan-card.current {
          border-color: var(--color-success);
        }

        .plan-badge {
          position: absolute;
          top: -10px;
          right: 20px;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          z-index: 1;
        }

        .plan-badge.recommended {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #000;
        }

        .plan-badge.current {
          background: linear-gradient(135deg, #10b981, #34d399);
          color: white;
        }

        .plan-header {
          text-align: center;
          margin-bottom: var(--space-lg);
        }

        .plan-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .plan-price {
          margin-bottom: var(--space-sm);
        }

        .price-amount {
          font-size: 2rem;
          font-weight: 700;
        }

        .price-period {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .plan-quota {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: var(--color-bg);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .quota-icon {
          font-size: 1.5rem;
        }

        .quota-info {
          flex: 1;
        }

        .quota-value {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .quota-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .plan-features {
          margin-bottom: var(--space-lg);
        }

        .features-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
          color: var(--color-text);
        }

        .features-title.limitations {
          color: var(--color-text-secondary);
          margin-top: var(--space-md);
        }

        .features-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .features-list.limitations {
          opacity: 0.7;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
          font-size: 0.875rem;
        }

        .feature-item:last-child {
          margin-bottom: 0;
        }

        .feature-icon {
          flex-shrink: 0;
          color: var(--color-success);
        }

        .features-list.limitations .feature-icon {
          color: var(--color-text-secondary);
        }

        .feature-text {
          line-height: 1.4;
        }

        .plan-select-btn {
          width: 100%;
          padding: var(--space-md);
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .plan-select-btn:hover:not(:disabled) {
          background: var(--color-accent-dark);
        }

        .plan-select-btn.current {
          background: var(--color-success);
          cursor: default;
        }

        .plan-select-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .payment-form {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .form-group {
          margin-bottom: var(--space-lg);
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: var(--space-sm);
          color: var(--color-text);
        }

        .payment-methods {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-sm);
        }

        .payment-method {
          cursor: pointer;
        }

        .payment-method-input {
          display: none;
        }

        .payment-method-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-md);
          background: var(--color-bg);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .payment-method-input:checked + .payment-method-card {
          border-color: var(--color-accent);
          background: rgba(59, 130, 246, 0.05);
        }

        .method-icon {
          font-size: 1.5rem;
          margin-bottom: var(--space-xs);
        }

        .method-name {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .credit-card-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .card-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-sm);
        }

        .coupon-input {
          display: flex;
          gap: var(--space-sm);
        }

        .coupon-input .form-input {
          flex: 1;
        }

        .order-summary {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .summary-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-lg);
          padding-bottom: var(--space-sm);
          border-bottom: 1px solid var(--color-border);
        }

        .summary-details {
          margin-bottom: var(--space-lg);
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .item-label {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .item-value {
          font-weight: 500;
          font-size: 0.875rem;
        }

        .summary-divider {
          height: 1px;
          background: var(--color-border);
          margin: var(--space-md) 0;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--space-md);
          border-top: 2px solid var(--color-border);
        }

        .total-label {
          font-size: 1rem;
          font-weight: 600;
        }

        .total-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-accent);
        }

        .summary-actions {
          margin-bottom: var(--space-lg);
        }

        .summary-note {
          background: var(--color-bg);
          border-radius: var(--radius-md);
          padding: var(--space-md);
        }

        .note-text {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-xs);
        }

        .note-text:last-child {
          margin-bottom: 0;
        }

        .faq-list {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .faq-item {
          border-bottom: 1px solid var(--color-border);
        }

        .faq-item:last-child {
          border-bottom: none;
        }

        .faq-question {
          padding: var(--space-lg);
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .faq-question:hover {
          background: var(--color-surface-light);
        }

        .faq-answer {
          padding: 0 var(--space-lg) var(--space-lg);
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .loading-spinner-small {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: var(--space-sm);
        }

        @media (max-width: 768px) {
          .plans-grid {
            grid-template-columns: 1fr;
          }

          .payment-methods {
            grid-template-columns: repeat(2, 1fr);
          }

          .current-plan-header {
            flex-direction: column;
            gap: var(--space-md);
          }

          .status-badge {
            align-self: flex-start;
          }
        }

        @media (max-width: 480px) {
          .payment-methods {
            grid-template-columns: 1fr;
          }

          .card-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default BillingPage