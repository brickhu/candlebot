// 设置页面
import { createSignal, createEffect, Show } from 'solid-js'
import { useAuth } from '../contexts/AuthContext'

function SettingsPage() {
  const auth = useAuth()
  const [loading, setLoading] = createSignal(false)
  const [saveSuccess, setSaveSuccess] = createSignal(false)
  const [error, setError] = createSignal('')

  // 表单数据
  const [formData, setFormData] = createSignal({
    username: auth.user.username || '',
    avatar_url: auth.user.avatar_url || '',
    language: auth.user.settings?.language || 'zh',
    theme: auth.user.settings?.theme || 'dark',
    notifications: {
      analysis_complete: auth.user.settings?.notifications?.analysis_complete ?? true,
      quota_reminder: auth.user.settings?.notifications?.quota_reminder ?? true,
      important_updates: auth.user.settings?.notifications?.important_updates ?? true
    },
    privacy: {
      save_images: auth.user.settings?.privacy?.save_images ?? true,
      share_anonymous_data: auth.user.settings?.privacy?.share_anonymous_data ?? false
    }
  })

  // 更新表单字段
  const updateField = (field, value) => {
    setFormData(prev => {
      const keys = field.split('.')
      const newData = { ...prev }

      let current = newData
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] = { ...current[keys[i]] }
      }
      current[keys[keys.length - 1]] = value

      return newData
    })
    setSaveSuccess(false)
  }

  // 处理保存
  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')

      const result = await auth.updateUser({
        username: formData().username,
        avatar_url: formData().avatar_url,
        settings: {
          language: formData().language,
          theme: formData().theme,
          notifications: formData().notifications,
          privacy: formData().privacy
        }
      })

      if (result.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setError(result.error || '保存失败')
      }
    } catch (err) {
      setError(err.message || '保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 重置表单
  const handleReset = () => {
    setFormData({
      username: auth.user.username || '',
      avatar_url: auth.user.avatar_url || '',
      language: auth.user.settings?.language || 'zh',
      theme: auth.user.settings?.theme || 'dark',
      notifications: {
        analysis_complete: auth.user.settings?.notifications?.analysis_complete ?? true,
        quota_reminder: auth.user.settings?.notifications?.quota_reminder ?? true,
        important_updates: auth.user.settings?.notifications?.important_updates ?? true
      },
      privacy: {
        save_images: auth.user.settings?.privacy?.save_images ?? true,
        share_anonymous_data: auth.user.settings?.privacy?.share_anonymous_data ?? false
      }
    })
    setSaveSuccess(false)
    setError('')
  }

  return (
    <div class="settings-page">
      <div class="page-header">
        <h1 class="page-title">设置</h1>
        <p class="page-subtitle">个性化您的 Candlebot 体验</p>
      </div>

      {/* 成功提示 */}
      <Show when={saveSuccess()}>
        <div class="success-alert">
          <span class="success-icon">✅</span>
          <span class="success-text">设置已保存成功</span>
        </div>
      </Show>

      {/* 错误提示 */}
      <Show when={error()}>
        <div class="error-alert">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{error()}</span>
        </div>
      </Show>

      <div class="settings-grid">
        {/* 个人资料设置 */}
        <div class="settings-section">
          <h2 class="section-title">个人资料</h2>
          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input
                type="text"
                value={formData().username}
                onInput={(e) => updateField('username', e.target.value)}
                placeholder="输入用户名"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">头像 URL</label>
              <input
                type="text"
                value={formData().avatar_url}
                onInput={(e) => updateField('avatar_url', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                class="form-input"
              />
              <div class="form-hint">
                支持 Gravatar 或任何图片链接
              </div>
            </div>

            <Show when={formData().avatar_url}>
              <div class="avatar-preview">
                <div class="preview-label">头像预览</div>
                <img
                  src={formData().avatar_url}
                  alt="头像预览"
                  class="preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
                <div class="preview-fallback">
                  {formData().username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </Show>
          </div>
        </div>

        {/* 偏好设置 */}
        <div class="settings-section">
          <h2 class="section-title">偏好设置</h2>
          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">界面语言</label>
              <select
                value={formData().language}
                onChange={(e) => updateField('language', e.target.value)}
                class="form-select"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">主题模式</label>
              <select
                value={formData().theme}
                onChange={(e) => updateField('theme', e.target.value)}
                class="form-select"
              >
                <option value="dark">深色模式</option>
                <option value="light">浅色模式</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
          </div>
        </div>

        {/* 通知设置 */}
        <div class="settings-section">
          <h2 class="section-title">通知设置</h2>
          <div class="settings-form">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData().notifications.analysis_complete}
                  onChange={(e) => updateField('notifications.analysis_complete', e.target.checked)}
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">分析完成通知</span>
              </label>
              <div class="checkbox-description">
                当分析任务完成时发送通知
              </div>
            </div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData().notifications.quota_reminder}
                  onChange={(e) => updateField('notifications.quota_reminder', e.target.checked)}
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">配额提醒</span>
              </label>
              <div class="checkbox-description">
                当日剩余分析次数少于3次时提醒
              </div>
            </div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData().notifications.important_updates}
                  onChange={(e) => updateField('notifications.important_updates', e.target.checked)}
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">重要更新通知</span>
              </label>
              <div class="checkbox-description">
                接收产品更新和新功能通知
              </div>
            </div>
          </div>
        </div>

        {/* 隐私设置 */}
        <div class="settings-section">
          <h2 class="section-title">隐私设置</h2>
          <div class="settings-form">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData().privacy.save_images}
                  onChange={(e) => updateField('privacy.save_images', e.target.checked)}
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">保存分析图片</span>
              </label>
              <div class="checkbox-description">
                在服务器保存分析截图，方便后续查看
              </div>
            </div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData().privacy.share_anonymous_data}
                  onChange={(e) => updateField('privacy.share_anonymous_data', e.target.checked)}
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">分享匿名使用数据</span>
              </label>
              <div class="checkbox-description">
                帮助我们改进产品（不包含个人信息）
              </div>
            </div>
          </div>
        </div>

        {/* 账户信息 */}
        <div class="settings-section">
          <h2 class="section-title">账户信息</h2>
          <div class="account-info">
            <div class="info-item">
              <span class="info-label">邮箱地址</span>
              <span class="info-value">{auth.user.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">账户类型</span>
              <span class="info-value">
                <span class={`plan-badge plan-${auth.user.plan_type}`}>
                  {auth.user.plan_type === 'premium' ? '高级版' : '免费版'}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">注册时间</span>
              <span class="info-value">
                {new Date(auth.user.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">最后登录</span>
              <span class="info-value">
                {auth.user.last_login_at
                  ? new Date(auth.user.last_login_at).toLocaleString('zh-CN')
                  : '从未登录'}
              </span>
            </div>
          </div>
        </div>

        {/* 危险区域 */}
        <div class="settings-section danger-zone">
          <h2 class="section-title">危险区域</h2>
          <div class="danger-actions">
            <button class="btn btn-danger">
              删除所有分析记录
            </button>
            <button class="btn btn-danger" onClick={auth.logout}>
              退出登录
            </button>
            <button class="btn btn-danger">
              删除账户
            </button>
          </div>
          <div class="danger-warning">
            ⚠️ 这些操作不可撤销，请谨慎操作
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div class="action-buttons">
        <button
          class="btn btn-outline"
          onClick={handleReset}
          disabled={loading()}
        >
          重置
        </button>
        <button
          class="btn btn-primary"
          onClick={handleSave}
          disabled={loading()}
        >
          <Show when={loading()} fallback="保存设置">
            <span class="loading-spinner-small"></span>
            保存中...
          </Show>
        </button>
      </div>

      <style>{`
        .settings-page {
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

        .success-alert {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          margin-bottom: var(--space-lg);
          color: var(--color-success);
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          margin-bottom: var(--space-lg);
          color: var(--color-error);
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-xl);
          margin-bottom: var(--space-xl);
        }

        .settings-section {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--space-lg);
          padding-bottom: var(--space-sm);
          border-bottom: 1px solid var(--color-border);
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text);
        }

        .form-input,
        .form-select {
          width: 100%;
        }

        .form-hint {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-top: var(--space-xs);
        }

        .avatar-preview {
          margin-top: var(--space-md);
        }

        .preview-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: var(--space-sm);
          color: var(--color-text-secondary);
        }

        .preview-image {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--color-border);
        }

        .preview-fallback {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--color-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 600;
          border: 2px solid var(--color-border);
          display: none;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          cursor: pointer;
          user-select: none;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-sm);
          position: relative;
          transition: all var(--transition-fast);
        }

        .checkbox-input:checked + .checkbox-custom {
          background: var(--color-accent);
          border-color: var(--color-accent);
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .checkbox-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .checkbox-description {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-left: 26px;
          margin-top: var(--space-xs);
        }

        .account-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--space-sm);
          border-bottom: 1px solid var(--color-border-light);
        }

        .info-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .info-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .info-value {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .plan-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .plan-free {
          background: var(--color-surface-light);
          color: var(--color-text-secondary);
        }

        .plan-premium {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #000;
        }

        .danger-zone {
          border-color: var(--color-error);
        }

        .danger-zone .section-title {
          color: var(--color-error);
          border-bottom-color: rgba(239, 68, 68, 0.3);
        }

        .danger-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }

        .danger-warning {
          font-size: 0.75rem;
          color: var(--color-error);
          text-align: center;
        }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-md);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--color-border);
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
          .settings-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .danger-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default SettingsPage