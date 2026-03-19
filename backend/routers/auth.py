"""
用户认证路由
"""
from datetime import timedelta, datetime
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
    print(f"注册请求: email={user_data.email}, username={user_data.username}")

    try:
        # 检查邮箱是否已存在
        existing_user = db.query(models.User).filter(
            models.User.email == user_data.email
        ).first()
        if existing_user:
            print(f"邮箱已存在: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )

        # 创建新用户
        print("生成密码哈希...")
        hashed_password = auth.get_password_hash(user_data.password)
        print(f"密码哈希生成完成: {hashed_password[:20]}...")

        quota_reset_date = datetime.utcnow() + timedelta(days=1)
        print(f"设置配额重置日期: {quota_reset_date}")

        db_user = models.User(
            email=user_data.email,
            password_hash=hashed_password,
            username=user_data.username or user_data.email.split("@")[0],
            plan_type="free",
            quota_total=5,
            quota_used=0,
            quota_reset_date=quota_reset_date,
            settings={},
            # 显式设置OAuth字段为None
            provider=None,
            provider_id=None,
            oauth_metadata=None
        )

        print(f"创建用户对象: {db_user.email}")

        try:
            print("添加用户到数据库...")
            db.add(db_user)
            print("提交事务...")
            db.commit()
            print("刷新用户对象...")
            db.refresh(db_user)
            print(f"用户创建成功: ID={db_user.id}")
        except IntegrityError as e:
            db.rollback()
            print(f"数据库完整性错误: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="注册失败，请重试"
            )
        except Exception as e:
            db.rollback()
            print(f"数据库错误: {type(e).__name__}: {e}")
            import traceback
            print(f"数据库错误详情:\n{traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"数据库错误: {str(e)}"
            )

        return schemas.SuccessResponse(
            message="注册成功",
            data={"user_id": db_user.id}
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"注册过程中发生未知错误:\n{error_details}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注册过程中发生未知错误"
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
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取当前用户信息"""
    try:
        print(f"🔍 获取用户信息: user_id={current_user.id}, email={current_user.email}")

        # 确保配额已重置（如果需要）
        from auth import reset_user_quota_if_needed, check_user_quota
        reset_user_quota_if_needed(db, current_user)

        # 计算剩余配额
        _, remaining = check_user_quota(current_user)
        print(f"📊 用户剩余配额: {remaining}")

        # 刷新用户对象以确保获取最新数据
        db.refresh(current_user)

        # 手动创建UserInDB实例，因为quota_remaining是计算字段
        print("🔄 创建UserInDB实例...")
        user_data = schemas.UserInDB(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            plan_type=current_user.plan_type,
            quota_total=current_user.quota_total,
            quota_used=current_user.quota_used,
            quota_remaining=remaining,  # 计算字段
            settings=current_user.settings or {},
            created_at=current_user.created_at,
            last_login_at=current_user.last_login_at,
            is_active=current_user.is_active
        )
        print(f"✅ 创建成功: id={user_data.id}, email={user_data.email}")

        return user_data
    except Exception as e:
        print(f"❌ /auth/me 端点错误: {type(e).__name__}: {e}")
        import traceback
        print(f"❌ 错误详情:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


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