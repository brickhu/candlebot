"""
数据模型定义
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    username = Column(String(100))
    avatar_url = Column(Text)
    plan_type = Column(String(50), default="free")
    quota_total = Column(Integer, default=5)  # 总配额
    quota_used = Column(Integer, default=0)   # 已使用配额
    quota_reset_date = Column(DateTime)       # 配额重置日期
    settings = Column(JSON, default=dict)     # 用户设置
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)

    # 关系
    analyses = relationship("AnalysisRecord", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("PaymentRecord", back_populates="user", cascade="all, delete-orphan")


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)  # aggr/tradingview
    image_hash = Column(String(64))  # 图片哈希（去重）
    image_data = Column(Text)        # base64编码的图片（可选存储）
    report_data = Column(JSON, nullable=False)  # 完整的报告数据
    metadata = Column(JSON, nullable=False)     # 元数据：rating, pair, price等
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    user = relationship("User", back_populates="analyses")
    conversations = relationship("Conversation", back_populates="analysis", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(Integer, ForeignKey("analysis_records.id", ondelete="CASCADE"), nullable=False)
    messages = Column(JSON, nullable=False)  # 对话消息数组
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 关系
    user = relationship("User", back_populates="conversations")
    analysis = relationship("AnalysisRecord", back_populates="conversations")


class PaymentRecord(Base):
    __tablename__ = "payment_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    payment_id = Column(String(255), unique=True, index=True)  # 第三方支付ID
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    plan_type = Column(String(50), nullable=False)
    quota_added = Column(Integer, nullable=False)  # 增加的配额
    status = Column(String(50), default="pending")  # pending/success/failed/refunded
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    # 关系
    user = relationship("User", back_populates="payments")


class APILog(Base):
    __tablename__ = "api_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    endpoint = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer)
    response_time_ms = Column(Integer)
    ip_address = Column(String(50))
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())