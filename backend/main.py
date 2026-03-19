"""
Candlebot Backend — FastAPI
支持用户系统的AI K线分析API
"""
import os
import re
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
import httpx
from sqlalchemy.orm import Session

# 导入自定义模块
from database import engine, get_db
import models
import schemas
import auth
from routers import auth as auth_router, analysis as analysis_router, conversation as conversation_router, oauth as oauth_router

# 创建数据库表
models.Base.metadata.create_all(bind=engine)

# 创建FastAPI应用
app = FastAPI(
    title="Candlebot API",
    description="AI驱动的K线图表分析API，支持用户系统和历史记录",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(auth_router.router)
app.include_router(analysis_router.router)
app.include_router(conversation_router.router)
app.include_router(oauth_router.router)

# 环境变量配置
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
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"
MINIMAX_URL = "https://api.minimaxi.com/v1/chat/completions"
MINIMAX_MODEL = "MiniMax-Text-01"

# 提示词配置（保持不变）
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


@app.get("/")
async def root():
    """API根端点"""
    return {
        "name": "Candlebot API",
        "version": "2.0.0",
        "description": "AI驱动的K线图表分析API",
        "docs": "/docs",
        "endpoints": {
            "auth": "/auth",
            "analysis": "/analysis",
            "conversation": "/conversation"
        }
    }


@app.get("/health")
async def health():
    """健康检查端点"""
    return {
        "status": "ok",
        "provider": MODEL_PROVIDER,
        "model": MINIMAX_MODEL if MODEL_PROVIDER == "minimax" else DEEPSEEK_MODEL,
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/debug/db-test")
async def debug_db_test(db: Session = Depends(get_db)):
    """调试端点：测试数据库连接和表结构"""
    try:
        # 测试查询
        user_count = db.query(models.User).count()

        # 测试表结构
        from sqlalchemy import inspect
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()

        # 检查users表结构
        users_columns = []
        if 'users' in tables:
            users_columns = inspector.get_columns('users')

        return {
            "status": "ok",
            "user_count": user_count,
            "tables": tables,
            "users_columns": [
                {
                    "name": col['name'],
                    "type": str(col['type']),
                    "nullable": col.get('nullable', True),
                    "default": col.get('default')
                }
                for col in users_columns
            ]
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"数据库调试错误:\n{error_details}")
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }


@app.post("/debug/test-register")
async def debug_test_register(
    email: str = "debug@example.com",
    password: str = "debug123",
    db: Session = Depends(get_db)
):
    """调试端点：简单测试用户注册"""
    try:
        print(f"调试注册: email={email}")

        # 检查邮箱是否已存在
        existing_user = db.query(models.User).filter(
            models.User.email == email
        ).first()
        if existing_user:
            return {"status": "error", "message": "邮箱已存在"}

        # 简单创建用户，不使用auth模块
        from datetime import datetime, timedelta
        db_user = models.User(
            email=email,
            password_hash="debug_hash",  # 简单哈希
            username=email.split("@")[0],
            plan_type="free",
            quota_total=5,
            quota_used=0,
            quota_reset_date=datetime.utcnow() + timedelta(days=1),
            settings={},
            provider=None,
            provider_id=None,
            oauth_metadata=None
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return {
            "status": "success",
            "message": "用户创建成功",
            "user_id": db_user.id
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"调试注册错误:\n{error_details}")
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": error_details
        }


@app.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze(
    req: schemas.AnalyzeRequest,
    request: Request,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """分析K线图表（需要用户认证）"""
    # 检查用户配额
    allowed, remaining = auth.check_user_quota(current_user)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "daily_limit_exceeded",
                "message": f"今日免费次数已用完（{current_user.quota_total}次/天），请明日再试",
                "message_en": f"Daily free limit reached ({current_user.quota_total}/day). Try again tomorrow."
            }
        )

    platform = req.platform if req.platform in PROMPTS else "tradingview"
    lang_note = "请用中文输出报告。" if req.lang == "zh" else "Please output the report in English."
    system_prompt = PROMPTS[platform] + OUTPUT_FORMAT + f"\n\n{lang_note}"

    # 调用AI API
    if MODEL_PROVIDER == "minimax":
        api_url = MINIMAX_URL
        api_key = MINIMAX_API_KEY
        model = MINIMAX_MODEL

        # MiniMax 官方视觉格式
        payload = {
            "model": model,
            "max_tokens": 3000,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"[Image base64:{req.image_base64}]\n请分析这张图表截图，严格按照格式输出完整报告，末尾必须包含METADATA块。"
                }
            ]
        }

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

            # OpenAI 兼容格式解析
            raw = resp.json()["choices"][0]["message"]["content"]
            print(f"🤖 AI原始响应 (前500字符): {raw[:500]}...")
            print(f"🤖 AI原始响应长度: {len(raw)} 字符")

        # 解析元数据
        meta = {}
        for key in ["RATING", "RATING_SCORE", "SUMMARY", "PAIR", "PRICE", "TIMEFRAME"]:
            m = re.search(rf"{key}:(.+?)(?:\n|$)", raw)
            value = m.group(1).strip() if m else ""

            # 特殊处理rating_score，需要转换为整数
            if key == "RATING_SCORE":
                try:
                    meta[key.lower()] = int(value) if value else 0
                except ValueError:
                    print(f"⚠️ rating_score转换失败: '{value}'，使用默认值0")
                    meta[key.lower()] = 0
            # 确保price是字符串
            elif key == "PRICE":
                meta[key.lower()] = str(value) if value else "0"
            else:
                meta[key.lower()] = value

        # 清理报告内容
        clean = re.sub(r"\n*---\s*\nMETADATA.*$", "", raw, flags=re.DOTALL).strip()

        print(f"📊 解析的元数据: {meta}")
        print(f"📊 原始报告内容长度: {len(raw)} 字符")
        print(f"📊 清理后报告内容长度: {len(clean)} 字符")

        # 创建AnalysisMetadata实例
        try:
            analysis_metadata = schemas.AnalysisMetadata(**meta)
            print(f"✅ 成功创建AnalysisMetadata: {analysis_metadata}")
        except Exception as e:
            print(f"❌ 创建AnalysisMetadata失败: {e}")
            print(f"❌ meta字典内容: {meta}")
            # 创建默认的AnalysisMetadata
            analysis_metadata = schemas.AnalysisMetadata()
            print(f"✅ 使用默认AnalysisMetadata: {analysis_metadata}")

        # 计算图片哈希
        image_hash = hashlib.sha256(req.image_base64.encode()).hexdigest()

        # 保存分析记录到数据库
        db_record = models.AnalysisRecord(
            user_id=current_user.id,
            platform=platform,
            image_hash=image_hash,
            image_data=req.image_base64,  # 可选：保存图片数据
            report_data={
                "report": clean,
                "raw": raw,
                "lang": req.lang
            },
            analysis_metadata=meta
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)

        # 增加用户配额使用
        auth.increment_user_quota(db, current_user)

        # 重新计算剩余次数
        _, new_remaining = auth.check_user_quota(current_user)

        return schemas.AnalyzeResponse(
            report=clean,
            analysis_metadata=analysis_metadata,
            remaining_today=new_remaining,
            platform=platform,
            record_id=db_record.id
        )

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


@app.post("/ask", response_model=schemas.AskResponse)
async def ask_question(
    ask_data: schemas.AskRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """提问关于分析报告的问题"""
    # 这个端点现在由conversation路由器处理
    # 这里保持向后兼容，重定向到新的端点
    from routers.conversation import ask_question as conversation_ask

    return await conversation_ask(
        analysis_id=ask_data.analysis_id,
        ask_data=ask_data,
        current_user=current_user,
        db=db
    )


# 中间件：记录API访问日志
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.utcnow()

    response = await call_next(request)

    process_time = (datetime.utcnow() - start_time).total_seconds() * 1000

    # 可以在这里记录到数据库
    # 暂时只打印日志
    print(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.2f}ms")

    return response