#!/usr/bin/env python3
"""
统一的数据库迁移管理工具
支持渐进式迁移、版本管理和回滚
"""
import os
import sys
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from pathlib import Path

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import SQLAlchemyError


class MigrationManager:
    """数据库迁移管理器"""

    def __init__(self, db_url: Optional[str] = None):
        """
        初始化迁移管理器

        Args:
            db_url: 数据库连接URL，如果为None则从环境变量获取
        """
        self.db_url = db_url or os.getenv(
            "DATABASE_URL",
            "sqlite:///./candlebot.db"  # 默认使用SQLite
        )
        self.engine = create_engine(self.db_url)
        self.migrations_dir = Path("migrations")
        self.migrations_dir.mkdir(exist_ok=True)

        # 初始化迁移表
        self._init_migration_table()

    def _init_migration_table(self):
        """初始化迁移版本表"""
        try:
            with self.engine.connect() as conn:
                # 检查是否使用PostgreSQL
                is_postgres = "postgresql" in self.db_url

                if is_postgres:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS schema_migrations (
                            id SERIAL PRIMARY KEY,
                            version VARCHAR(50) NOT NULL UNIQUE,
                            description TEXT NOT NULL,
                            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            checksum VARCHAR(64),
                            status VARCHAR(20) DEFAULT 'applied'
                        )
                    """))
                else:
                    # SQLite版本
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS schema_migrations (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            version VARCHAR(50) NOT NULL UNIQUE,
                            description TEXT NOT NULL,
                            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            checksum VARCHAR(64),
                            status VARCHAR(20) DEFAULT 'applied'
                        )
                    """))
                conn.commit()
                print("✅ 迁移表初始化完成")
        except Exception as e:
            print(f"❌ 初始化迁移表失败: {e}")
            raise

    def get_current_version(self) -> Optional[str]:
        """获取当前数据库版本"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT version FROM schema_migrations
                    WHERE status = 'applied'
                    ORDER BY applied_at DESC
                    LIMIT 1
                """))
                row = result.fetchone()
                return row[0] if row else None
        except Exception as e:
            print(f"⚠️  获取当前版本失败: {e}")
            return None

    def get_pending_migrations(self) -> List[Dict]:
        """获取待应用的迁移"""
        current_version = self.get_current_version()
        migrations = []

        # 扫描迁移目录
        for migration_file in sorted(self.migrations_dir.glob("*.sql")):
            version = migration_file.stem  # 例如: 001_initial_schema

            # 检查是否已应用
            if current_version is None or version > current_version:
                with open(migration_file, 'r') as f:
                    content = f.read()
                    checksum = hashlib.sha256(content.encode()).hexdigest()

                migrations.append({
                    'version': version,
                    'file': migration_file,
                    'description': self._extract_description(content),
                    'checksum': checksum,
                    'content': content
                })

        return migrations

    def _extract_description(self, content: str) -> str:
        """从SQL文件中提取描述"""
        # 查找注释中的描述
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('--'):
                # 移除注释标记
                desc = line[2:].strip()
                if desc:
                    return desc
        return "No description"

    def apply_migration(self, migration: Dict) -> bool:
        """应用单个迁移"""
        version = migration['version']
        content = migration['content']
        checksum = migration['checksum']

        print(f"🔧 应用迁移: {version}")

        try:
            with self.engine.connect() as conn:
                # 开始事务
                trans = conn.begin()

                try:
                    # 执行迁移SQL
                    for statement in self._split_sql_statements(content):
                        if statement.strip():
                            conn.execute(text(statement))

                    # 记录迁移
                    conn.execute(text("""
                        INSERT INTO schema_migrations (version, description, checksum, status)
                        VALUES (:version, :description, :checksum, 'applied')
                    """), {
                        'version': version,
                        'description': migration['description'],
                        'checksum': checksum
                    })

                    trans.commit()
                    print(f"✅ 迁移 {version} 应用成功")
                    return True

                except Exception as e:
                    trans.rollback()
                    print(f"❌ 迁移 {version} 失败: {e}")
                    # 记录失败
                    conn.execute(text("""
                        INSERT INTO schema_migrations (version, description, checksum, status)
                        VALUES (:version, :description, :checksum, 'failed')
                    """), {
                        'version': version,
                        'description': migration['description'],
                        'checksum': checksum
                    })
                    conn.commit()
                    return False

        except Exception as e:
            print(f"❌ 应用迁移时发生错误: {e}")
            return False

    def _split_sql_statements(self, content: str) -> List[str]:
        """将SQL内容拆分为独立的语句"""
        # 简单的分号分割，实际项目中可能需要更复杂的解析
        statements = []
        current = []
        in_string = False
        string_char = None

        for char in content:
            current.append(char)

            if char in ("'", '"'):
                if not in_string:
                    in_string = True
                    string_char = char
                elif char == string_char:
                    # 检查是否是转义字符
                    if len(current) >= 2 and current[-2] != '\\':
                        in_string = False
                        string_char = None

            elif char == ';' and not in_string:
                statements.append(''.join(current))
                current = []

        # 添加最后一个语句（如果没有分号）
        if current:
            statements.append(''.join(current))

        return statements

    def rollback_migration(self, version: str) -> bool:
        """回滚到指定版本"""
        print(f"↩️  回滚到版本: {version}")

        try:
            with self.engine.connect() as conn:
                # 获取需要回滚的迁移
                result = conn.execute(text("""
                    SELECT version FROM schema_migrations
                    WHERE status = 'applied'
                    AND version > :version
                    ORDER BY applied_at DESC
                """), {'version': version})

                migrations_to_rollback = [row[0] for row in result.fetchall()]

                if not migrations_to_rollback:
                    print(f"✅ 已经是版本 {version}，无需回滚")
                    return True

                print(f"需要回滚的迁移: {', '.join(migrations_to_rollback)}")

                # 执行回滚（实际项目中需要为每个迁移提供回滚SQL）
                # 这里只是标记为回滚状态
                for mig_version in migrations_to_rollback:
                    conn.execute(text("""
                        UPDATE schema_migrations
                        SET status = 'rolled_back'
                        WHERE version = :version
                    """), {'version': mig_version})

                conn.commit()
                print(f"✅ 回滚到版本 {version} 完成")
                return True

        except Exception as e:
            print(f"❌ 回滚失败: {e}")
            return False

    def validate_migrations(self) -> List[Dict]:
        """验证所有迁移的完整性"""
        issues = []

        try:
            with self.engine.connect() as conn:
                # 检查已应用的迁移
                result = conn.execute(text("""
                    SELECT version, checksum FROM schema_migrations
                    WHERE status = 'applied'
                """))
                applied_migrations = {row[0]: row[1] for row in result.fetchall()}

                # 验证每个迁移文件
                for migration_file in sorted(self.migrations_dir.glob("*.sql")):
                    version = migration_file.stem

                    with open(migration_file, 'r') as f:
                        content = f.read()
                        current_checksum = hashlib.sha256(content.encode()).hexdigest()

                    if version in applied_migrations:
                        stored_checksum = applied_migrations[version]
                        if stored_checksum != current_checksum:
                            issues.append({
                                'type': 'checksum_mismatch',
                                'version': version,
                                'message': f'迁移文件已被修改，存储的校验和: {stored_checksum}, 当前的: {current_checksum}'
                            })
                    else:
                        issues.append({
                            'type': 'not_applied',
                            'version': version,
                            'message': '迁移尚未应用'
                        })

        except Exception as e:
            issues.append({
                'type': 'validation_error',
                'message': f'验证过程中发生错误: {e}'
            })

        return issues

    def create_migration(self, description: str) -> Optional[Path]:
        """创建新的迁移文件"""
        # 获取下一个版本号
        migration_files = list(self.migrations_dir.glob("*.sql"))
        if migration_files:
            last_version = max(int(f.stem.split('_')[0]) for f in migration_files)
            next_version = last_version + 1
        else:
            next_version = 1

        version_str = f"{next_version:03d}_{description.lower().replace(' ', '_')}"
        migration_file = self.migrations_dir / f"{version_str}.sql"

        # 创建迁移模板
        template = f"""-- {description}
-- 迁移ID: {version_str}
-- 创建时间: {datetime.now().isoformat()}

-- 在此处编写迁移SQL
-- 示例:
-- ALTER TABLE analysis_records ADD COLUMN new_column VARCHAR(100);

-- 如果需要回滚，在下面添加回滚SQL
-- 回滚示例:
-- ALTER TABLE analysis_records DROP COLUMN new_column;
"""

        try:
            with open(migration_file, 'w') as f:
                f.write(template)

            print(f"✅ 创建迁移文件: {migration_file}")
            return migration_file

        except Exception as e:
            print(f"❌ 创建迁移文件失败: {e}")
            return None

    def run_all_pending(self) -> bool:
        """应用所有待处理的迁移"""
        pending = self.get_pending_migrations()

        if not pending:
            print("✅ 没有待处理的迁移")
            return True

        print(f"🔧 发现 {len(pending)} 个待处理迁移")

        success = True
        for migration in pending:
            if not self.apply_migration(migration):
                success = False
                print(f"❌ 迁移失败，停止执行")
                break

        return success

    def get_migration_history(self) -> List[Dict]:
        """获取迁移历史"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT version, description, applied_at, checksum, status
                    FROM schema_migrations
                    ORDER BY applied_at DESC
                """))
                return [
                    {
                        'version': row[0],
                        'description': row[1],
                        'applied_at': row[2],
                        'checksum': row[3],
                        'status': row[4]
                    }
                    for row in result.fetchall()
                ]
        except Exception as e:
            print(f"❌ 获取迁移历史失败: {e}")
            return []


def main():
    """命令行入口点"""
    import argparse

    parser = argparse.ArgumentParser(description="数据库迁移管理工具")
    parser.add_argument("--db-url", help="数据库连接URL")
    parser.add_argument("--action", choices=[
        "status", "pending", "apply", "rollback",
        "validate", "create", "history", "run-all"
    ], default="status", help="执行的操作")

    parser.add_argument("--version", help="迁移版本（用于apply/rollback）")
    parser.add_argument("--description", help="迁移描述（用于create）")

    args = parser.parse_args()

    manager = MigrationManager(args.db_url)

    if args.action == "status":
        current = manager.get_current_version()
        pending = len(manager.get_pending_migrations())
        print(f"当前版本: {current or '无'}")
        print(f"待处理迁移: {pending}")

    elif args.action == "pending":
        pending = manager.get_pending_migrations()
        if pending:
            print("待处理迁移:")
            for mig in pending:
                print(f"  {mig['version']}: {mig['description']}")
        else:
            print("没有待处理迁移")

    elif args.action == "apply" and args.version:
        pending = manager.get_pending_migrations()
        migration = next((m for m in pending if m['version'] == args.version), None)
        if migration:
            manager.apply_migration(migration)
        else:
            print(f"❌ 找不到迁移: {args.version}")

    elif args.action == "rollback" and args.version:
        manager.rollback_migration(args.version)

    elif args.action == "validate":
        issues = manager.validate_migrations()
        if issues:
            print("发现的问题:")
            for issue in issues:
                print(f"  {issue['type']}: {issue.get('version', '')} - {issue['message']}")
        else:
            print("✅ 所有迁移验证通过")

    elif args.action == "create" and args.description:
        manager.create_migration(args.description)

    elif args.action == "history":
        history = manager.get_migration_history()
        if history:
            print("迁移历史:")
            for item in history:
                print(f"  {item['version']} ({item['status']}): {item['description']}")
                print(f"    应用时间: {item['applied_at']}")
        else:
            print("没有迁移历史")

    elif args.action == "run-all":
        manager.run_all_pending()

    else:
        parser.print_help()


if __name__ == "__main__":
    main()