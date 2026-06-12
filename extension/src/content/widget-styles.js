/**
 * Candlebot 浮动组件样式（通过 Shadow DOM 注入）
 * 使用 CSS-in-JS 方式导出，避免与宿主页面样式冲突
 */
;(function() {
window.__CB_WIDGET_STYLES = `
  /* ===== CSS Variables ===== */
  :host {
    --cb-primary: #667eea;
    --cb-primary-dark: #5a67d8;
    --cb-secondary: #764ba2;
    --cb-success: #10b981;
    --cb-warning: #f59e0b;
    --cb-danger: #ef4444;
    --cb-bg: #1a1b2e;
    --cb-surface: #232544;
    --cb-surface-hover: #2a2d52;
    --cb-border: #2e3158;
    --cb-text: #e2e8f0;
    --cb-text-secondary: #94a3b8;
    --cb-text-muted: #64748b;
    --cb-radius: 8px;
    --cb-radius-lg: 16px;
    --cb-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    --cb-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --cb-z-fab: 2147483647;
    --cb-z-panel: 2147483646;
    --cb-width: 400px;
    --cb-height: 600px;
  }

  /* ===== Reset ===== */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ===== Floating Action Button ===== */
  .cb-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cb-primary), var(--cb-secondary));
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: var(--cb-z-fab);
    color: white;
    font-size: 24px;
    user-select: none;
  }

  .cb-fab:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 24px rgba(102, 126, 234, 0.6);
  }

  .cb-fab:active {
    transform: scale(0.95);
  }

  .cb-fab.cb-fab--inactive {
    opacity: 0.5;
    cursor: default;
    background: var(--cb-border);
    box-shadow: none;
  }

  .cb-fab.cb-fab--inactive:hover {
    transform: none;
    box-shadow: none;
  }

  .cb-fab.cb-fab--open {
    transform: rotate(45deg);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  }

  .cb-fab.cb-fab--open:hover {
    transform: rotate(45deg) scale(1.1);
  }

  .cb-fab__icon {
    font-size: 24px;
    line-height: 1;
  }

  /* ===== Status Dot on FAB ===== */
  .cb-fab__dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--cb-success);
    border: 2px solid var(--cb-bg);
  }

  .cb-fab__dot.cb-fab__dot--inactive {
    background: var(--cb-text-muted);
  }

  /* ===== Chat Panel ===== */
  .cb-panel {
    position: fixed;
    bottom: 96px;
    right: 24px;
    width: var(--cb-width);
    height: var(--cb-height);
    max-height: calc(100vh - 120px);
    background: var(--cb-bg);
    border: 1px solid var(--cb-border);
    border-radius: var(--cb-radius-lg);
    box-shadow: var(--cb-shadow);
    display: flex;
    flex-direction: column;
    z-index: var(--cb-z-panel);
    overflow: hidden;
    animation: cb-slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: var(--cb-font);
    color: var(--cb-text);
  }

  @keyframes cb-slideIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes cb-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ===== Panel Header ===== */
  .cb-panel__header {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    background: var(--cb-surface);
    border-bottom: 1px solid var(--cb-border);
    cursor: move;
    user-select: none;
    flex-shrink: 0;
  }

  .cb-panel__logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--cb-primary), var(--cb-secondary));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    margin-right: 10px;
    flex-shrink: 0;
  }

  .cb-panel__title {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: var(--cb-text);
    line-height: 1.3;
  }

  .cb-panel__subtitle {
    font-size: 11px;
    color: var(--cb-text-muted);
    font-weight: 400;
  }

  .cb-panel__actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .cb-panel__btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--cb-border);
    background: transparent;
    color: var(--cb-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    transition: all 0.2s;
    line-height: 1;
  }

  .cb-panel__btn:hover {
    background: var(--cb-surface-hover);
    color: var(--cb-text);
    border-color: var(--cb-primary);
  }

  /* ===== Messages Area ===== */
  .cb-panel__messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-behavior: smooth;
  }

  .cb-panel__messages::-webkit-scrollbar {
    width: 4px;
  }

  .cb-panel__messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .cb-panel__messages::-webkit-scrollbar-thumb {
    background: var(--cb-border);
    border-radius: 2px;
  }

  .cb-panel__messages::-webkit-scrollbar-thumb:hover {
    background: var(--cb-text-muted);
  }

  /* ===== Message Bubbles ===== */
  .cb-msg {
    display: flex;
    flex-direction: column;
    max-width: 92%;
    animation: cb-fadeIn 0.3s ease;
  }

  .cb-msg--assistant {
    align-self: flex-start;
  }

  .cb-msg--user {
    align-self: flex-end;
  }

  .cb-msg--system {
    align-self: center;
    max-width: 100%;
  }

  .cb-msg--error {
    align-self: center;
  }

  .cb-msg__bubble {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .cb-msg--assistant .cb-msg__bubble {
    background: var(--cb-surface);
    border: 1px solid var(--cb-border);
    border-bottom-left-radius: 4px;
    color: var(--cb-text);
  }

  .cb-msg--user .cb-msg__bubble {
    background: linear-gradient(135deg, var(--cb-primary), var(--cb-secondary));
    border-bottom-right-radius: 4px;
    color: white;
  }

  .cb-msg--system .cb-msg__bubble {
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.2);
    text-align: center;
    font-size: 12px;
    color: var(--cb-text-secondary);
    padding: 8px 12px;
  }

  .cb-msg--error .cb-msg__bubble {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: var(--cb-danger);
    font-size: 12px;
    text-align: center;
  }

  .cb-msg__time {
    font-size: 10px;
    color: var(--cb-text-muted);
    margin-top: 4px;
    padding: 0 4px;
  }

  .cb-msg--user .cb-msg__time {
    text-align: right;
  }

  .cb-msg--assistant .cb-msg__time {
    text-align: left;
  }

  /* ===== Rich Content in Messages ===== */
  .cb-msg__bubble strong {
    color: var(--cb-primary);
  }

  .cb-msg__bubble .cb-kv {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .cb-msg__bubble .cb-kv:last-child {
    border-bottom: none;
  }

  .cb-msg__bubble .cb-kv__key {
    color: var(--cb-text-secondary);
  }

  .cb-msg__bubble .cb-kv__value {
    font-weight: 600;
    font-family: 'SF Mono', Monaco, 'Cascadia Mono', monospace;
  }

  .cb-msg__bubble .cb-rating {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 12px;
  }

  .cb-msg__bubble .cb-rating--bullish { background: rgba(16, 185, 129, 0.2); color: #34d399; }
  .cb-msg__bubble .cb-rating--bearish { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  .cb-msg__bubble .cb-rating--neutral { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

  .cb-msg__bubble .cb-section {
    margin: 8px 0;
    padding: 8px 10px;
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    border-left: 3px solid var(--cb-primary);
  }

  .cb-msg__bubble .cb-section__title {
    font-size: 12px;
    font-weight: 600;
    color: var(--cb-primary);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ===== Loading State ===== */
  .cb-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px 20px;
    text-align: center;
  }

  .cb-loading__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--cb-border);
    border-top-color: var(--cb-primary);
    border-radius: 50%;
    animation: cb-spin 0.8s linear infinite;
  }

  @keyframes cb-spin {
    to { transform: rotate(360deg); }
  }

  .cb-loading__text {
    font-size: 14px;
    color: var(--cb-text-secondary);
  }

  .cb-loading__sub {
    font-size: 12px;
    color: var(--cb-text-muted);
  }

  /* ===== Progress Steps ===== */
  .cb-progress {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 280px;
  }

  .cb-progress__step {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--cb-text-muted);
    transition: all 0.3s;
  }

  .cb-progress__step.cb-progress__step--active {
    color: var(--cb-text);
  }

  .cb-progress__step.cb-progress__step--done {
    color: var(--cb-success);
  }

  .cb-progress__icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    flex-shrink: 0;
    border: 1px solid currentColor;
  }

  .cb-progress__step--done .cb-progress__icon {
    background: var(--cb-success);
    border-color: var(--cb-success);
    color: white;
  }

  .cb-progress__step--active .cb-progress__icon {
    border-color: var(--cb-primary);
    animation: cb-pulse 1.5s infinite;
  }

  @keyframes cb-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
    50% { box-shadow: 0 0 0 4px rgba(102, 126, 234, 0); }
  }

  /* ===== Input Area ===== */
  .cb-panel__input {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 12px 16px;
    background: var(--cb-surface);
    border-top: 1px solid var(--cb-border);
    flex-shrink: 0;
  }

  .cb-panel__textarea {
    flex: 1;
    min-height: 36px;
    max-height: 120px;
    padding: 8px 12px;
    background: var(--cb-bg);
    border: 1px solid var(--cb-border);
    border-radius: 8px;
    color: var(--cb-text);
    font-size: 13px;
    font-family: var(--cb-font);
    resize: none;
    outline: none;
    transition: border-color 0.2s;
    line-height: 1.5;
  }

  .cb-panel__textarea:focus {
    border-color: var(--cb-primary);
  }

  .cb-panel__textarea::placeholder {
    color: var(--cb-text-muted);
  }

  .cb-panel__textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cb-panel__send {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, var(--cb-primary), var(--cb-secondary));
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .cb-panel__send:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  }

  .cb-panel__send:active {
    transform: scale(0.95);
  }

  .cb-panel__send:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ===== Minimized State ===== */
  .cb-panel.cb-panel--minimized {
    height: auto;
    min-height: 0;
  }

  .cb-panel.cb-panel--minimized .cb-panel__messages,
  .cb-panel.cb-panel--minimized .cb-panel__input {
    display: none;
  }

  /* ===== Empty State ===== */
  .cb-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    text-align: center;
    height: 100%;
  }

  .cb-empty__icon {
    font-size: 48px;
    opacity: 0.5;
  }

  .cb-empty__text {
    font-size: 14px;
    color: var(--cb-text-secondary);
    max-width: 240px;
  }

  .cb-empty__btn {
    margin-top: 8px;
    padding: 10px 24px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, var(--cb-primary), var(--cb-secondary));
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cb-empty__btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  /* ===== Error State ===== */
  .cb-error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    text-align: center;
  }

  .cb-error-state__icon {
    font-size: 40px;
  }

  .cb-error-state__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--cb-danger);
  }

  .cb-error-state__desc {
    font-size: 13px;
    color: var(--cb-text-secondary);
    max-width: 280px;
  }

  .cb-error-state__btn {
    margin-top: 8px;
    padding: 8px 20px;
    border-radius: 8px;
    border: 1px solid var(--cb-border);
    background: var(--cb-surface);
    color: var(--cb-text);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cb-error-state__btn:hover {
    background: var(--cb-surface-hover);
  }

  /* ===== Resize Handle ===== */
  .cb-panel__resize {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    opacity: 0.5;
  }

  .cb-panel__resize::after {
    content: '';
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--cb-text-muted);
    border-bottom: 2px solid var(--cb-text-muted);
  }

  /* ===== Tooltip ===== */
  .cb-tooltip {
    position: fixed;
    bottom: 90px;
    right: 24px;
    background: var(--cb-surface);
    border: 1px solid var(--cb-border);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--cb-text-secondary);
    white-space: nowrap;
    z-index: calc(var(--cb-z-fab) - 1);
    animation: cb-fadeIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }

  /* ===== Markdown-like formatting ===== */
  .cb-msg__bubble code {
    background: rgba(255,255,255,0.05);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 12px;
    font-family: 'SF Mono', Monaco, monospace;
  }

  .cb-msg__bubble ul, .cb-msg__bubble ol {
    padding-left: 18px;
    margin: 4px 0;
  }

  .cb-msg__bubble li {
    margin: 2px 0;
  }

  .cb-msg__bubble h4 {
    font-size: 14px;
    margin: 8px 0 4px;
    color: var(--cb-primary);
  }

  /* ===== Responsive ===== */
  @media (max-width: 480px) {
    .cb-panel {
      right: 8px;
      bottom: 80px;
      width: calc(100vw - 16px);
      height: calc(100vh - 100px);
      max-height: calc(100vh - 100px);
      border-radius: 12px;
    }

    .cb-fab {
      bottom: 16px;
      right: 16px;
      width: 48px;
      height: 48px;
    }

    .cb-tooltip {
      right: 16px;
      bottom: 76px;
    }
  }
`;
})();
