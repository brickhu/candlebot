// 分析详情页面
import { createSignal, createEffect, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { useAPI } from '../contexts/APIContext'

function AnalysisDetailPage() {
  const params = useParams()
  const api = useAPI()

  const [analysis, setAnalysis] = createSignal(null)
  const [conversation, setConversation] = createSignal(null)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')
  const [question, setQuestion] = createSignal('')
  const [asking, setAsking] = createSignal(false)

  // 加载分析详情
  createEffect(async () => {
    try {
      setLoading(true)
      setError('')

      const analysisId = parseInt(params.id)
      if (!analysisId) {
        throw new Error('无效的分析ID')
      }

      // 加载分析详情
      const analysisData = await api.analysis.getAnalysis(analysisId)
      setAnalysis(analysisData)

      // 加载对话
      try {
        const conversationData = await api.conversation.getConversation(analysisId)
        setConversation(conversationData)
      } catch (convError) {
        console.log('未找到对话记录，将创建新对话')
      }
    } catch (err) {
      console.error('加载分析详情失败:', err)
      setError(err.message || '加载失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  })

  // 处理提问
  const handleAskQuestion = async () => {
    const q = question().trim()
    if (!q || asking()) return

    try {
      setAsking(true)

      const response = await api.conversation.askQuestion(
        parseInt(params.id),
        q,
        'zh'
      )

      // 重新加载对话
      const conversationData = await api.conversation.getConversation(parseInt(params.id))
      setConversation(conversationData)

      // 清空输入框
      setQuestion('')
    } catch (err) {
      console.error('提问失败:', err)
      alert('提问失败: ' + err.message)
    } finally {
      setAsking(false)
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
    <div class="analysis-detail-page">
      {/* 加载状态 */}
      <Show when={loading()}>
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div>加载分析详情...</div>
        </div>
      </Show>

      {/* 错误状态 */}
      <Show when={error()}>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <div class="error-message">{error()}</div>
          <button class="btn btn-primary" onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      </Show>

      {/* 分析详情 */}
      <Show when={!loading() && !error() && analysis()}>
        <div class="analysis-detail">
          {/* 头部信息 */}
          <div class="analysis-header">
            <div class="analysis-basic-info">
              <div class="analysis-pair">
                <span class="pair-symbol">{analysis().metadata?.pair || '未知'}</span>
                <span class="pair-timeframe">{analysis().metadata?.timeframe || ''}</span>
                <span class="pair-platform">{analysis().platform}</span>
              </div>
              <div class="analysis-price-time">
                <div class="analysis-price">
                  ${analysis().metadata?.price || '--'}
                </div>
                <div class="analysis-time">
                  {formatDateTime(analysis().created_at)}
                </div>
              </div>
            </div>

            <div class={`analysis-rating rating-${getRatingColor(analysis().metadata?.rating)}`}>
              {analysis().metadata?.rating || '⚫⚫⚫'}
            </div>
          </div>

          {/* 摘要卡片 */}
          <div class="summary-card">
            <h3 class="card-title">分析摘要</h3>
            <p class="summary-text">{analysis().metadata?.summary || '暂无摘要'}</p>
          </div>

          {/* 完整报告 */}
          <div class="report-card">
            <div class="card-header">
              <h3 class="card-title">完整分析报告</h3>
              <div class="card-actions">
                <button class="btn btn-outline btn-sm">复制</button>
                <button class="btn btn-outline btn-sm">导出</button>
              </div>
            </div>
            <div class="report-content">
              <pre class="report-text">{analysis().report_data?.report || '暂无报告内容'}</pre>
            </div>
          </div>

          {/* 问答区域 */}
          <div class="conversation-card">
            <div class="card-header">
              <h3 class="card-title">问答对话</h3>
              <div class="card-subtitle">
                基于此分析报告进行提问，获取更深入的见解
              </div>
            </div>

            {/* 对话历史 */}
            <div class="conversation-history">
              <Show when={conversation()?.messages?.length > 0} fallback={
                <div class="empty-conversation">
                  <div class="empty-icon">💬</div>
                  <div class="empty-text">暂无对话记录</div>
                  <div class="empty-hint">开始提问以获取更多分析见解</div>
                </div>
              }>
                <div class="messages-list">
                  <For each={conversation().messages}>
                    {(message) => (
                      <div class={`message message-${message.role}`}>
                        <div class="message-role">
                          {message.role === 'user' ? '您' : 'AI助手'}
                        </div>
                        <div class="message-content">{message.content}</div>
                        <div class="message-time">
                          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* 提问输入框 */}
            <div class="question-input">
              <textarea
                value={question()}
                onInput={(e) => setQuestion(e.target.value)}
                placeholder="输入您的问题，例如：这个分析报告中的关键支撑位是什么？"
                rows="3"
                disabled={asking()}
                class="question-textarea"
              />
              <div class="question-actions">
                <div class="question-hint">
                  按 Enter 发送，Shift+Enter 换行
                </div>
                <button
                  onClick={handleAskQuestion}
                  disabled={!question().trim() || asking()}
                  class="btn btn-primary"
                >
                  <Show when={asking()} fallback="发送">
                    <span class="loading-spinner-small"></span>
                    发送中...
                  </Show>
                </button>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div class="action-buttons">
            <button class="btn btn-outline">重新分析</button>
            <button class="btn btn-outline">分享报告</button>
            <button class="btn btn-danger">删除记录</button>
          </div>
        </div>
      </Show>

      <style>{`
        .analysis-detail-page {
          padding-bottom: var(--space-2xl);
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: var(--space-lg);
        }

        .loading-spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-icon {
          font-size: 3rem;
          color: var(--color-error);
        }

        .error-message {
          color: var(--color-error);
          text-align: center;
          max-width: 400px;
        }

        .analysis-detail {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-lg);
          padding: var(--space-lg);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .analysis-basic-info {
          flex: 1;
        }

        .analysis-pair {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .pair-symbol {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .pair-timeframe,
        .pair-platform {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          background: var(--color-surface-light);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
        }

        .analysis-price-time {
          display: flex;
          align-items: baseline;
          gap: var(--space-lg);
        }

        .analysis-price {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .analysis-time {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .analysis-rating {
          font-size: 1.25rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          background: var(--color-surface-light);
        }

        .rating-success {
          color: var(--color-success);
          background: rgba(16, 185, 129, 0.1);
        }

        .rating-error {
          color: var(--color-error);
          background: rgba(239, 68, 68, 0.1);
        }

        .rating-muted {
          color: var(--color-text-secondary);
        }

        .summary-card,
        .report-card,
        .conversation-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-lg);
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .card-subtitle {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          margin-top: var(--space-xs);
        }

        .card-actions {
          display: flex;
          gap: var(--space-sm);
        }

        .btn-sm {
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
        }

        .summary-text {
          line-height: 1.6;
          color: var(--color-text-secondary);
        }

        .report-content {
          max-height: 400px;
          overflow-y: auto;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-lg);
        }

        .report-text {
          margin: 0;
          white-space: pre-wrap;
          font-family: var(--font-mono);
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--color-text);
        }

        .conversation-history {
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: var(--space-lg);
          padding: var(--space-md);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .empty-conversation {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          gap: var(--space-md);
          color: var(--color-text-secondary);
        }

        .empty-icon {
          font-size: 2rem;
        }

        .empty-text {
          font-weight: 500;
        }

        .empty-hint {
          font-size: 0.875rem;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .message {
          padding: var(--space-md);
          border-radius: var(--radius-md);
          max-width: 80%;
        }

        .message-user {
          align-self: flex-end;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .message-assistant {
          align-self: flex-start;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
        }

        .message-system {
          align-self: center;
          background: rgba(107, 114, 128, 0.1);
          border: 1px solid rgba(107, 114, 128, 0.2);
          max-width: 90%;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .message-role {
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
          color: var(--color-text-secondary);
        }

        .message-content {
          line-height: 1.5;
          margin-bottom: var(--space-xs);
        }

        .message-time {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-align: right;
        }

        .question-input {
          border-top: 1px solid var(--color-border);
          padding-top: var(--space-lg);
        }

        .question-textarea {
          width: 100%;
          padding: var(--space-md);
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: 0.875rem;
          resize: vertical;
          margin-bottom: var(--space-md);
        }

        .question-textarea:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .question-textarea:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .question-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .question-hint {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
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

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: var(--space-md);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--color-border);
        }

        @media (max-width: 768px) {
          .analysis-header {
            flex-direction: column;
            align-items: stretch;
          }

          .analysis-rating {
            align-self: flex-start;
          }

          .card-header {
            flex-direction: column;
            gap: var(--space-md);
          }

          .card-actions {
            align-self: flex-start;
          }

          .message {
            max-width: 90%;
          }

          .question-actions {
            flex-direction: column;
            gap: var(--space-md);
            align-items: stretch;
          }

          .question-hint {
            text-align: center;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default AnalysisDetailPage