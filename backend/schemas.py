"""
Pydantic数据模式定义
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# 用户相关
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class UserInDB(UserBase):
    id: int
    plan_type: str
    quota_total: int
    quota_used: int
    quota_remaining: int
    settings: Dict[str, Any]
    created_at: datetime
    last_login_at: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True


class UserPublic(UserBase):
    id: int
    username: Optional[str]
    avatar_url: Optional[str]
    plan_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# 令牌相关
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # 过期时间（秒）


class TokenData(BaseModel):
    user_id: Optional[int] = None


# 分析记录相关
class AnalysisMetadata(BaseModel):
    rating: Optional[str] = None
    rating_score: Optional[int] = None
    summary: Optional[str] = None
    pair: Optional[str] = None
    price: Optional[str] = None
    timeframe: Optional[str] = None


class AnalysisRecordBase(BaseModel):
    platform: str
    image_hash: Optional[str] = None
    analysis_metadata: AnalysisMetadata


class AnalysisRecordCreate(AnalysisRecordBase):
    image_data: Optional[str] = None  # base64编码的图片
    report_data: Dict[str, Any]


class AnalysisRecordInDB(AnalysisRecordBase):
    id: int
    user_id: int
    report_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisRecordPublic(AnalysisRecordBase):
    id: int
    user_id: int
    created_at: datetime
    has_image: bool = False

    class Config:
        from_attributes = True


# 对话相关
class Message(BaseModel):
    role: str  # user/assistant
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ConversationBase(BaseModel):
    analysis_id: int
    messages: List[Message]


class ConversationCreate(BaseModel):
    analysis_id: int
    message: str  # 用户的新消息


class ConversationInDB(BaseModel):
    id: int
    user_id: int
    analysis_id: int
    messages: List[Message]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# 支付相关
class PaymentCreate(BaseModel):
    plan_type: str
    amount: float
    currency: str = "USD"


class PaymentInDB(BaseModel):
    id: int
    user_id: int
    payment_id: str
    amount: float
    currency: str
    plan_type: str
    quota_added: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# API请求/响应
class AnalyzeRequest(BaseModel):
    image_base64: str
    platform: str = "tradingview"
    lang: str = "zh"


class AnalyzeResponse(BaseModel):
    report: str
    analysis_metadata: AnalysisMetadata
    remaining_today: int
    platform: str
    record_id: Optional[int] = None  # 新增：分析记录ID


class AskRequest(BaseModel):
    analysis_id: int
    question: str
    lang: str = "zh"


class AskResponse(BaseModel):
    answer: str
    conversation_id: Optional[int] = None


# 通用响应
class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


# 分页和列表
class PaginationParams(BaseModel):
    page: int = 1
    per_page: int = 20
    sort_by: str = "created_at"
    sort_order: str = "desc"  # asc/desc


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int