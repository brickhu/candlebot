"""
对话路由
"""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

import models
import schemas
import auth
from database import get_db

router = APIRouter(prefix="/conversation", tags=["conversation"])


@router.get("/{analysis_id}", response_model=schemas.ConversationInDB)
async def get_conversation(
    analysis_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取或创建对话"""
    # 检查分析记录是否存在且属于当前用户
    analysis = db.query(models.AnalysisRecord).filter(
        models.AnalysisRecord.id == analysis_id,
        models.AnalysisRecord.user_id == current_user.id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在或无权访问"
        )

    # 查找现有对话
    conversation = db.query(models.Conversation).filter(
        models.Conversation.analysis_id == analysis_id,
        models.Conversation.user_id == current_user.id
    ).first()

    # 如果不存在，创建新对话
    if not conversation:
        # 初始消息：包含分析报告的摘要
        initial_messages = [
            schemas.Message(
                role="system",
                content=f"这是关于{analysis.metadata.get('pair', '未知交易对')}的分析报告。用户可以对报告内容进行提问。"
            ).dict()
        ]

        conversation = models.Conversation(
            user_id=current_user.id,
            analysis_id=analysis_id,
            messages=initial_messages
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    return conversation


@router.post("/{analysis_id}/ask", response_model=schemas.AskResponse)
async def ask_question(
    analysis_id: int,
    ask_data: schemas.AskRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """提问并获取回答"""
    # 检查用户配额
    from auth import check_user_quota, increment_user_quota
    allowed, remaining = check_user_quota(current_user)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"配额已用完，剩余{remaining}次"
        )

    # 检查分析记录
    analysis = db.query(models.AnalysisRecord).filter(
        models.AnalysisRecord.id == analysis_id,
        models.AnalysisRecord.user_id == current_user.id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分析记录不存在或无权访问"
        )

    # 获取或创建对话
    conversation = db.query(models.Conversation).filter(
        models.Conversation.analysis_id == analysis_id,
        models.Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        # 创建新对话
        initial_messages = [
            schemas.Message(
                role="system",
                content=f"这是关于{analysis.metadata.get('pair', '未知交易对')}的分析报告。用户可以对报告内容进行提问。"
            ).dict()
        ]
        conversation = models.Conversation(
            user_id=current_user.id,
            analysis_id=analysis_id,
            messages=initial_messages
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 添加用户消息
    user_message = schemas.Message(
        role="user",
        content=ask_data.question
    ).dict()

    messages = conversation.messages
    messages.append(user_message)

    # TODO: 调用AI API获取回答
    # 这里需要集成AI服务来生成回答
    # 暂时返回模拟回答
    ai_response = schemas.Message(
        role="assistant",
        content=f"这是关于您对'{ask_data.question}'的回答（模拟）。实际需要集成AI服务。"
    ).dict()

    messages.append(ai_response)
    conversation.messages = messages
    conversation.updated_at = datetime.utcnow()
    db.commit()

    # 增加用户配额使用
    increment_user_quota(db, current_user)

    return schemas.AskResponse(
        answer=ai_response["content"],
        conversation_id=conversation.id
    )


@router.delete("/{conversation_id}", response_model=schemas.SuccessResponse)
async def delete_conversation(
    conversation_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除对话"""
    conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="对话不存在或无权访问"
        )

    db.delete(conversation)
    db.commit()

    return schemas.SuccessResponse(message="对话已删除")