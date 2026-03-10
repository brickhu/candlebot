export const translations = {
  zh: {
    nav: {
      features: '功能特性',
      howItWorks: '使用方式',
      faq: '常见问题',
      install: '立即安装',
    },
    hero: {
      badge: 'Chrome 扩展 · 免费使用',
      title: '让 AI 读懂\n你的K线',
      subtitle: '在 aggr.trade 和 TradingView 上，一键截图分析，获得做多做空建议与三场景概率预测',
      cta: '免费安装扩展',
      ctaSub: 'Chrome Web Store · 永久免费',
      support: '支持平台',
    },
    features: {
      title: '专为交易者设计',
      subtitle: '不是泛用AI，而是专注K线图的视觉分析助手',
      items: [
        {
          icon: '📸',
          title: '一键截图分析',
          desc: '点击扩展图标，自动截取当前图表页面，无需手动截图上传',
        },
        {
          icon: '🤖',
          title: 'AI视觉解读',
          desc: '由 Minimax 视觉大模型驱动，识别K线形态、CVD、Delta、成交量等技术指标',
        },
        {
          icon: '🎯',
          title: '三场景概率预测',
          desc: '输出多头/空头/震荡三个场景的概率，以及每个场景的目标价位和触发条件',
        },
        {
          icon: '⚡',
          title: '评级标签',
          desc: '从🔴做空良机到🟢做多良机，快速判断当前行情强度与方向',
        },
        {
          icon: '🌐',
          title: '中英双语',
          desc: '报告支持中文/英文切换，面向全球交易者',
        },
        {
          icon: '📤',
          title: '一键分享',
          desc: '复制格式化的分享文字，方便发到社群或记录交易日志',
        },
      ],
    },
    howItWorks: {
      title: '三步完成分析',
      steps: [
        {
          num: '01',
          title: '打开图表',
          desc: '访问 aggr.trade 或 TradingView，扩展图标自动变亮',
        },
        {
          num: '02',
          title: '点击分析',
          desc: '点击 Candlebot 图标，AI 自动截图并开始分析，等待 15~30 秒',
        },
        {
          num: '03',
          title: '查看报告',
          desc: '获得技术指标解读、三场景概率预测和评级建议',
        },
      ],
    },
    faq: {
      title: '常见问题',
      items: [
        {
          q: '每天可以分析几次？',
          a: '免费用户每天可分析 5 次，次日 UTC 00:00 重置。后续会推出更高配额的付费计划。',
        },
        {
          q: '支持哪些图表平台？',
          a: '目前支持 aggr.trade 和 TradingView。在其他网页上扩展图标会显示为灰色状态。',
        },
        {
          q: 'AI 分析准确吗？',
          a: 'Candlebot 提供技术面辅助参考，不构成投资建议。AI 基于图表视觉信号分析，准确性受图表质量和市场环境影响，请结合自身判断使用。',
        },
        {
          q: '我的截图数据会被保存吗？',
          a: '截图仅在分析请求期间传输到服务器进行处理，不会被持久化存储。',
        },
        {
          q: '扩展是免费的吗？',
          a: '是的，核心分析功能完全免费，有每日次数限制。未来可能推出无限制的付费版本。',
        },
        {
          q: '在哪里可以获得支持或反馈？',
          a: '可以通过 GitHub Issues 提交问题或功能建议，我们会尽快回复。',
        },
      ],
    },
    install: {
      title: '开始使用 Candlebot',
      subtitle: '免费安装，30秒上手，让AI成为你的交易副驾驶',
      cta: '前往 Chrome Web Store 安装',
      note: '需要 Chrome 浏览器 · 完全免费',
    },
    footer: {
      tagline: 'AI 读图，帮你看清市场',
      links: ['GitHub', 'Chrome Web Store', '反馈问题'],
      disclaimer: 'Candlebot 仅提供技术分析参考，不构成投资建议。加密货币交易有风险，请谨慎决策。',
      copyright: '© 2025 Candlebot · The Watcher',
    },
  },

  en: {
    nav: {
      features: 'Features',
      howItWorks: 'How It Works',
      faq: 'FAQ',
      install: 'Install Free',
    },
    hero: {
      badge: 'Chrome Extension · Free to Use',
      title: 'Let AI Read\nYour Charts',
      subtitle: 'One-click screenshot analysis on aggr.trade and TradingView. Get long/short signals and three-scenario probability forecasts.',
      cta: 'Install Free Extension',
      ctaSub: 'Chrome Web Store · Always Free',
      support: 'Supported Platforms',
    },
    features: {
      title: 'Built for Traders',
      subtitle: 'Not a generic AI — a visual analysis assistant focused on candlestick charts',
      items: [
        {
          icon: '📸',
          title: 'One-Click Screenshot',
          desc: 'Click the extension icon to automatically capture your current chart — no manual upload needed',
        },
        {
          icon: '🤖',
          title: 'AI Visual Analysis',
          desc: 'Powered by Minimax vision model, recognizing candlestick patterns, CVD, Delta, volume and more',
        },
        {
          icon: '🎯',
          title: 'Three-Scenario Forecast',
          desc: 'Get probability estimates for bullish/bearish/sideways scenarios with target prices and trigger conditions',
        },
        {
          icon: '⚡',
          title: 'Rating Label',
          desc: 'From 🔴 Strong Short to 🟢 Strong Long — instantly gauge market direction and strength',
        },
        {
          icon: '🌐',
          title: 'Bilingual Reports',
          desc: 'Reports available in Chinese and English for traders worldwide',
        },
        {
          icon: '📤',
          title: 'Share Instantly',
          desc: 'Copy formatted analysis text to share in communities or log your trading journal',
        },
      ],
    },
    howItWorks: {
      title: 'Three Steps to Analysis',
      steps: [
        {
          num: '01',
          title: 'Open a Chart',
          desc: 'Visit aggr.trade or TradingView — the extension icon lights up automatically',
        },
        {
          num: '02',
          title: 'Click Analyze',
          desc: 'Click the Candlebot icon. AI auto-captures and analyzes your chart in 15–30 seconds',
        },
        {
          num: '03',
          title: 'Read the Report',
          desc: 'Get indicator breakdowns, probability forecasts across three scenarios, and a rating',
        },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        {
          q: 'How many analyses per day?',
          a: 'Free users get 5 analyses per day, resetting at UTC 00:00. Higher quota paid plans are coming soon.',
        },
        {
          q: 'Which chart platforms are supported?',
          a: 'Currently aggr.trade and TradingView. On other pages, the extension icon appears grayed out.',
        },
        {
          q: 'How accurate is the AI analysis?',
          a: 'Candlebot provides technical analysis as a reference tool, not investment advice. Accuracy depends on chart quality and market conditions — always combine with your own judgment.',
        },
        {
          q: 'Is my screenshot data stored?',
          a: 'Screenshots are only transmitted to the server during analysis processing and are not persistently stored.',
        },
        {
          q: 'Is it free?',
          a: 'Yes, core analysis features are completely free with a daily usage limit. An unlimited paid tier may come later.',
        },
        {
          q: 'Where can I get support or give feedback?',
          a: 'Submit issues or feature requests via GitHub Issues — we respond as quickly as we can.',
        },
      ],
    },
    install: {
      title: 'Start Using Candlebot',
      subtitle: 'Free install, ready in 30 seconds — let AI become your trading co-pilot',
      cta: 'Install on Chrome Web Store',
      note: 'Requires Chrome browser · Completely free',
    },
    footer: {
      tagline: 'AI reads the chart so you can read the market',
      links: ['GitHub', 'Chrome Web Store', 'Report an Issue'],
      disclaimer: 'Candlebot provides technical analysis for reference only and does not constitute investment advice. Crypto trading involves risk — trade responsibly.',
      copyright: '© 2025 Candlebot · The Watcher',
    },
  },
}

export function detectLang() {
  // 1. 首先检查本地存储中是否有用户选择的语言
  const savedLang = localStorage.getItem('candlebot-lang')
  if (savedLang === 'zh' || savedLang === 'en') {
    return savedLang
  }

  // 2. 如果没有保存的语言，检测浏览器语言
  let browserLang = 'en'
  if (typeof navigator !== 'undefined') {
    const languages = navigator.languages || [navigator.language]
    for (const lang of languages) {
      if (lang && lang.toLowerCase().startsWith('zh')) {
        browserLang = 'zh'
        break
      }
    }
  }

  return browserLang
}

export function saveLang(lang) {
  if (typeof localStorage !== 'undefined' && (lang === 'zh' || lang === 'en')) {
    localStorage.setItem('candlebot-lang', lang)
  }
}