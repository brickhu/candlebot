#!/usr/bin/env python3
"""
紧急修复脚本
用于处理最紧急的老数据兼容性问题
"""
import os
import sys
import json
from datetime import datetime

from sqlalchemy import create_engine, text


class EmergencyFix:
    """紧急修复工具"""

    def __init__(self, db_url=None):
        self.db_url = db_url or os.getenv(
            "DATABASE_URL",
            "sqlite:///./candlebot.db"
        )
        self.engine = create_engine(self.db_url)
        self.is_postgres = "postgresql" in self.db_url
        self.is_sqlite = "sqlite" in self.db_url

    def check_and_fix_visibility(self):
        """检查并修复visibility字段"""
        print("🔍 检查visibility字段...")

        try:
            with self.engine.connect() as conn:
                # 检查字段是否存在
                if self.is_postgres:
                    check_sql = text("""
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = 'analysis_records'
                        AND column_name = 'visibility'
                    """)
                else:
                    # SQLite
                    check_sql = text("""
                        SELECT name
                        FROM pragma_table_info('analysis_records')
                        WHERE name = 'visibility'
                    """)

                result = conn.execute(check_sql)
                has_visibility = result.fetchone() is not None

                if not has_visibility:
                    print("❌ visibility字段不存在，正在添加...")

                    # 添加字段
                    if self.is_postgres:
                        add_sql = text("""
                            ALTER TABLE analysis_records
                            ADD COLUMN visibility VARCHAR(20) DEFAULT 'private'
                        """)
                    else:
                        add_sql = text("""
                            ALTER TABLE analysis_records
                            ADD COLUMN visibility VARCHAR(20) DEFAULT 'private'
                        """)

                    conn.execute(add_sql)

                    # 创建索引
                    if self.is_postgres:
                        index_sql = text("""
                            CREATE INDEX IF NOT EXISTS idx_analysis_records_visibility
                            ON analysis_records(visibility)
                        """)
                    else:
                        index_sql = text("""
                            CREATE INDEX IF NOT EXISTS idx_analysis_records_visibility
                            ON analysis_records(visibility)
                        """)

                    conn.execute(index_sql)
                    conn.commit()
                    print("✅ visibility字段添加成功")
                else:
                    print("✅ visibility字段已存在")

                # 检查并修复NULL值
                fix_sql = text("""
                    UPDATE analysis_records
                    SET visibility = 'private'
                    WHERE visibility IS NULL
                """)

                result = conn.execute(fix_sql)
                conn.commit()

                if result.rowcount > 0:
                    print(f"✅ 修复了 {result.rowcount} 条记录的visibility字段")

                return True

        except Exception as e:
            print(f"❌ 修复visibility字段失败: {e}")
            return False

    def check_and_fix_json_fields(self):
        """检查并修复JSON字段"""
        print("🔍 检查JSON字段...")

        try:
            with self.engine.connect() as conn:
                issues_fixed = 0

                # 检查analysis_metadata字段
                if self.is_sqlite:
                    # SQLite: 使用json_valid函数
                    check_sql = text("""
                        SELECT id, analysis_metadata, report_data
                        FROM analysis_records
                        WHERE json_valid(analysis_metadata) = 0
                           OR json_valid(report_data) = 0
                    """)
                else:
                    # PostgreSQL: 尝试转换为JSONB
                    check_sql = text("""
                        SELECT id, analysis_metadata::text, report_data::text
                        FROM analysis_records
                        WHERE analysis_metadata IS NULL OR report_data IS NULL
                    """)

                result = conn.execute(check_sql)
                invalid_records = result.fetchall()

                for record in invalid_records:
                    record_id, metadata, report = record
                    print(f"  发现无效JSON记录: ID={record_id}")

                    # 尝试修复
                    fixed_metadata = self._try_fix_json(metadata)
                    fixed_report = self._try_fix_json(report)

                    if fixed_metadata or fixed_report:
                        update_sql = text("""
                            UPDATE analysis_records
                            SET analysis_metadata = :metadata,
                                report_data = :report
                            WHERE id = :id
                        """)

                        conn.execute(update_sql, {
                            'metadata': fixed_metadata or metadata,
                            'report': fixed_report or report,
                            'id': record_id
                        })
                        issues_fixed += 1
                        print(f"    ✅ 修复记录 {record_id}")

                if issues_fixed > 0:
                    conn.commit()
                    print(f"✅ 修复了 {issues_fixed} 条记录的JSON字段")
                else:
                    print("✅ 所有JSON字段都有效")

                return True

        except Exception as e:
            print(f"❌ 修复JSON字段失败: {e}")
            return False

    def _try_fix_json(self, data):
        """尝试修复JSON数据"""
        if data is None:
            return '{}'

        if isinstance(data, dict):
            return json.dumps(data)

        if isinstance(data, str):
            data = data.strip()
            if not data:
                return '{}'

            try:
                # 尝试解析
                parsed = json.loads(data)
                return json.dumps(parsed)
            except json.JSONDecodeError:
                # 尝试简单修复
                if data.startswith('{') and data.endswith('}'):
                    # 可能是有效的JSON，但格式有问题
                    # 这里可以添加更复杂的修复逻辑
                    pass
                return '{}'  # 无法修复，返回空对象

        return None

    def check_and_fix_user_data(self):
        """检查并修复用户数据"""
        print("🔍 检查用户数据...")

        try:
            with self.engine.connect() as conn:
                fixes = []

                # 1. 修复NULL的plan_type
                fix_sql = text("""
                    UPDATE users
                    SET plan_type = 'free'
                    WHERE plan_type IS NULL OR plan_type = ''
                """)
                result = conn.execute(fix_sql)
                if result.rowcount > 0:
                    fixes.append(f"修复了 {result.rowcount} 条记录的plan_type")

                # 2. 修复无效的配额
                fix_sql = text("""
                    UPDATE users
                    SET quota_used = 0
                    WHERE quota_used IS NULL OR quota_used < 0
                """)
                result = conn.execute(fix_sql)
                if result.rowcount > 0:
                    fixes.append(f"修复了 {result.rowcount} 条记录的quota_used")

                # 3. 设置默认配额
                fix_sql = text("""
                    UPDATE users
                    SET quota_total = 5
                    WHERE quota_total IS NULL OR quota_total <= 0
                """)
                result = conn.execute(fix_sql)
                if result.rowcount > 0:
                    fixes.append(f"修复了 {result.rowcount} 条记录的quota_total")

                if fixes:
                    conn.commit()
                    print("✅ 用户数据修复:")
                    for fix in fixes:
                        print(f"  • {fix}")
                else:
                    print("✅ 用户数据正常")

                return True

        except Exception as e:
            print(f"❌ 修复用户数据失败: {e}")
            return False

    def create_backup(self):
        """创建数据备份"""
        print("💾 创建数据备份...")

        backup_dir = "backups"
        os.makedirs(backup_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(backup_dir, f"backup_{timestamp}.sql")

        try:
            if self.is_postgres:
                # PostgreSQL备份
                import subprocess
                result = subprocess.run(
                    ["pg_dump", self.db_url, "-f", backup_file],
                    capture_output=True, text=True
                )
                if result.returncode == 0:
                    print(f"✅ PostgreSQL备份已创建: {backup_file}")
                else:
                    print(f"❌ PostgreSQL备份失败: {result.stderr}")
                    return False

            elif self.is_sqlite:
                # SQLite备份
                import shutil
                db_file = self.db_url.replace("sqlite:///", "")
                if os.path.exists(db_file):
                    shutil.copy2(db_file, backup_file)
                    print(f"✅ SQLite备份已创建: {backup_file}")
                else:
                    print(f"❌ 数据库文件不存在: {db_file}")
                    return False

            return True

        except Exception as e:
            print(f"❌ 创建备份失败: {e}")
            return False

    def run_all_fixes(self, create_backup=True):
        """运行所有修复"""
        print("🚀 开始紧急修复...")
        print("=" * 60)

        if create_backup:
            if not self.create_backup():
                print("⚠️  备份失败，继续修复吗？")
                response = input("继续修复？(y/N): ")
                if response.lower() != 'y':
                    print("❌ 修复已取消")
                    return False

        fixes = [
            ("visibility字段", self.check_and_fix_visibility),
            ("JSON字段", self.check_and_fix_json_fields),
            ("用户数据", self.check_and_fix_user_data)
        ]

        success = True
        for name, fix_func in fixes:
            print(f"\n🔧 修复: {name}")
            if not fix_func():
                success = False
                print(f"❌ {name}修复失败")

        print("\n" + "=" * 60)
        if success:
            print("✅ 所有紧急修复完成")
        else:
            print("⚠️  部分修复失败，请检查日志")

        return success


def main():
    """命令行入口点"""
    import argparse

    parser = argparse.ArgumentParser(description="紧急修复工具")
    parser.add_argument("--db-url", help="数据库连接URL")
    parser.add_argument("--no-backup", action="store_true", help="不创建备份")
    parser.add_argument("--fix", choices=["visibility", "json", "users", "all"],
                       default="all", help="指定要修复的问题")

    args = parser.parse_args()

    fixer = EmergencyFix(args.db_url)

    if args.fix == "all":
        fixer.run_all_fixes(create_backup=not args.no_backup)
    else:
        if not args.no_backup:
            fixer.create_backup()

        if args.fix == "visibility":
            fixer.check_and_fix_visibility()
        elif args.fix == "json":
            fixer.check_and_fix_json_fields()
        elif args.fix == "users":
            fixer.check_and_fix_user_data()


if __name__ == "__main__":
    main()