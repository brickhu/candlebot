"""
分析记录路由
"""
import hashlib
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

import models
import schemas
import auth
from database import get_db

router = APIRouter(prefix="/analysis", tags=["analysis"])


def calculate_image_hash(image_base64: str) -> str:
    """计算图片哈希值（用于去重）"""
    return hashlib.sha256(image_base64.encode()).hexdigest()


@router.get("/history", response_model=schemas.PaginatedResponse)
async def get_analysis_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    platform: str = Query(None),
    pair: str = Query(None),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取分析历史记录"""
    # 构建查询
    query = db.query(models.AnalysisRecord).filter(
        models.AnalysisRecord.user_id == current_user.id
    )

    # 应用筛选条件
    if platform:
        query = query.filter(models.AnalysisRecord.platform == platform)
    if pair:
        query = query.filter(models.AnalysisRecord.analysis_metadata["pair"].astext == pair)

    # 计算总数
    total = query.count()

    # 应用分页和排序
    items = query.order_by(desc(models.AnalysisRecord.created_at)) \
        .offset((page - 1) * per_page) \
        .limit(per_page) \
        .all()

    # 转换为公共模型
    history_items = []
    for item in items:
        item_data = schemas.AnalysisRecordPublic.from_orm(item)
        item_data.has_image = bool(item.image_data)
        history_items.append(item_data)

    return schemas.PaginatedResponse(
        items=history_items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page
    )


@router.get("/{record_id}", response_model=schemas.AnalysisRecordInDB)
async def get_analysis_record(
    record_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取单个分析记录详情"""
    record = db.query(models.AnalysisRecord).filter(
        models.AnalysisRecord.id == record_id,
        models.AnalysisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在或无权访问"
        )

    return record


@router.delete("/{record_id}", response_model=schemas.SuccessResponse)
async def delete_analysis_record(
    record_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除分析记录"""
    record = db.query(models.AnalysisRecord).filter(
        models.AnalysisRecord.id == record_id,
        models.AnalysisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在或无权访问"
        )

    db.delete(record)
    db.commit()

    return schemas.SuccessResponse(message="分析记录已删除")


@router.get("/{record_id}/image")
async def get_analysis_image(
    record_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取分析记录的图片（如果存在）"""
    record = db.query(models.AnalysisRecord).filter(
        models.AnalysisRecord.id == record_id,
        models.AnalysisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在或无权访问"
        )

    if not record.image_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="该记录没有保存图片"
        )

    # 返回base64编码的图片
    return {"image_data": record.image_data}


@router.get("/stats/summary")
async def get_analysis_stats(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取分析统计摘要"""
    from sqlalchemy import func, extract

    # 总分析次数
    total_analyses = db.query(func.count(models.AnalysisRecord.id)).filter(
        models.AnalysisRecord.user_id == current_user.id
    ).scalar()

    # 按平台统计
    platform_stats = db.query(
        models.AnalysisRecord.platform,
        func.count(models.AnalysisRecord.id).label("count")
    ).filter(
        models.AnalysisRecord.user_id == current_user.id
    ).group_by(models.AnalysisRecord.platform).all()

    # 最近7天分析次数
    from datetime import datetime, timedelta
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    recent_analyses = db.query(
        func.date(models.AnalysisRecord.created_at).label("date"),
        func.count(models.AnalysisRecord.id).label("count")
    ).filter(
        models.AnalysisRecord.user_id == current_user.id,
        models.AnalysisRecord.created_at >= seven_days_ago
    ).group_by(func.date(models.AnalysisRecord.created_at)) \
     .order_by(func.date(models.AnalysisRecord.created_at).desc()) \
     .all()

    # 最常分析的交易对（前5）
    top_pairs = db.query(
        models.AnalysisRecord.analysis_metadata["pair"].astext.label("pair"),
        func.count(models.AnalysisRecord.id).label("count")
    ).filter(
        models.AnalysisRecord.user_id == current_user.id,
        models.AnalysisRecord.analysis_metadata["pair"].isnot(None)
    ).group_by(models.AnalysisRecord.analysis_metadata["pair"].astext) \
     .order_by(func.count(models.AnalysisRecord.id).desc()) \
     .limit(5) \
     .all()

    return {
        "total_analyses": total_analyses or 0,
        "platform_stats": {p: c for p, c in platform_stats},
        "recent_analyses": [
            {"date": str(r.date), "count": r.count}
            for r in recent_analyses
        ],
        "top_pairs": [{"pair": p.pair, "count": p.count} for p in top_pairs],
        "quota_used": current_user.quota_used,
        "quota_total": current_user.quota_total,
        "quota_remaining": current_user.quota_total - current_user.quota_used
    }