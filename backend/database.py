"""
数据库配置和连接管理
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# 数据库连接URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./candlebot.db"  # 默认使用SQLite
)

# 创建数据库引擎
engine = create_engine(DATABASE_URL)

# 创建SessionLocal类
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建Base类
Base = declarative_base()

# 依赖注入：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()