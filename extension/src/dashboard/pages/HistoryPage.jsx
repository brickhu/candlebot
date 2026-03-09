// 历史记录页面
import { createSignal, createEffect, Show, For } from 'solid-js'
import { useAPI } from '../contexts/APIContext'

function HistoryPage() {
  const api = useAPI()
  const [analyses, setAnalyses] = createSignal([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')
  const [pagination, setPagination] = createSignal({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 1
  })

  // 筛选条件
  const [filters, setFilters] = createSignal({
    platform: '',
    pair: '',
    rating: '',
    date_from: '',
    date_to: ''
  })

  // 加载分析历史
  const loadHistory = async (page = 1) => {
    try {
      setLoading(true)
      setError('')

      const params = {
        page,
        per_page: pagination().per_page,
        ...filters()
      }

      // 清理空值
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const data = await api.analysis.getHistory(params)

      setAnalyses(data.items || [])
      setPagination({
        page: data.page,
        per_page: data.per_page,
        total: data.total,
        total_pages: data.total_pages
      })
    } catch (err) {
      console.error('加载历史记录失败:', err)
      setError('加载失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  createEffect(() => {
    loadHistory()
  })

  // 处理筛选
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    loadHistory(1) // 重置到第一页
  }

  const clearFilters = () => {
    setFilters({
      platform: '',
      pair: '',
      rating: '',
      date_from: '',
      date_to: ''
    })
    loadHistory(1)
  }

  // 处理分页
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination().total_pages) {
      loadHistory(page)
    }
  }

  // 删除分析记录
  const handleDelete = async (id, e) => {
    e.stopPropagation()

    if (!confirm('确定要删除这条分析记录吗？')) {
      return
    }

    try {
      await api.analysis.deleteAnalysis(id)
      // 重新加载当前页
      loadHistory(pagination().page)
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败，请重试')
    }
  }

  // 评级颜色
  const getRatingColor = (rating) => {
    if (rating?.includes('🟢')) return 'success'
    if (rating?.includes('🔴')) return 'error'
    return 'muted'
  }

  // 格式化时间
  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div class="history-page">
      <div class="page-header">
        <h1 class="page-title">分析记录</h1>
        <p class="page-subtitle">查看和管理您的所有分析历史</p>
      </div>

      {/* 筛选器 */}
      <div class="filters-card">
        <div class="filters-header">
          <h3 class="filters-title">筛选条件</h3>
          <button class="btn btn-outline" onClick={clearFilters}>
            清除筛选
          </button>
        </div>

        <div class="filters-grid">
          {/* 平台筛选 */}
          <div class="filter-group">
            <label class="filter-label">平台</label>
            <select
              value={filters().platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
              class="filter-select"
            >
              <option value="">全部平台</option>
              <option value="aggr">aggr.trade</option>
              <option value="tradingview">TradingView</option>
            </select>
          </div>

          {/* 交易对筛选 */}
          <div class="filter-group">
            <label class="filter-label">交易对</label>
            <input
              type="text"
              value={filters().pair}
              onInput={(e) => handleFilterChange('pair', e.target.value)}
              placeholder="如 BTCUSD, ETHUSD"
              class="filter-input"
            />
          </div>

          {/* 评级筛选 */}
          <div class="filter-group">
            <label class="filter-label">评级</label>
            <select
              value={filters().rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              class="filter-select"
            >
              <option value="">全部评级</option>
              <option value="🟢">做多信号</option>
              <option value="🔴">做空信号</option>
              <option value="⚫">观望</option>
            </select>
          </div>

          {/* 日期范围 */}
          <div class="filter-group">
            <label class="filter-label">开始日期</label>
            <input
              type="date"
              value={filters().date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              class="filter-input"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">结束日期</label>
            <input
              type="date"
              value={filters().date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              class="filter-input"
            />
          </div>
        </div>

        <div class="filters-actions">
          <button class="btn btn-primary" onClick={applyFilters}>
            应用筛选
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      <Show when={error()}>
        <div class="error-card">
          <div class="error-icon">⚠️</div>
          <div class="error-content">
            <div class="error-title">加载失败</div>
            <div class="error-message">{error()}</div>
          </div>
          <button class="btn btn-outline" onClick={() => loadHistory(pagination().page)}>
            重试
          </button>
        </div>
      </Show>

      {/* 加载状态 */}
      <Show when={loading()}>
        <div class="loading-card">
          <div class="loading-spinner"></div>
          <div>加载中...</div>
        </div>
      </Show>

      {/* 分析列表 */}
      <Show when={!loading() && analyses().length > 0}>
        <div class="analyses-list">
          <For each={analyses()}>
            {(analysis) => (
              <div class="analysis-item">
                <div class="analysis-item-header">
                  <div class="analysis-item-pair">
                    <span class="pair-symbol">{analysis.metadata?.pair || '未知'}</span>
                    <span class="pair-timeframe">{analysis.metadata?.timeframe || ''}</span>
                    <span class="pair-platform">{analysis.platform}</span>
                  </div>
                  <div class={`analysis-item-rating rating-${getRatingColor(analysis.metadata?.rating)}`}>
                    {analysis.metadata?.rating || '⚫⚫⚫'}
                  </div>
                </div>

                <div class="analysis-item-body">
                  <div class="analysis-item-summary">
                    {analysis.metadata?.summary || '暂无摘要'}
                  </div>
                  <div class="analysis-item-meta">
                    <div class="meta-price">
                      ${analysis.metadata?.price || '--'}
                    </div>
                    <div class="meta-time">
                      {formatDateTime(analysis.created_at)}
                    </div>
                  </div>
                </div>

                <div class="analysis-item-actions">
                  <button class="btn btn-outline btn-sm">
                    查看详情
                  </button>
                  <button class="btn btn-outline btn-sm">
                    分享
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    onClick={(e) => handleDelete(analysis.id, e)}
                  >
                    删除
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* 分页 */}
        <div class="pagination">
          <button
            class="pagination-btn"
            disabled={pagination().page === 1}
            onClick={() => goToPage(pagination().page - 1)}
          >
            上一页
          </button>

          <div class="pagination-info">
            第 {pagination().page} 页，共 {pagination().total_pages} 页
            （总计 {pagination().total} 条记录）
          </div>

          <button
            class="pagination-btn"
            disabled={pagination().page === pagination().total_pages}
            onClick={() => goToPage(pagination().page + 1)}
          >
            下一页
          </button>
        </div>
      </Show>

      {/* 空状态 */}
      <Show when={!loading() && analyses().length === 0}>
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-title">暂无分析记录</div>
          <div class="empty-description">
            {Object.values(filters()).some(v => v)
              ? '当前筛选条件下没有找到记录，尝试调整筛选条件'
              : '开始您的第一次图表分析，获取专业的交易建议'}
          </div>
          <button class="btn btn-primary">
            开始分析
          </button>
        </div>
      </Show>

      <style>{`
        .history-page {
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

        .filters-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .filters-title {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-lg);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .filter-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text);
        }

        .filter-select,
        .filter-input {
          width: 100%;
        }

        .filters-actions {
          text-align: right;
        }

        .error-card {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .error-icon {
          font-size: 2rem;
          color: var(--color-error);
        }

        .error-content {
          flex: 1;
        }

        .error-title {
          font-weight: 600;
          margin-bottom: var(--space-xs);
          color: var(--color-error);
        }

        .error-message {
          color: var(--color-error);
          opacity: 0.9;
        }

        .loading-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-xl);
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--space-md);
        }

        .analyses-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .analysis-item {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          transition: all var(--transition-fast);
        }

        .analysis-item:hover {
          border-color: var(--color-border-light);
          box-shadow: var(--shadow-md);
        }

        .analysis-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }

        .analysis-item-pair {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .pair-symbol {
          font-weight: 600;
          font-size: 1.125rem;
        }

        .pair-timeframe,
        .pair-platform {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          background: var(--color-surface-light);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .analysis-item-rating {
          font-size: 1rem;
          font-weight: 500;
        }

        .rating-success {
          color: var(--color-success);
        }

        .rating-error {
          color: var(--color-error);
        }

        .rating-muted {
          color: var(--color-text-secondary);
        }

        .analysis-item-body {
          margin-bottom: var(--space-lg);
        }

        .analysis-item-summary {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin-bottom: var(--space-md);
        }

        .analysis-item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .meta-price {
          font-weight: 600;
          font-size: 1.125rem;
        }

        .meta-time {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .analysis-item-actions {
          display: flex;
          gap: var(--space-sm);
          justify-content: flex-end;
        }

        .btn-sm {
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg) 0;
          border-top: 1px solid var(--color-border);
        }

        .pagination-btn {
          padding: 0.5rem 1rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--color-surface-light);
          border-color: var(--color-border-light);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: var(--space-lg);
        }

        .empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
        }

        .empty-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--space-lg);
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }

          .analysis-item-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-sm);
          }

          .analysis-item-actions {
            flex-wrap: wrap;
          }

          .pagination {
            flex-direction: column;
            gap: var(--space-md);
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}

export default HistoryPage