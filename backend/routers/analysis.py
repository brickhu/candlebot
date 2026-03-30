"""
分析记录路由
"""
import hashlib
import json
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, text

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
    """获取分析历史记录 - 使用原始SQL避免字段不存在的问题"""
    print(f"🔍 获取用户 {current_user.id} 的分析历史")

    try:
        # 使用原始SQL查询，避免字段不存在的问题
        from sqlalchemy import text

        # 构建基础SQL - 检查是否有visibility字段
        # 首先检查表结构
        check_sql = text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'analysis_records'
            AND column_name = 'visibility'
        """)

        has_visibility = False
        try:
            check_result = db.execute(check_sql)
            has_visibility = check_result.fetchone() is not None
            print(f"📊 数据库是否有visibility字段: {has_visibility}")
        except:
            print("⚠️  无法检查表结构，假设没有visibility字段")

        # 根据是否有visibility字段构建SQL
        if has_visibility:
            sql_base = """
                SELECT id, user_id, platform, image_hash, image_data,
                       report_data, analysis_metadata, visibility, created_at
                FROM analysis_records
                WHERE user_id = :user_id
            """
        else:
            sql_base = """
                SELECT id, user_id, platform, image_hash, image_data,
                       report_data, analysis_metadata, created_at
                FROM analysis_records
                WHERE user_id = :user_id
            """

        # 构建计数SQL
        count_sql = """
            SELECT COUNT(*)
            FROM analysis_records
            WHERE user_id = :user_id
        """

        params = {"user_id": current_user.id}

        # 应用筛选
        if platform:
            sql_base += " AND platform = :platform"
            count_sql += " AND platform = :platform"
            params["platform"] = platform

        if pair:
            # 对于PostgreSQL，使用JSON运算符
            sql_base += " AND analysis_metadata->>'pair' = :pair"
            count_sql += " AND analysis_metadata->>'pair' = :pair"
            params["pair"] = pair

        # 应用排序和分页
        sql = sql_base + " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        params["limit"] = per_page
        params["offset"] = (page - 1) * per_page

        # 执行查询
        print(f"📊 执行查询...")

        # 计算总数
        count_result = db.execute(text(count_sql), params)
        total = count_result.scalar()
        print(f"📊 总记录数: {total}")

        # 获取记录
        result = db.execute(text(sql), params)
        rows = result.fetchall()
        print(f"📊 查询到 {len(rows)} 条记录")

        # 转换为响应格式
        items = []
        for i, row in enumerate(rows):
            print(f"  处理记录 {i+1}: ID={row[0]}")
            try:
                # 根据是否有visibility字段确定字段位置
                if has_visibility:
                    # 有visibility字段: id, user_id, platform, image_hash, image_data,
                    # report_data, analysis_metadata, visibility, created_at
                    id_idx, user_id_idx, platform_idx, image_hash_idx, image_data_idx = 0, 1, 2, 3, 4
                    report_data_idx, metadata_idx, visibility_idx, created_at_idx = 5, 6, 7, 8
                    visibility = row[visibility_idx] if row[visibility_idx] is not None else 'private'
                else:
                    # 没有visibility字段: id, user_id, platform, image_hash, image_data,
                    # report_data, analysis_metadata, created_at
                    id_idx, user_id_idx, platform_idx, image_hash_idx, image_data_idx = 0, 1, 2, 3, 4
                    report_data_idx, metadata_idx, created_at_idx = 5, 6, 7
                    visibility = 'private'  # 默认值

                # 解析analysis_metadata
                import json
                metadata_str = row[metadata_idx]
                if isinstance(metadata_str, str):
                    metadata_dict = json.loads(metadata_str) if metadata_str else {}
                else:
                    metadata_dict = metadata_str or {}

                # 创建AnalysisMetadata实例
                analysis_metadata = schemas.AnalysisMetadata(
                    rating=metadata_dict.get('rating'),
                    rating_score=metadata_dict.get('rating_score'),
                    summary=metadata_dict.get('summary'),
                    pair=metadata_dict.get('pair'),
                    price=metadata_dict.get('price'),
                    timeframe=metadata_dict.get('timeframe')
                )

                # 创建AnalysisRecordPublic实例
                item = schemas.AnalysisRecordPublic(
                    id=row[id_idx],
                    user_id=row[user_id_idx],
                    platform=row[platform_idx],
                    image_hash=row[image_hash_idx],
                    analysis_metadata=analysis_metadata,
                    visibility=visibility,
                    created_at=row[created_at_idx],
                    has_image=bool(row[image_data_idx])
                )
                items.append(item)
                print(f"    ✅ 转换成功")
            except Exception as e:
                print(f"    ❌ 转换失败: {type(e).__name__}: {e}")
                continue

        print(f"✅ 成功转换 {len(items)} 条记录")

        # 返回分页响应
        return schemas.PaginatedResponse(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page if per_page > 0 else 0
        )

    except Exception as e:
        print(f"❌ /analysis/history 错误: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise


@router.get("/{record_id}", response_model=Union[schemas.AnalysisRecordInDB, schemas.AnalysisRecordPublic])
async def get_analysis_record(
    record_id: int,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """获取单个分析记录详情

    如果记录是公开的，任何人都可以访问（返回公开信息）
    如果记录是私有的，只有所有者可以访问（返回完整信息）
    """
    # 查询记录 - 使用原始SQL避免字段不存在的问题
    sql = text("""
        SELECT id, user_id, platform, image_hash, image_data,
               report_data, analysis_metadata, visibility, created_at
        FROM analysis_records
        WHERE id = :record_id
    """)
    result = db.execute(sql, {"record_id": record_id})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在"
        )

    # 创建记录对象
    class SimpleAnalysisRecord:
        def __init__(self, row):
            self.id = row[0]
            self.user_id = row[1]
            self.platform = row[2]
            self.image_hash = row[3]
            self.image_data = row[4]
            # 解析JSON字符串为字典
            import json
            self.report_data = json.loads(row[5]) if row[5] else {}
            self.analysis_metadata = json.loads(row[6]) if row[6] else {}
            self.visibility = row[7] if row[7] is not None else 'private'
            self.created_at = row[8]

    record = SimpleAnalysisRecord(row)

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在"
        )

    # 如果是公开记录，任何人都可以访问
    # 注意：如果数据库中没有visibility字段，默认为private
    visibility = getattr(record, 'visibility', 'private')
    if visibility == "public":
        # 返回公开信息（不包含report_data）
        return schemas.AnalysisRecordPublic(
            id=record.id,
            user_id=record.user_id,
            platform=record.platform,
            image_hash=record.image_hash,
            analysis_metadata=record.analysis_metadata,
            visibility=getattr(record, 'visibility', 'private'),
            created_at=record.created_at,
            has_image=bool(record.image_data)
        )

    # 如果是私有记录，需要认证
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="需要认证才能访问私有记录"
        )

    # 检查是否是记录所有者
    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问此记录"
        )

    # 所有者访问，返回完整信息
    return schemas.AnalysisRecordInDB(
        id=record.id,
        user_id=record.user_id,
        platform=record.platform,
        image_hash=record.image_hash,
        analysis_metadata=record.analysis_metadata,
        visibility=getattr(record, 'visibility', 'private'),
        report_data=record.report_data,
        created_at=record.created_at
    )


@router.delete("/{record_id}", response_model=schemas.SuccessResponse)
async def delete_analysis_record(
    record_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除分析记录"""
    # 使用原始SQL查询，避免字段不存在的问题
    sql = text("""
        SELECT id, user_id
        FROM analysis_records
        WHERE id = :record_id AND user_id = :user_id
    """)
    result = db.execute(sql, {"record_id": record_id, "user_id": current_user.id})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在或无权访问"
        )

    # 创建简单的记录对象用于删除
    class SimpleRecord:
        def __init__(self, id, user_id):
            self.id = id
            self.user_id = user_id

    record = SimpleRecord(row[0], row[1])

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在或无权访问"
        )

    # 使用原始SQL删除
    delete_sql = text("DELETE FROM analysis_records WHERE id = :record_id AND user_id = :user_id")
    db.execute(delete_sql, {"record_id": record_id, "user_id": current_user.id})
    db.commit()

    return schemas.SuccessResponse(message="分析记录已删除")


@router.get("/{record_id}/image")
async def get_analysis_image(
    record_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取分析记录的图片（如果存在）"""
    # 使用原始SQL查询，避免字段不存在的问题
    sql = text("""
        SELECT id, user_id, image_data
        FROM analysis_records
        WHERE id = :record_id AND user_id = :user_id
    """)
    result = db.execute(sql, {"record_id": record_id, "user_id": current_user.id})
    row = result.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在或无权访问"
        )

    # 创建简单的记录对象
    class SimpleRecord:
        def __init__(self, id, user_id, image_data):
            self.id = id
            self.user_id = user_id
            self.image_data = image_data

    record = SimpleRecord(row[0], row[1], row[2])

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


@router.put("/{record_id}/visibility", response_model=schemas.SuccessResponse)
async def update_analysis_visibility(
    record_id: int,
    visibility_data: dict,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新分析记录的可见性（private/public）"""
    if "visibility" not in visibility_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="缺少visibility字段"
        )

    visibility = visibility_data["visibility"]
    if visibility not in ["private", "public"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="visibility必须是'private'或'public'"
        )

    # 查询记录
    record = db.query(models.AnalysisRecord).filter(
        models.AnalysisRecord.id == record_id,
        models.AnalysisRecord.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在或无权访问"
        )

    # 更新可见性
    # 检查字段是否存在
    if hasattr(record, 'visibility'):
        record.visibility = visibility
        db.commit()
    else:
        # 如果字段不存在，返回错误
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="数据库缺少visibility字段，请先执行数据库迁移"
        )

    return schemas.SuccessResponse(message=f"记录可见性已更新为'{visibility}'")


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
    # 对于SQLite，使用JSON函数提取pair字段
    top_pairs = db.query(
        func.json_extract(models.AnalysisRecord.analysis_metadata, '$.pair').label("pair"),
        func.count(models.AnalysisRecord.id).label("count")
    ).filter(
        models.AnalysisRecord.user_id == current_user.id,
        func.json_extract(models.AnalysisRecord.analysis_metadata, '$.pair').isnot(None)
    ).group_by(func.json_extract(models.AnalysisRecord.analysis_metadata, '$.pair')) \
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