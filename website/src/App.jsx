import { createSignal, createMemo, For, Show, onMount } from 'solid-js'
import { translations, detectLang, saveLang } from './i18n/translations'

// ─── Candlebot SVG Logo ───────────────────────────────────────────────────────
function CandlebotLogo({ size = 40, dark = true }) {
  const bg = dark ? '#0B1F17' : '#F5F0E8'
  const greenColor = '#7EC8A4'
  const goldColor = '#D4A86A'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill={bg} rx="12" />
      {/* Left candle */}
      <rect x="18" y="30" width="20" height="24" fill={greenColor} />
      <rect x="26" y="18" width="4" height="12" fill={greenColor} />
      <rect x="26" y="54" width="4" height="12" fill={greenColor} />
      {/* Center candle (gold - bearish) */}
      <rect x="40" y="42" width="20" height="30" fill={goldColor} />
      <rect x="48" y="28" width="4" height="14" fill={goldColor} />
      <rect x="48" y="72" width="4" height="10" fill={goldColor} />
      {/* Right candle */}
      <rect x="62" y="32" width="20" height="22" fill={greenColor} />
      <rect x="70" y="20" width="4" height="12" fill={greenColor} />
      <rect x="70" y="54" width="4" height="10" fill={greenColor} />
    </svg>
  )
}

// ─── Animated candlestick illustration ───────────────────────────────────────
function HeroCandleChart() {
  const candles = [
    { x: 40,  open: 160, close: 100, high: 80,  low: 180, bull: true  },
    { x: 100, open: 110, close: 150, high: 90,  low: 170, bull: false },
    { x: 160, open: 140, close: 80,  high: 60,  low: 165, bull: true  },
    { x: 220, open: 90,  close: 130, high: 70,  low: 155, bull: false },
    { x: 280, open: 120, close: 60,  high: 40,  low: 140, bull: true  },
    { x: 340, open: 70,  close: 110, high: 50,  low: 130, bull: false },
  ]
  return (
    <svg viewBox="0 0 400 220" class="w-full h-full" style="filter: drop-shadow(0 0 20px rgba(126,200,164,0.15))">
      {/* Grid lines */}
      {[60, 100, 140, 180].map(y => (
        <line x1="0" y1={y} x2="400" y2={y} stroke="#2A5240" stroke-width="0.5" stroke-dasharray="4,6" />
      ))}
      {/* Candles */}
      {candles.map((c, i) => {
        const color = c.bull ? '#7EC8A4' : '#D4A86A'
        const bodyTop = Math.min(c.open, c.close)
        const bodyH = Math.abs(c.close - c.open)
        const delay = i * 0.1
        return (
          <g style={`animation: fadeUp 0.6s ease ${delay}s both`}>
            {/* Wick */}
            <line x1={c.x + 20} y1={c.high} x2={c.x + 20} y2={c.low} stroke={color} stroke-width="2" />
            {/* Body */}
            <rect x={c.x} y={bodyTop} width="40" height={bodyH} fill={color} opacity="0.9" rx="2" />
          </g>
        )
      })}
      {/* AI scan line */}
      <rect x="0" y="0" width="400" height="3" fill="url(#scanGrad)" style="animation: scan 8s linear infinite" opacity="0.6" />
      <defs>
        <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="transparent" />
          <stop offset="50%" stop-color="#7EC8A4" stop-opacity="0.8" />
          <stop offset="100%" stop-color="transparent" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Report Preview mock ──────────────────────────────────────────────────────
function ReportPreview({ lang }) {
  const zh = lang === 'zh'
  return (
    <div class="bg-surface border border-border rounded-xl p-5 font-mono text-xs leading-relaxed shadow-2xl"
         style="box-shadow: 0 0 40px rgba(126,200,164,0.08)">
      <div class="flex items-center justify-between mb-3">
        <span class="text-green font-bold">BTCUSDT · 15m · $67,420</span>
        <span class="text-muted text-[10px]">Candlebot</span>
      </div>
      <div class="border-t border-border pt-3 mb-3">
        <div class="text-muted mb-2">{zh ? '技术面信号' : 'Technical Signals'}</div>
        <div class="space-y-1">
          {[
            [zh ? 'K线形态' : 'Pattern',   zh ? '看涨吞没' : 'Bullish Engulf',   '🟢'],
            ['CVD',                          zh ? '持续流入' : 'Steady Inflow',    '🟢'],
            ['Delta',                        '+2,341 (3根)',                        '🟢'],
            [zh ? '成交量' : 'Volume',       zh ? '放量上涨' : 'Volume Spike',    '🟢'],
            ['VWAP',                         zh ? '价格上方' : 'Above VWAP',       '🟢'],
          ].map(([k, v, s]) => (
            <div class="flex justify-between">
              <span class="text-muted">{k}</span>
              <span class="text-text">{v} {s}</span>
            </div>
          ))}
        </div>
      </div>
      <div class="border-t border-border pt-3 mb-3">
        <div class="text-muted mb-2">{zh ? '概率预测' : 'Probability'}</div>
        <div class="space-y-1.5">
          {[
            ['65%', zh ? '突破 $68,200' : 'Break $68,200', '#7EC8A4'],
            ['25%', zh ? '回测 $66,500' : 'Retest $66,500', '#D4A86A'],
            ['10%', zh ? '横盘震荡' : 'Sideways', '#7A9E8A'],
          ].map(([pct, label, color]) => (
            <div>
              <div class="flex justify-between mb-0.5">
                <span style={`color: ${color}`}>{pct}</span>
                <span class="text-text text-[11px]">{label}</span>
              </div>
              <div class="h-1 bg-bg-2 rounded-full overflow-hidden">
                <div class="h-full rounded-full" style={`width: ${pct}; background: ${color}; opacity: 0.7`} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div class="border-t border-border pt-3">
        <span class="text-green font-bold">🟢🟢🟢 {zh ? '做多良机' : 'Strong Long Signal'}</span>
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ lang, setLang, t }) {
  const [scrolled, setScrolled] = createSignal(false)
  onMount(() => {
    window.addEventListener('scroll', () => setScrolled(window.scrollY > 40), { passive: true })
  })
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <nav class={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled() ? 'bg-bg/95 backdrop-blur border-b border-border' : ''}`}>
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <CandlebotLogo size={32} dark={true} />
          <span class="font-mono font-bold text-green tracking-widest text-sm uppercase">Candlebot</span>
        </div>
        <div class="hidden md:flex items-center gap-8">
          {[['features', 'features'], ['how-it-works', 'howItWorks'], ['faq', 'faq']].map(([id, key]) => (
            <button
              onClick={() => scrollTo(id)}
              class="text-muted hover:text-text transition-colors text-sm font-body"
            >
              {t.nav[key]}
            </button>
          ))}
        </div>
        <div class="flex items-center gap-3">
          {/* Lang toggle */}
          <div class="flex bg-surface border border-border rounded-lg overflow-hidden text-xs font-mono">
            <button
              onClick={() => setLang('zh')}
              class={`px-3 py-1.5 transition-colors ${lang() === 'zh' ? 'bg-green text-bg font-bold' : 'text-muted hover:text-text'}`}
            >中</button>
            <button
              onClick={() => setLang('en')}
              class={`px-3 py-1.5 transition-colors ${lang() === 'en' ? 'bg-green text-bg font-bold' : 'text-muted hover:text-text'}`}
            >EN</button>
          </div>
          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            class="hidden md:flex items-center gap-2 bg-green text-bg font-mono font-bold text-xs px-4 py-2 rounded-lg hover:bg-green-2 transition-colors"
          >
            {t.nav.install} →
          </a>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ lang, t }) {
  return (
    <section class="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
      {/* Background grid */}
      <div class="absolute inset-0 pointer-events-none"
           style="background-image: linear-gradient(rgba(42,82,64,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(42,82,64,0.15) 1px, transparent 1px); background-size: 60px 60px;" />
      {/* Glow orb */}
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
           style="background: radial-gradient(circle, rgba(126,200,164,0.08) 0%, transparent 70%); animation: glowPulse 4s ease-in-out infinite" />

      <div class="relative z-10 max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left copy */}
        <div style="animation: fadeUp 0.8s ease 0.1s both">
          <div class="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 mb-8">
            <span class="w-2 h-2 rounded-full bg-green inline-block" style="animation: glowPulse 2s ease-in-out infinite" />
            <span class="font-mono text-xs text-green">{t.hero.badge}</span>
          </div>

          <h1 class="font-display text-5xl lg:text-6xl xl:text-7xl text-text leading-tight mb-6">
            {t.hero.title.split('\n').map((line, i) => (
              <span>
                {i === 1 ? <span class="text-green">{line}</span> : line}
                {i === 0 ? <br /> : null}
              </span>
            ))}
          </h1>

          <p class="font-body text-muted text-lg leading-relaxed mb-10 max-w-lg">
            {t.hero.subtitle}
          </p>

          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <a
              href="https://chromewebstore.google.com"
              target="_blank"
              class="group flex items-center gap-3 bg-green text-bg font-mono font-bold px-8 py-4 rounded-xl hover:bg-green-2 transition-all hover:scale-105 shadow-lg"
              style="box-shadow: 0 0 30px rgba(126,200,164,0.2)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="4" fill="currentColor"/>
                <path d="M12 8V2M8.46 9.77L4.22 5.64M15.54 9.77L19.78 5.64" stroke="currentColor" stroke-width="2"/>
              </svg>
              {t.hero.cta}
            </a>
            <span class="text-muted text-sm font-mono self-center">{t.hero.ctaSub}</span>
          </div>

          <div class="mt-10">
            <span class="text-muted text-xs font-mono uppercase tracking-widest">{t.hero.support}</span>
            <div class="flex gap-3 mt-3">
              {['aggr.trade', 'TradingView'].map(p => (
                <div class="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-green" />
                  <span class="font-mono text-xs text-text">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right visual */}
        <div style="animation: fadeUp 0.8s ease 0.3s both" class="relative">
          <div class="relative">
            {/* Chart */}
            <div class="bg-bg-2 border border-border rounded-2xl p-4 mb-4 overflow-hidden"
                 style="box-shadow: 0 0 60px rgba(0,0,0,0.5)">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2.5 h-2.5 rounded-full bg-border" />
                <div class="w-2.5 h-2.5 rounded-full bg-border" />
                <div class="w-2.5 h-2.5 rounded-full bg-border" />
                <span class="font-mono text-muted text-xs ml-2">aggr.trade · BTCUSDT</span>
              </div>
              <HeroCandleChart />
            </div>
            {/* Report overlay */}
            <div style="animation: fadeUp 0.8s ease 0.7s both">
              <ReportPreview lang={lang()} />
            </div>
            {/* Floating badge */}
            <div class="absolute -top-3 -right-3 bg-green text-bg font-mono font-bold text-xs px-3 py-1.5 rounded-lg shadow-lg"
                 style="animation: candleFloat 3s ease-in-out infinite">
              AI ✓
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <div class="w-px h-12 bg-gradient-to-b from-transparent to-green" style="animation: fadeIn 2s ease 1.5s both" />
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features({ t }) {
  return (
    <section id="features" class="py-28 relative">
      <div class="absolute inset-0 pointer-events-none"
           style="background: linear-gradient(to bottom, transparent, rgba(26,61,43,0.15), transparent)" />
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="font-display text-4xl lg:text-5xl text-text mb-4">{t.features.title}</h2>
          <p class="font-body text-muted text-lg max-w-xl mx-auto">{t.features.subtitle}</p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={t.features.items}>
            {(item, i) => (
              <div
                class="group bg-bg-2 border border-border rounded-2xl p-6 hover:border-green/40 transition-all duration-300 hover:bg-surface"
                style={`animation: fadeUp 0.6s ease ${i() * 0.08}s both`}
              >
                <div class="text-3xl mb-4">{item.icon}</div>
                <h3 class="font-mono font-bold text-text mb-2">{item.title}</h3>
                <p class="font-body text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks({ t }) {
  return (
    <section id="how-it-works" class="py-28">
      <div class="max-w-5xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="font-display text-4xl lg:text-5xl text-text">{t.howItWorks.title}</h2>
        </div>
        <div class="relative">
          {/* Connector line */}
          <div class="hidden lg:block absolute top-12 left-0 right-0 h-px"
               style="background: linear-gradient(to right, transparent, #2A5240 20%, #2A5240 80%, transparent)" />
          <div class="grid lg:grid-cols-3 gap-8">
            <For each={t.howItWorks.steps}>
              {(step, i) => (
                <div class="relative text-center" style={`animation: fadeUp 0.6s ease ${i() * 0.15}s both`}>
                  <div class="relative z-10 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full border border-border bg-bg-2" />
                    <div class="absolute inset-0 rounded-full"
                         style={`background: radial-gradient(circle, rgba(126,200,164,${0.05 + i() * 0.03}) 0%, transparent 70%)`} />
                    <span class="relative font-mono font-bold text-2xl text-green">{step.num}</span>
                  </div>
                  <h3 class="font-mono font-bold text-text text-lg mb-3">{step.title}</h3>
                  <p class="font-body text-muted text-sm leading-relaxed">{step.desc}</p>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ({ t }) {
  const [open, setOpen] = createSignal(null)
  const toggle = (i) => setOpen(prev => prev === i ? null : i)
  return (
    <section id="faq" class="py-28 relative">
      <div class="absolute inset-0 pointer-events-none"
           style="background: linear-gradient(to bottom, transparent, rgba(26,61,43,0.15), transparent)" />
      <div class="max-w-3xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="font-display text-4xl lg:text-5xl text-text">{t.faq.title}</h2>
        </div>
        <div class="space-y-3">
          <For each={t.faq.items}>
            {(item, i) => (
              <div class="border border-border rounded-xl overflow-hidden bg-bg-2 hover:border-green/30 transition-colors">
                <button
                  class="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => toggle(i())}
                >
                  <span class="font-mono font-bold text-text text-sm pr-4">{item.q}</span>
                  <span class={`text-green flex-shrink-0 transition-transform duration-300 font-mono text-lg ${open() === i() ? 'rotate-45' : ''}`}>+</span>
                </button>
                <Show when={open() === i()}>
                  <div class="px-6 pb-5">
                    <div class="border-t border-border pt-4">
                      <p class="font-body text-muted text-sm leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}

// ─── Install CTA ──────────────────────────────────────────────────────────────
function InstallCTA({ t }) {
  return (
    <section id="install" class="py-28">
      <div class="max-w-4xl mx-auto px-6">
        <div class="relative rounded-3xl overflow-hidden border border-border p-12 text-center"
             style="background: linear-gradient(135deg, #0F2A1E 0%, #142F22 50%, #1A3D2B 100%)">
          {/* Decorative glows */}
          <div class="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
               style="background: radial-gradient(circle, rgba(126,200,164,0.06) 0%, transparent 70%)" />
          <div class="absolute -bottom-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
               style="background: radial-gradient(circle, rgba(212,168,106,0.06) 0%, transparent 70%)" />

          {/* Big logo */}
          <div class="flex justify-center mb-8" style="animation: candleFloat 3s ease-in-out infinite">
            <CandlebotLogo size={72} dark={true} />
          </div>

          <h2 class="font-display text-4xl lg:text-5xl text-text mb-4">{t.install.title}</h2>
          <p class="font-body text-muted text-lg mb-10 max-w-xl mx-auto">{t.install.subtitle}</p>

          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            class="inline-flex items-center gap-3 bg-green text-bg font-mono font-bold px-10 py-5 rounded-xl text-lg hover:bg-green-2 transition-all hover:scale-105 shadow-xl"
            style="box-shadow: 0 0 40px rgba(126,200,164,0.25)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
              <path d="M12 8V2M8.46 9.77L4.22 5.64M15.54 9.77L19.78 5.64" stroke="currentColor" stroke-width="2"/>
            </svg>
            {t.install.cta}
          </a>
          <p class="mt-4 font-mono text-muted text-xs">{t.install.note}</p>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ t }) {
  return (
    <footer class="border-t border-border py-12">
      <div class="max-w-6xl mx-auto px-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          <div class="flex items-center gap-3">
            <CandlebotLogo size={28} dark={true} />
            <div>
              <div class="font-mono font-bold text-green text-sm tracking-widest">CANDLEBOT</div>
              <div class="font-body text-muted text-xs mt-0.5">{t.footer.tagline}</div>
            </div>
          </div>
          <div class="flex items-center gap-6">
            {[
              { label: t.footer.links[0], href: 'https://github.com' },
              { label: t.footer.links[1], href: 'https://chromewebstore.google.com' },
              { label: t.footer.links[2], href: 'https://github.com' },
            ].map(link => (
              <a href={link.href} target="_blank"
                 class="font-body text-muted hover:text-green transition-colors text-sm">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div class="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="font-body text-muted text-xs text-center md:text-left max-w-lg leading-relaxed">
            {t.footer.disclaimer}
          </p>
          <span class="font-mono text-muted text-xs flex-shrink-0">{t.footer.copyright}</span>
        </div>
      </div>
    </footer>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = createSignal(detectLang())
  const t = createMemo(() => translations[lang()])

  // 包装setLang函数，保存用户选择
  const setLangAndSave = (newLang) => {
    if (newLang === 'zh' || newLang === 'en') {
      setLang(newLang)
      saveLang(newLang)
    }
  }

  return (
    <div class="min-h-screen bg-bg text-text font-body">
      <Nav lang={lang} setLang={setLangAndSave} t={t()} />
      <Hero lang={lang} t={t()} />
      <Features t={t()} />
      <HowItWorks t={t()} />
      <FAQ t={t()} />
      <InstallCTA t={t()} />
      <Footer t={t()} />
    </div>
  )
}