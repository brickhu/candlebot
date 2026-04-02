"""
用户认证和JWT管理
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db

# 安全配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")  # 从环境变量读取
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天

# 密码哈希上下文
# 使用pbkdf2_sha256，简单可靠，没有bcrypt的72字节限制
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
    pbkdf2_sha256__default_rounds=30000  # 默认轮数
)

# OAuth2方案
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    # 使用pbkdf2_sha256，没有bcrypt的72字节限制
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    # 使用pbkdf2_sha256，没有bcrypt的72字节限制
    return pwd_context.hash(password)


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    """用户认证"""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建JWT访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception

        # 将字符串转换为整数
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")
    return current_user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """获取当前用户（可选）

    如果没有提供token或token无效，返回None
    """
    if not token:
        return None

    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None


def check_user_quota(user: models.User) -> tuple[bool, int]:
    """检查用户配额
    返回：(是否允许, 剩余次数)

    注意：这个函数只计算剩余配额，不修改用户对象。
    修改用户对象的逻辑应该在调用者处处理。
    """
    # 计算剩余配额
    remaining = user.quota_total - user.quota_used
    return remaining > 0, remaining


def reset_user_quota_if_needed(db: Session, user: models.User) -> None:
    """如果需要，重置用户配额"""
    today = datetime.utcnow().date()

    # 如果quota_reset_date为None，设置为明天
    if user.quota_reset_date is None:
        user.quota_reset_date = datetime.utcnow() + timedelta(days=1)
        db.commit()
    elif user.quota_reset_date.date() < today:
        # 重置配额
        user.quota_used = 0
        user.quota_reset_date = datetime.utcnow() + timedelta(days=1)
        db.commit()


def increment_user_quota(db: Session, user: models.User) -> int:
    """增加用户已使用配额
    返回：使用后的剩余次数
    """
    # 确保配额已重置
    reset_user_quota_if_needed(db, user)

    user.quota_used += 1
    db.commit()
    db.refresh(user)

    return user.quota_total - user.quota_used


def check_and_increment_quota(db: Session, user: models.User) -> tuple[bool, int]:
    """检查并更新配额（所有图片上传都消耗配额）

    参数:
        db: 数据库会话
        user: 用户对象

    返回:
        tuple[是否允许, 剩余次数]

    说明:
        - 所有图片上传都消耗配额，无论图片是否有效
        - 先检查配额，如果不足则不允许上传
    """
    # 确保配额已重置
    reset_user_quota_if_needed(db, user)

    # 检查配额
    allowed, remaining = check_user_quota(user)

    if not allowed:
        print(f"❌ 用户 {user.id} 配额不足，剩余: {remaining}")
        return False, remaining

    # 增加已使用配额（所有图片都扣减）
    user.quota_used += 1
    db.commit()
    db.refresh(user)

    new_remaining = user.quota_total - user.quota_used
    print(f"✅ 用户 {user.id} 配额已扣减，剩余: {new_remaining}")

    return True, new_remaining