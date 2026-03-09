"""
Candlebot Backend — FastAPI
Minimax API 中转 + 每日免费次数限制
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json
import os
import re
import time
from collections import defaultdict

app = FastAPI(title="Candlebot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

def load_env_from_file():
    """从.env.local文件加载环境变量（本地开发使用）"""
    env_file = ".env.local"
    env_vars = {}
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()
        except Exception as e:
            print(f"读取.env.local文件失败: {e}")
    return env_vars

env_from_file = load_env_from_file()

MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", env_from_file.get("MODEL_PROVIDER", "deepseek"))
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", env_from_file.get("DEEPSEEK_API_KEY", ""))
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", env_from_file.get("MINIMAX_API_KEY", ""))

print(f"MODEL_PROVIDER: {MODEL_PROVIDER}")
print(f"MINIMAX_API_KEY长度: {len(MINIMAX_API_KEY) if MINIMAX_API_KEY else 0}")
print(f"DEEPSEEK_API_KEY长度: {len(DEEPSEEK_API_KEY) if DEEPSEEK_API_KEY else 0}")

# API 端点配置
DEEPSEEK_URL   = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

# ✅ 修复1：使用 OpenAI 兼容接口（更稳定，格式统一）
# ✅ 修复2：MiniMax-VL-01 才是支持视觉输入的模型，M系列是纯文本
MINIMAX_URL    = "https://api.minimaxi.com/v1/chat/completions"
MINIMAX_MODEL  = "MiniMax-VL-01"

DAILY_FREE_LIMIT = 5
usage_store: dict = defaultdict(lambda: {"count": 0, "date": ""})


def get_today() -> str:
    return time.strftime("%Y-%m-%d")


def check_and_increment(ip: str):
    today = get_today()
    record = usage_store[ip]
    if record["date"] != today:
        record["count"] = 0
        record["date"] = today
    remaining = DAILY_FREE_LIMIT - record["count"]
    if remaining <= 0:
        return False, 0
    record["count"] += 1
    return True, remaining - 1


# ── 提示词 ──
PROMPT_AGGR = """
你是 Candlebot · K线专家，专门解读 aggr.trade 的行情截图，用小白也能看懂的语言输出分析报告。

从截图识别以下指标：
- 交易对、时间周期、当前价格
- K线形态与趋势（上升/下降/横盘）
- 清算热力图：密集色带 = 清算聚集位
- 清算柱：紫色 = 多头清算，蓝色 = 空头清算
- CVD曲线：上升 = 买方主导，下降 = 卖方主导；注意与价格背离
- Delta柱（绿/红竖柱）：正值绿色 = 买方主动出击，负值红色 = 卖方主动出击；统计连续根数
- 成交量：放量/缩量，与价格配合
- VWAP：价格在其上方/下方
- 1h副图（若存在）：仅K线+成交量，判断大级别趋势
- 右侧REKTS：大额清算记录

信号规则：
- CVD + Delta 同向双重确认时重点标注
- Delta 连续5根以上同向 = 强信号，标注根数
- 1h 与主图共振：概率权重 +10~15%
- 触发条件必须量化（具体价格 + K线确认根数）

总结评级（基于最高概率场景）：
- ≥80%: 🟢🟢🟢做多良机 / 🔴🔴🔴做空良机
- ≥50%: 🟢🟢⚫适度做多 / 🔴🔴⚫适度做空
- ≥40%: 🟢⚫⚫可以做多 / 🔴⚫⚫可以做空
- <40%:  ⚫⚫⚫等待观望
"""

PROMPT_TV = """
你是 Candlebot · K线专家，专门解读 TradingView 的行情截图，用小白也能看懂的语言输出分析报告。

从截图识别以下指标：
- 交易对、时间周期、当前价格
- K线形态（头肩顶底、双顶双底、旗形、楔形、锤子线等）
- 趋势线与通道方向
- 均线系统（MA/EMA）：多空排列、金叉死叉
- 成交量：放量/缩量，量价配合
- RSI/MACD（若可见）：超买超卖、背离信号
- 布林带（若可见）：价格位置、收窄扩张
- 关键支撑阻力位

信号规则：
- 多指标共振 = 强信号
- 成交量必须与价格方向配合
- 触发条件必须量化（具体价格 + K线确认）

总结评级（基于最高概率场景）：
- ≥80%: 🟢🟢🟢做多良机 / 🔴🔴🔴做空良机
- ≥50%: 🟢🟢⚫适度做多 / 🔴🔴⚫适度做空
- ≥40%: 🟢⚫⚫可以做多 / 🔴⚫⚫可以做空
- <40%:  ⚫⚫⚫等待观望
"""

PROMPTS = {"aggr": PROMPT_AGGR, "tradingview": PROMPT_TV}

OUTPUT_FORMAT = """
## 输出格式（严格遵循，Markdown）

{交易对} · {时间周期} · ${价格}

---

## 📊 技术面信号

| 指标 | 当前状态 | 信号 |
|------|---------|------|
| K线形态 | ... | 🔴/⚫/🟢 |
| CVD | ... | 🔴/⚫/🟢 |
| Delta | [数值+连续根数] | 🔴/⚫/🟢 |
| 成交量 | ... | 🔴/⚫/🟢 |
| VWAP | ... | 🔴/⚫/🟢 |
| 关键支撑 | $X,XXX（原因） | — |
| 关键阻力 | $X,XXX（原因） | — |

---

## 🎯 概率预测

**场景A（X%）**：[方向] → 目标 $X,XXX
触发条件：[量化条件]

**场景B（X%）**：[方向] → 目标 $X,XXX
触发条件：[量化条件]

**场景C（X%）**：[方向] → 目标 $X,XXX
触发条件：[量化条件]

---

## 总结

[评级标签]：[100字以内，简洁直接]

---
METADATA
RATING:[评级文字，如🟢🟢🟢做多良机]
RATING_SCORE:[整数，-3到3]
SUMMARY:[总结正文，不含评级标签，100字以内]
PAIR:[交易对，如ETHUSD]
PRICE:[当前价格数字]
TIMEFRAME:[时间周期，如15m]
"""


class AnalyzeRequest(BaseModel):
    image_base64: str
    platform: str = "tradingview"
    lang: str = "zh"


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "provider": MODEL_PROVIDER,
        "model": MINIMAX_MODEL if MODEL_PROVIDER == "minimax" else DEEPSEEK_MODEL
    }


@app.post("/analyze")
async def analyze(req: AnalyzeRequest, request: Request):
    ip = request.client.host
    allowed, remaining = check_and_increment(ip)

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "daily_limit_exceeded",
                "message": "今日免费次数已用完（5次/天），请明日再试",
                "message_en": "Daily free limit reached (5/day). Try again tomorrow."
            }
        )

    platform = req.platform if req.platform in PROMPTS else "tradingview"
    lang_note = "请用中文输出报告。" if req.lang == "zh" else "Please output the report in English."
    system_prompt = PROMPTS[platform] + OUTPUT_FORMAT + f"\n\n{lang_note}"

    if MODEL_PROVIDER == "minimax":
        api_url = MINIMAX_URL
        api_key = MINIMAX_API_KEY
        model = MINIMAX_MODEL

        print(f"使用Minimax提供商: {model}")
        print(f"API Key长度: {len(api_key) if api_key else 0}")
        print(f"image_base64长度: {len(req.image_base64) if req.image_base64 else 0}")

        # ✅ OpenAI 兼容格式，image_url 传 base64 Data URL
        payload = {
            "model": model,
            "max_tokens": 3000,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{req.image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": "请分析这张图表截图，严格按照格式输出完整报告，末尾必须包含METADATA块。"
                        }
                    ]
                }
            ]
        }

        # ✅ OpenAI 兼容接口使用 Bearer token
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    else:
        # DeepSeek (OpenAI兼容格式)
        api_url = DEEPSEEK_URL
        api_key = DEEPSEEK_API_KEY
        model = DEEPSEEK_MODEL

        payload = {
            "model": model,
            "max_tokens": 3000,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{req.image_base64}"}
                        },
                        {
                            "type": "text",
                            "text": "请分析这张图表截图，严格按照格式输出完整报告，末尾必须包含METADATA块。"
                        }
                    ]
                }
            ]
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(api_url, json=payload, headers=headers)

            # 打印原始响应便于调试
            print(f"HTTP状态码: {resp.status_code}")
            try:
                resp_preview = json.dumps(resp.json(), indent=2, ensure_ascii=False)[:800]
                print(f"响应内容预览: {resp_preview}")
            except Exception:
                print(f"响应文本: {resp.text[:500]}")

            resp.raise_for_status()

            # OpenAI 兼容格式解析（Minimax 和 DeepSeek 统一）
            raw = resp.json()["choices"][0]["message"]["content"]

        meta = {}
        for key in ["RATING", "RATING_SCORE", "SUMMARY", "PAIR", "PRICE", "TIMEFRAME"]:
            m = re.search(rf"{key}:(.+?)(?:\n|$)", raw)
            meta[key.lower()] = m.group(1).strip() if m else ""

        clean = re.sub(r"\n*---\s*\nMETADATA.*$", "", raw, flags=re.DOTALL).strip()

        return {
            "report": clean,
            "meta": meta,
            "remaining_today": remaining,
            "platform": platform
        }

    except httpx.HTTPStatusError as e:
        provider_name = "Minimax" if MODEL_PROVIDER == "minimax" else "DeepSeek"
        error_body = e.response.text[:300]
        print(f"{provider_name} API 错误 {e.response.status_code}: {error_body}")
        raise HTTPException(
            status_code=502,
            detail=f"{provider_name} API 错误: {e.response.status_code} - {error_body}"
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"分析失败错误详情:\n{error_details}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")