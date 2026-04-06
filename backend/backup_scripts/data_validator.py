#!/usr/bin/env python3
"""
数据验证和修复工具
用于检查老数据的兼容性问题并自动修复
"""
import os
import sys
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import SQLAlchemyError


class DataValidator:
    """数据验证和修复工具"""

    def __init__(self, db_url: Optional[str] = None):
        """
        初始化数据验证器

        Args:
            db_url: 数据库连接URL
        """
        self.db_url = db_url or os.getenv(
            "DATABASE_URL",
            "sqlite:///./candlebot.db"
        )
        self.engine = create_engine(self.db_url)
        self.inspector = inspect(self.engine)

    def validate_table_structure(self, table_name: str) -> List[Dict]:
        """验证表结构完整性"""
        issues = []

        try:
            # 检查表是否存在
            if table_name not in self.inspector.get_table_names():
                issues.append({
                    'type': 'table_missing',
                    'table': table_name,
                    'message': f'表 {table_name} 不存在'
                })
                return issues

            # 获取表结构
            columns = self.inspector.get_columns(table_name)
            expected_columns = self._get_expected_columns(table_name)

            # 检查缺失的列
            column_names = [col['name'] for col in columns]
            for expected in expected_columns:
                if expected['name'] not in column_names:
                    issues.append({
                        'type': 'column_missing',
                        'table': table_name,
                        'column': expected['name'],
                        'message': f'列 {expected["name"]} 缺失'
                    })

            # 检查列类型
            for col in columns:
                expected = next(
                    (e for e in expected_columns if e['name'] == col['name']),
                    None
                )
                if expected:
                    actual_type = str(col['type']).lower()
                    expected_type = expected['type'].lower()

                    # 简单的类型检查（实际项目中可能需要更复杂的检查）
                    if not self._type_compatible(actual_type, expected_type):
                        issues.append({
                            'type': 'type_mismatch',
                            'table': table_name,
                            'column': col['name'],
                            'message': f'类型不匹配: 实际={actual_type}, 期望={expected_type}'
                        })

        except Exception as e:
            issues.append({
                'type': 'validation_error',
                'table': table_name,
                'message': f'验证表结构时发生错误: {e}'
            })

        return issues

    def _get_expected_columns(self, table_name: str) -> List[Dict]:
        """获取期望的表结构"""
        # 根据表名返回期望的列定义
        # 这里可以根据实际需求扩展
        if table_name == 'analysis_records':
            return [
                {'name': 'id', 'type': 'INTEGER', 'nullable': False},
                {'name': 'user_id', 'type': 'INTEGER', 'nullable': False},
                {'name': 'platform', 'type': 'VARCHAR(50)', 'nullable': False},
                {'name': 'image_hash', 'type': 'VARCHAR(64)', 'nullable': True},
                {'name': 'image_data', 'type': 'TEXT', 'nullable': True},
                {'name': 'report_data', 'type': 'JSON', 'nullable': False},
                {'name': 'analysis_metadata', 'type': 'JSON', 'nullable': False},
                {'name': 'visibility', 'type': 'VARCHAR(20)', 'nullable': True},
                {'name': 'created_at', 'type': 'DATETIME', 'nullable': True}
            ]
        elif table_name == 'users':
            return [
                {'name': 'id', 'type': 'INTEGER', 'nullable': False},
                {'name': 'email', 'type': 'VARCHAR(255)', 'nullable': False},
                {'name': 'password_hash', 'type': 'VARCHAR(255)', 'nullable': True},
                {'name': 'username', 'type': 'VARCHAR(100)', 'nullable': True},
                {'name': 'plan_type', 'type': 'VARCHAR(50)', 'nullable': True},
                {'name': 'quota_total', 'type': 'INTEGER', 'nullable': True},
                {'name': 'quota_used', 'type': 'INTEGER', 'nullable': True},
                {'name': 'created_at', 'type': 'DATETIME', 'nullable': True}
            ]
        else:
            return []

    def _type_compatible(self, actual: str, expected: str) -> bool:
        """检查类型是否兼容"""
        # 简单的类型兼容性检查
        type_map = {
            'integer': ['int', 'integer', 'bigint', 'smallint'],
            'varchar': ['varchar', 'char', 'text', 'string'],
            'text': ['text', 'varchar', 'string'],
            'json': ['json', 'jsonb', 'text'],
            'datetime': ['datetime', 'timestamp', 'date']
        }

        actual_lower = actual.lower()
        expected_lower = expected.lower()

        # 如果类型完全匹配
        if expected_lower in actual_lower or actual_lower in expected_lower:
            return True

        # 检查类型映射
        for base_type, compatible_types in type_map.items():
            if expected_lower == base_type and any(t in actual_lower for t in compatible_types):
                return True
            if actual_lower == base_type and any(t in expected_lower for t in compatible_types):
                return True

        return False

    def validate_data_integrity(self, table_name: str) -> List[Dict]:
        """验证数据完整性"""
        issues = []

        try:
            with self.engine.connect() as conn:
                if table_name == 'analysis_records':
                    issues.extend(self._validate_analysis_records(conn))
                elif table_name == 'users':
                    issues.extend(self._validate_users(conn))
                # 可以添加其他表的验证

        except Exception as e:
            issues.append({
                'type': 'validation_error',
                'table': table_name,
                'message': f'验证数据完整性时发生错误: {e}'
            })

        return issues

    def _validate_analysis_records(self, conn) -> List[Dict]:
        """验证analysis_records表的数据完整性"""
        issues = []

        # 1. 检查必需字段
        result = conn.execute(text("""
            SELECT id, user_id, platform, report_data, analysis_metadata
            FROM analysis_records
            WHERE user_id IS NULL OR platform IS NULL
               OR report_data IS NULL OR analysis_metadata IS NULL
        """))
        for row in result.fetchall():
            issues.append({
                'type': 'null_required_field',
                'table': 'analysis_records',
                'record_id': row[0],
                'message': f'记录 {row[0]} 缺少必需字段'
            })

        # 2. 检查JSON格式
        # 对于SQLite
        if 'sqlite' in self.db_url:
            result = conn.execute(text("""
                SELECT id, report_data, analysis_metadata
                FROM analysis_records
                WHERE json_valid(report_data) = 0 OR json_valid(analysis_metadata) = 0
            """))
        else:
            # 对于PostgreSQL
            result = conn.execute(text("""
                SELECT id, report_data::text, analysis_metadata::text
                FROM analysis_records
                WHERE report_data IS NULL OR analysis_metadata IS NULL
            """))

        for row in result.fetchall():
            issues.append({
                'type': 'invalid_json',
                'table': 'analysis_records',
                'record_id': row[0],
                'message': f'记录 {row[0]} 包含无效的JSON数据'
            })

        # 3. 检查外键关系
        result = conn.execute(text("""
            SELECT ar.id, ar.user_id
            FROM analysis_records ar
            LEFT JOIN users u ON ar.user_id = u.id
            WHERE u.id IS NULL AND ar.user_id IS NOT NULL
        """))
        for row in result.fetchall():
            issues.append({
                'type': 'foreign_key_violation',
                'table': 'analysis_records',
                'record_id': row[0],
                'message': f'记录 {row[0]} 引用了不存在的用户 {row[1]}'
            })

        # 4. 检查visibility字段
        result = conn.execute(text("""
            SELECT id, visibility
            FROM analysis_records
            WHERE visibility IS NULL OR visibility NOT IN ('private', 'public')
        """))
        for row in result.fetchall():
            issues.append({
                'type': 'invalid_visibility',
                'table': 'analysis_records',
                'record_id': row[0],
                'message': f'记录 {row[0]} 有无效的visibility值: {row[1]}'
            })

        return issues

    def _validate_users(self, conn) -> List[Dict]:
        """验证users表的数据完整性"""
        issues = []

        # 1. 检查必需字段
        result = conn.execute(text("""
            SELECT id, email
            FROM users
            WHERE email IS NULL OR email = ''
        """))
        for row in result.fetchall():
            issues.append({
                'type': 'null_required_field',
                'table': 'users',
                'record_id': row[0],
                'message': f'用户 {row[0]} 缺少email'
            })

        # 2. 检查email唯一性
        result = conn.execute(text("""
            SELECT email, COUNT(*) as count
            FROM users
            GROUP BY email
            HAVING COUNT(*) > 1
        """))
        for row in result.fetchall():
            issues.append({
                'type': 'duplicate_email',
                'table': 'users',
                'message': f'重复的email: {row[0]} (出现{row[1]}次)'
            })

        # 3. 检查配额合理性
        result = conn.execute(text("""
            SELECT id, quota_used, quota_total
            FROM users
            WHERE quota_used > quota_total OR quota_used < 0 OR quota_total < 0
        """))
        for row in result.fetchall():
            issues.append({
                'type': 'invalid_quota',
                'table': 'users',
                'record_id': row[0],
                'message': f'用户 {row[0]} 有无效的配额: 已用={row[1]}, 总数={row[2]}'
            })

        return issues

    def fix_common_issues(self, table_name: str, dry_run: bool = True) -> Tuple[List[Dict], List[Dict]]:
        """修复常见的数据问题"""
        fixed = []
        failed = []

        try:
            with self.engine.connect() as conn:
                if table_name == 'analysis_records':
                    fixes = self._fix_analysis_records(conn, dry_run)
                elif table_name == 'users':
                    fixes = self._fix_users(conn, dry_run)
                else:
                    return fixed, failed

                for fix in fixes:
                    if fix.get('success'):
                        fixed.append(fix)
                    else:
                        failed.append(fix)

        except Exception as e:
            failed.append({
                'type': 'fix_error',
                'table': table_name,
                'message': f'修复数据时发生错误: {e}'
            })

        return fixed, failed

    def _fix_analysis_records(self, conn, dry_run: bool) -> List[Dict]:
        """修复analysis_records表的常见问题"""
        fixes = []

        # 1. 修复NULL的visibility字段
        if 'sqlite' in self.db_url:
            check_sql = text("""
                SELECT column_name
                FROM pragma_table_info('analysis_records')
                WHERE name = 'visibility'
            """)
            result = conn.execute(check_sql)
            has_visibility = result.fetchone() is not None
        else:
            # PostgreSQL
            check_sql = text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'analysis_records'
                AND column_name = 'visibility'
            """)
            result = conn.execute(check_sql)
            has_visibility = result.fetchone() is not None

        if has_visibility:
            update_sql = text("""
                UPDATE analysis_records
                SET visibility = 'private'
                WHERE visibility IS NULL
            """)

            if not dry_run:
                try:
                    result = conn.execute(update_sql)
                    conn.commit()
                    fixes.append({
                        'type': 'fix_null_visibility',
                        'success': True,
                        'message': f'修复了 {result.rowcount} 条记录的visibility字段'
                    })
                except Exception as e:
                    fixes.append({
                        'type': 'fix_null_visibility',
                        'success': False,
                        'message': f'修复visibility字段失败: {e}'
                    })
            else:
                # 干运行：只统计
                count_sql = text("""
                    SELECT COUNT(*) FROM analysis_records WHERE visibility IS NULL
                """)
                result = conn.execute(count_sql)
                count = result.scalar()
                if count > 0:
                    fixes.append({
                        'type': 'fix_null_visibility',
                        'success': True,
                        'message': f'将修复 {count} 条记录的visibility字段（干运行）'
                    })

        # 2. 修复无效的JSON
        if 'sqlite' in self.db_url:
            # SQLite: 检查并修复无效JSON
            check_sql = text("""
                SELECT id, report_data, analysis_metadata
                FROM analysis_records
                WHERE json_valid(report_data) = 0 OR json_valid(analysis_metadata) = 0
            """)
            result = conn.execute(check_sql)
            invalid_records = result.fetchall()

            for record in invalid_records:
                record_id, report_data, metadata = record

                # 尝试修复
                fixed_report = self._try_fix_json(report_data)
                fixed_metadata = self._try_fix_json(metadata)

                if fixed_report is not None or fixed_metadata is not None:
                    update_sql = text("""
                        UPDATE analysis_records
                        SET report_data = :report, analysis_metadata = :metadata
                        WHERE id = :id
                    """)

                    if not dry_run:
                        try:
                            conn.execute(update_sql, {
                                'report': fixed_report or report_data,
                                'metadata': fixed_metadata or metadata,
                                'id': record_id
                            })
                            fixes.append({
                                'type': 'fix_invalid_json',
                                'success': True,
                                'record_id': record_id,
                                'message': '修复了无效的JSON数据'
                            })
                        except Exception as e:
                            fixes.append({
                                'type': 'fix_invalid_json',
                                'success': False,
                                'record_id': record_id,
                                'message': f'修复JSON失败: {e}'
                            })
                    else:
                        fixes.append({
                            'type': 'fix_invalid_json',
                            'success': True,
                            'record_id': record_id,
                            'message': '将修复无效的JSON数据（干运行）'
                        })

        return fixes

    def _try_fix_json(self, data: Any) -> Optional[str]:
        """尝试修复JSON数据"""
        if data is None:
            return '{}'

        if isinstance(data, dict):
            return json.dumps(data)

        if isinstance(data, str):
            # 尝试解析
            try:
                parsed = json.loads(data)
                return json.dumps(parsed)  # 重新序列化以确保格式正确
            except json.JSONDecodeError:
                # 尝试修复常见的JSON问题
                fixed = data.strip()
                if not fixed:
                    return '{}'

                # 尝试添加缺失的引号等（简单修复）
                # 这里可以根据实际需求扩展
                try:
                    # 如果是类似Python字典的字符串
                    if fixed.startswith('{') and fixed.endswith('}'):
                        # 尝试用ast.literal_eval解析
                        import ast
                        try:
                            parsed = ast.literal_eval(fixed)
                            return json.dumps(parsed)
                        except:
                            pass
                except:
                    pass

        return None

    def _fix_users(self, conn, dry_run: bool) -> List[Dict]:
        """修复users表的常见问题"""
        fixes = []

        # 1. 修复NULL的plan_type
        update_sql = text("""
            UPDATE users
            SET plan_type = 'free'
            WHERE plan_type IS NULL OR plan_type = ''
        """)

        if not dry_run:
            try:
                result = conn.execute(update_sql)
                conn.commit()
                fixes.append({
                    'type': 'fix_null_plan_type',
                    'success': True,
                    'message': f'修复了 {result.rowcount} 条记录的plan_type字段'
                })
            except Exception as e:
                fixes.append({
                    'type': 'fix_null_plan_type',
                    'success': False,
                    'message': f'修复plan_type字段失败: {e}'
                })
        else:
            # 干运行
            count_sql = text("""
                SELECT COUNT(*) FROM users
                WHERE plan_type IS NULL OR plan_type = ''
            """)
            result = conn.execute(count_sql)
            count = result.scalar()
            if count > 0:
                fixes.append({
                    'type': 'fix_null_plan_type',
                    'success': True,
                    'message': f'将修复 {count} 条记录的plan_type字段（干运行）'
                })

        # 2. 修复配额
        update_sql = text("""
            UPDATE users
            SET quota_used = 0
            WHERE quota_used IS NULL OR quota_used < 0
        """)

        if not dry_run:
            try:
                result = conn.execute(update_sql)
                conn.commit()
                fixes.append({
                    'type': 'fix_invalid_quota',
                    'success': True,
                    'message': f'修复了 {result.rowcount} 条记录的quota_used字段'
                })
            except Exception as e:
                fixes.append({
                    'type': 'fix_invalid_quota',
                    'success': False,
                    'message': f'修复quota_used字段失败: {e}'
                })
        else:
            count_sql = text("""
                SELECT COUNT(*) FROM users
                WHERE quota_used IS NULL OR quota_used < 0
            """)
            result = conn.execute(count_sql)
            count = result.scalar()
            if count > 0:
                fixes.append({
                    'type': 'fix_invalid_quota',
                    'success': True,
                    'message': f'将修复 {count} 条记录的quota_used字段（干运行）'
                })

        return fixes

    def generate_report(self, table_name: str = None) -> Dict[str, Any]:
        """生成数据验证报告"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'database_url': self.db_url,
            'tables': {},
            'summary': {
                'total_issues': 0,
                'total_fixed': 0,
                'total_failed': 0
            }
        }

        tables_to_check = [table_name] if table_name else self.inspector.get_table_names()

        for table in tables_to_check:
            if table.startswith('schema_') or table.startswith('alembic_'):
                continue  # 跳过系统表

            table_report = {
                'structure_issues': self.validate_table_structure(table),
                'data_issues': self.validate_data_integrity(table),
                'fixes': []
            }

            # 尝试修复
            if table_report['data_issues']:
                fixed, failed = self.fix_common_issues(table, dry_run=True)
                table_report['fixes'] = fixed
                table_report['failed_fixes'] = failed

            report['tables'][table] = table_report

            # 更新摘要
            report['summary']['total_issues'] += (
                len(table_report['structure_issues']) +
                len(table_report['data_issues'])
            )
            report['summary']['total_fixed'] += len(table_report['fixes'])
            report['summary']['total_failed'] += len(table_report.get('failed_fixes', []))

        return report

    def print_report(self, report: Dict[str, Any]):
        """打印验证报告"""
        print(f"📊 数据验证报告")
        print(f"时间: {report['timestamp']}")
        print(f"数据库: {report['database_url']}")
        print(f"=" * 60)

        for table_name, table_report in report['tables'].items():
            print(f"\n📋 表: {table_name}")

            # 结构问题
            if table_report['structure_issues']:
                print(f"  🔧 结构问题 ({len(table_report['structure_issues'])}):")
                for issue in table_report['structure_issues']:
                    print(f"    • {issue['type']}: {issue['message']}")

            # 数据问题
            if table_report['data_issues']:
                print(f"  📝 数据问题 ({len(table_report['data_issues'])}):")
                for issue in table_report['data_issues']:
                    record_info = f"记录 {issue.get('record_id', 'N/A')}" if issue.get('record_id') else ""
                    print(f"    • {issue['type']} {record_info}: {issue['message']}")

            # 修复建议
            if table_report['fixes']:
                print(f"  🔧 可修复的问题 ({len(table_report['fixes'])}):")
                for fix in table_report['fixes']:
                    print(f"    • {fix['type']}: {fix['message']}")

            # 修复失败
            if table_report.get('failed_fixes'):
                print(f"  ❌ 修复失败 ({len(table_report['failed_fixes'])}):")
                for fix in table_report['failed_fixes']:
                    print(f"    • {fix['type']}: {fix['message']}")

        print(f"\n{'=' * 60}")
        summary = report['summary']
        print(f"📈 摘要:")
        print(f"  总问题数: {summary['total_issues']}")
        print(f"  可修复数: {summary['total_fixed']}")
        print(f"  修复失败: {summary['total_failed']}")


def main():
    """命令行入口点"""
    import argparse

    parser = argparse.ArgumentParser(description="数据验证和修复工具")
    parser.add_argument("--db-url", help="数据库连接URL")
    parser.add_argument("--table", help="指定要验证的表（默认验证所有表）")
    parser.add_argument("--fix", action="store_true", help="执行修复（默认只报告）")
    parser.add_argument("--report-only", action="store_true", help="只生成报告，不执行修复")

    args = parser.parse_args()

    validator = DataValidator(args.db_url)

    # 生成报告
    report = validator.generate_report(args.table)
    validator.print_report(report)

    # 执行修复
    if args.fix and not args.report_only:
        print(f"\n{'=' * 60}")
        print("🔧 开始修复数据...")

        tables_to_fix = [args.table] if args.table else list(report['tables'].keys())

        for table in tables_to_fix:
            if table in report['tables']:
                table_report = report['tables'][table]
                if table_report['data_issues']:
                    print(f"\n修复表: {table}")
                    fixed, failed = validator.fix_common_issues(table, dry_run=False)

                    if fixed:
                        print(f"  ✅ 成功修复 {len(fixed)} 个问题")
                        for fix in fixed:
                            print(f"    • {fix['message']}")

                    if failed:
                        print(f"  ❌ 修复失败 {len(failed)} 个问题")
                        for fix in failed:
                            print(f"    • {fix['message']}")

        print(f"\n✅ 修复完成")

    # 保存报告到文件
    report_file = f"data_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2, default=str)

    print(f"\n📄 报告已保存到: {report_file}")


if __name__ == "__main__":
    main()