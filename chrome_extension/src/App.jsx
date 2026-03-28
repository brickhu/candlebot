import { createSignal, onMount } from 'solid-js';

export default function App() {
  const [status, setStatus] = createSignal('checking'); // checking, ready, preview, sending
  const [imgData, setImgData] = createSignal(null);
  const [isAllowed, setIsAllowed] = createSignal(false);

  const TARGET_URL = 'http://localhost:5173/new';

  onMount(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      const allowed = ['aggr.trade', 'tradingview.com'].some(d => url.hostname.includes(d));
      setIsAllowed(allowed);
      setStatus(allowed ? 'ready' : 'invalid');
    }
  });

  const handleCapture = async () => {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 90 });
      setImgData(dataUrl);
      setStatus('preview');
    } catch (e) {
      console.error("Capture failed", e);
    }
  };

  const confirmAndGo = async () => {
    setStatus('sending');
    await chrome.storage.local.set({
      "CANDLE_SNAP_DATA": {
        image: imgData(),
        source: 'CandleBot-Extension',
        timestamp: Date.now()
      }
    });
    chrome.tabs.create({ url: TARGET_URL+"?source=extension" });
    window.close();
  };

  return (
    <div class="w-80 p-5 bg-white shadow-2xl rounded-2xl border border-slate-100 font-sans">
      <header class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-black text-slate-900 tracking-tighter italic">CANDLE<span class="text-blue-600">BOT</span></h1>
        <div class={`h-2.5 w-2.5 rounded-full ${isAllowed() ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
      </header>

      <div class="space-y-4">
        {status() === 'invalid' && (
          <div class="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
            <p class="text-xs text-slate-500">此页面不支持截图。请前往 TradingView 或 aggr.trade</p>
          </div>
        )}

        {status() === 'ready' && (
          <button onClick={handleCapture} class="w-full py-4 bg-slate-950 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all">
            捕获交易图表
          </button>
        )}

        {status() === 'preview' && (
          <div class="animate-in fade-in zoom-in duration-300">
            <img src={imgData()} class="w-full h-40 object-cover rounded-lg border border-slate-200 mb-4" />
            <div class="flex gap-2">
              <button onClick={() => setStatus('ready')} class="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">取消</button>
              <button onClick={confirmAndGo} class="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-lg shadow-blue-100">确认并发送</button>
            </div>
          </div>
        )}

        {status() === 'sending' && (
          <div class="py-10 text-center text-sm font-medium text-slate-500">正在打包并传送...</div>
        )}
      </div>
    </div>
  );
}