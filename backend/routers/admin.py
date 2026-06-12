"""
后台管理路由
提供技能系统和配置的管理功能
"""
import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

import models
import auth
from database import get_db
from ai.config.manager import ConfigManager

router = APIRouter(prefix="/admin", tags=["admin"])


# 管理员权限检查
async def check_admin_permission(current_user: models.User = Depends(auth.get_current_active_user)):
    """检查用户是否有管理员权限"""
    # 这里可以根据需要实现更复杂的权限检查
    # 例如：检查用户角色、权限等级等
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要登录"
        )

    # 简单检查：如果用户邮箱包含特定域名或特定用户ID
    # 在实际应用中，应该使用更完善的权限系统
    admin_emails = ["admin@", "administrator@"]
    if not any(email in current_user.email for email in admin_emails):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )

    return current_user








@router.get("/platforms")
async def list_platforms(
    current_user: models.User = Depends(check_admin_permission),
    db: Session = Depends(get_db)
):
    """列出所有平台及其配置"""
    try:
        config_manager = ConfigManager()
        platforms = config_manager.list_platforms()

        platform_details = []
        for platform in platforms:
            try:
                # 获取平台配置
                config = config_manager.get_platform_config(platform)

                # 获取支持的语言
                languages = config_manager.list_supported_languages("platforms", platform)

                # 检查提示词文件
                prompt_files = []
                prompts_dir = config_manager.base_path / "platforms" / platform
                if prompts_dir.exists():
                    for file in prompts_dir.iterdir():
                        if file.suffix == ".md":
                            prompt_files.append({
                                "name": file.name,
                                "size": file.stat().st_size,
                                "modified": file.stat().st_mtime
                            })

                platform_details.append({
                    "name": platform,
                    "config": config.to_dict() if hasattr(config, "to_dict") else config,
                    "languages": languages,
                    "prompt_files": prompt_files,
                    "has_config": (prompts_dir / "config.json").exists()
                })
            except Exception as e:
                platform_details.append({
                    "name": platform,
                    "error": str(e)
                })

        return {
            "status": "ok",
            "platforms": platform_details
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取平台列表失败: {str(e)}"
        )


@router.get("/platforms/{platform_name}")
async def get_platform_details(
    platform_name: str,
    current_user: models.User = Depends(check_admin_permission),
    db: Session = Depends(get_db)
):
    """获取特定平台的详细信息"""
    try:
        config_manager = ConfigManager()

        # 检查平台是否存在
        platforms = config_manager.list_platforms()
        if platform_name not in platforms:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"平台不存在: {platform_name}"
            )

        # 获取平台配置
        config = config_manager.get_platform_config(platform_name)

        # 获取支持的语言
        languages = config_manager.list_supported_languages("platforms", platform_name)

        # 获取提示词内容
        prompts = {}
        for lang in languages:
            try:
                prompt = config_manager.get_platform_prompt(platform_name, lang)
                prompts[lang] = {
                    "content": prompt,
                    "length": len(prompt)
                }
            except Exception as e:
                prompts[lang] = {
                    "error": str(e)
                }

        # 检查配置文件
        config_path = config_manager.base_path / "platforms" / platform_name / "config.json"
        config_exists = config_path.exists()
        config_content = None
        if config_exists:
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config_content = json.load(f)
            except Exception as e:
                config_content = {"error": str(e)}

        return {
            "status": "ok",
            "platform": platform_name,
            "config": config.to_dict() if hasattr(config, "to_dict") else config,
            "languages": languages,
            "prompts": prompts,
            "config_file": {
                "exists": config_exists,
                "path": str(config_path),
                "content": config_content
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取平台详情失败: {str(e)}"
        )


@router.post("/platforms/{platform_name}/reload")
async def reload_platform_config(
    platform_name: str,
    current_user: models.User = Depends(check_admin_permission),
    db: Session = Depends(get_db)
):
    """重新加载平台配置"""
    try:
        config_manager = ConfigManager()

        # 检查平台是否存在
        platforms = config_manager.list_platforms()
        if platform_name not in platforms:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"平台不存在: {platform_name}"
            )

        # 重新加载配置
        config_manager.reload_config(platform_name)

        return {
            "status": "ok",
            "message": f"平台配置已重新加载: {platform_name}",
            "platform": platform_name
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"重新加载平台配置失败: {str(e)}"
        )


@router.post("/cache/clear")
async def clear_cache(
    current_user: models.User = Depends(check_admin_permission),
    db: Session = Depends(get_db)
):
    """清空配置缓存"""
    try:
        config_manager = ConfigManager()
        config_manager.clear_cache()

        return {
            "status": "ok",
            "message": "配置缓存已清空"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"清空缓存失败: {str(e)}"
        )


@router.get("/config/paths")
async def get_config_paths(
    current_user: models.User = Depends(check_admin_permission),
    db: Session = Depends(get_db)
):
    """获取配置路径信息"""
    try:
        config_manager = ConfigManager()
        base_path = config_manager.base_path

        # 扫描目录结构
        def scan_directory(path: Path, level: int = 0):
            result = {
                "name": path.name,
                "path": str(path),
                "is_dir": path.is_dir(),
                "level": level
            }

            if path.is_dir():
                result["children"] = []
                try:
                    for child in sorted(path.iterdir()):
                        if child.name.startswith("."):
                            continue
                        result["children"].append(scan_directory(child, level + 1))
                except Exception as e:
                    result["error"] = str(e)
            else:
                result["size"] = path.stat().st_size
                result["modified"] = path.stat().st_mtime

            return result

        directory_tree = scan_directory(base_path)

        return {
            "status": "ok",
            "base_path": str(base_path),
            "absolute_path": str(base_path.absolute()),
            "exists": base_path.exists(),
            "directory_tree": directory_tree
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取配置路径失败: {str(e)}"
        )


@router.get("/health")
async def admin_health_check(
    current_user: models.User = Depends(check_admin_permission),
    db: Session = Depends(get_db)
):
    """后台管理健康检查"""
    try:
        # 检查数据库连接
        user_count = db.query(models.User).count()

        # 检查配置管理器
        config_manager = ConfigManager()
        platforms = config_manager.list_platforms()

        return {
            "status": "ok",
            "timestamp": "2026-04-08T00:00:00Z",  # 实际应用中应该使用datetime.now()
            "components": {
                "database": {
                    "connected": True,
                    "user_count": user_count
                },
                "config_manager": {
                    "initialized": True,
                    "platforms_count": len(platforms),
                    "base_path": str(config_manager.base_path)
                }
            },
            "permissions": {
                "user_id": current_user.id,
                "email": current_user.email,
                "is_admin": True
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"健康检查失败: {str(e)}"
        )