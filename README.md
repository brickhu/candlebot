# Candlebot · K线专家

> AI读懂K线图表，一键生成做多做空分析报告
> Chrome 扩展 · 支持 aggr.trade & TradingView

---

## 项目结构

```
candlebot/
├── backend/                  # FastAPI 后端（Railway 部署）
│   ├── main.py               # API 主文件
│   ├── requirements.txt
│   └── railway.toml
├── extension/                # Chrome 扩展
│   ├── src/
│   │   ├── popup/            # 主界面（Solid.js + Tailwind）
│   │   │   ├── Popup.jsx     # 核心组件 ← 填入 API_BASE
│   │   │   ├── index.jsx
│   │   │   ├── index.html
│   │   │   └── index.css
│   │   ├── background/
│   │   │   └── index.js      # Service Worker
│   │   └── content/
│   │       └── index.js      # 页面注入脚本
│   ├── public/icons/         # 扩展图标（需自行添加）
│   ├── manifest.json
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── .gitignore
```

---

## 快速开始

### 1. 部署后端（Railway）

```bash
# 推送 backend/ 到 GitHub 后在 Railway 连接
# 添加环境变量：
DEEPSEEK_API_KEY=你的DeepSeek API Key
```

Railway 部署完成后，复制生成的 URL（如 `https://candlebot-api.railway.app`）

### 2. 配置扩展

打开 `extension/src/popup/Popup.jsx`，第 5 行替换：

```js
const API_BASE = 'https://你的railway地址.railway.app'
```

### 3. 构建扩展

```bash
cd extension
npm install
npm run build
```

### 4. 加载到 Chrome

1. 打开 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension/dist/` 目录

---

## 图标文件

需要在 `extension/public/icons/` 放置以下文件：

```
icon16.png    (16x16  · 激活状态)
icon48.png    (48x48  · 激活状态)
icon128.png   (128x128 · 激活状态)
icon16_off.png    (16x16  · 非激活)
icon48_off.png    (48x48  · 非激活)
icon128_off.png   (128x128 · 非激活)
```

---

## 使用流程

1. 打开 aggr.trade 或 TradingView
2. 扩展图标自动**变亮**
3. 点击图标 → 点击「开始分析」
4. 等待 15~30 秒
5. 查看报告，支持中/英文切换
6. 点击「分享」复制分享文字

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key |

---

## 免费限制

默认每个 IP 每天 **5 次**免费分析，修改 `backend/main.py` 中的 `DAILY_FREE_LIMIT`。
