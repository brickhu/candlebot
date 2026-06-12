// src/content.js
(async function() {
  const KEY = "CANDLE_SNAP_DATA";
  
  // 检查 URL 参数
  const urlParams = new URLSearchParams(window.location.search);
  const isFromExtension = urlParams.get('source') === 'extension';

  if (!isFromExtension) {
    console.log("🕯️ [Extension] 检测到非插件跳转请求，静默退出。");
    return; // 关键：没有标识就不执行后续握手逻辑
  }

  console.log("🕯️ [Extension] 检测到插件专用标识，准备提取数据...");

  window.addEventListener("message", async (event) => {
    if (event.source === window && event.data.type === "CANDLE_PAGE_READY") {
      const result = await chrome.storage.local.get(KEY);
      if (result[KEY]) {
        window.dispatchEvent(new CustomEvent("CANDLE_DATA_READY", {
          detail: result[KEY]
        }));
        await chrome.storage.local.remove(KEY);
        console.log("✅ [Extension] 截图数据已安全投递。");
      }
    }
  });
})();