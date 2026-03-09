"""
用户认证路由
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import models
import schemas
import auth
from database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=schemas.SuccessResponse)
async def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """用户注册"""
    # 检查邮箱是否已存在
    existing_user = db.query(models.User).filter(
        models.User.email == user_data.email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )

    # 创建新用户
    hashed_password = auth.get_password_hash(user_data.password)
    db_user = models.User(
        email=user_data.email,
        password_hash=hashed_password,
        username=user_data.username or user_data.email.split("@")[0],
        plan_type="free",
        quota_total=5,
        quota_used=0,
        settings={}
    )

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="注册失败，请重试"
        )

    return schemas.SuccessResponse(
        message="注册成功",
        data={"user_id": db_user.id}
    )


@router.post("/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """用户登录（OAuth2兼容）"""
    user = auth.authenticate_user(
        db, form_data.username, form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 更新最后登录时间
    from datetime import datetime
    user.last_login_at = datetime.utcnow()
    db.commit()

    # 创建访问令牌
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return schemas.Token(
        access_token=access_token,
        expires_in=access_token_expires.total_seconds()
    )


@router.post("/login-json", response_model=schemas.Token)
async def login_json(
    login_data: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    """用户登录（JSON格式）"""
    user = auth.authenticate_user(
        db, login_data.email, login_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 更新最后登录时间
    from datetime import datetime
    user.last_login_at = datetime.utcnow()
    db.commit()

    # 创建访问令牌
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return schemas.Token(
        access_token=access_token,
        expires_in=access_token_expires.total_seconds()
    )


@router.get("/me", response_model=schemas.UserInDB)
async def get_current_user_info(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """获取当前用户信息"""
    # 计算剩余配额
    from auth import check_user_quota
    _, remaining = check_user_quota(current_user)

    # 转换为响应模型
    user_data = schemas.UserInDB.from_orm(current_user)
    user_data.quota_remaining = remaining
    return user_data


@router.put("/me", response_model=schemas.UserInDB)
async def update_current_user(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新当前用户信息"""
    # 更新字段
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    # 计算剩余配额
    from auth import check_user_quota
    _, remaining = check_user_quota(current_user)

    user_data = schemas.UserInDB.from_orm(current_user)
    user_data.quota_remaining = remaining
    return user_data