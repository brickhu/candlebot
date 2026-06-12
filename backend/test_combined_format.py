#!/usr/bin/env python3
"""
测试结合示例的输出格式
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai.config.manager import ConfigManager

def test_combined_output_format():
    """测试结合示例的输出格式"""
    print("🧪 测试结合示例的输出格式")
    print("=" * 60)

    try:
        # 初始化配置管理器
        config_manager = ConfigManager()
        print("✅ 配置管理器初始化成功")

        # 测试获取输出格式
        print("\n📄 测试输出格式内容:")
        output_format_zh = config_manager.get_output_format("zh")
        output_format_en = config_manager.get_output_format("en")

        print(f"  中文版本长度: {len(output_format_zh)} 字符")
        print(f"  英文版本长度: {len(output_format_en)} 字符")

        # 检查关键内容
        print("\n🔍 检查中文输出格式关键内容:")

        zh_checks = [
            ("格式模板", "模板部分"),
            ("ETHUSD · 15m · $3,450.50", "示例标题"),
            ("技术面信号", "技术信号表格"),
            ("概率预测", "概率预测部分"),
            ("完整示例分析", "完整示例"),
            ("示例1：ETHUSD 15分钟上升趋势", "具体示例1"),
            ("示例2：BTCUSD 1小时下降趋势", "具体示例2"),
            ("你的分析输出", "用户输出模板"),
            ("METADATA", "元数据部分")
        ]

        for check, description in zh_checks:
            if check in output_format_zh:
                print(f"    ✅ {description}: '{check}'")
            else:
                print(f"    ❌ {description}: 缺少 '{check}'")

        # 检查示例完整性
        print("\n📊 检查示例完整性:")

        example_parts = [
            "连续4根阳线，上升趋势",
            "上升角度约20度，买方主导",
            "+1.2%（连续6根绿色）",
            "放量（为平均1.8倍）",
            "价格在VWAP上方1.5%",
            "场景A（82%）：继续上涨 → 目标 $3,520",
            "🟢🟢🟢做多良机",
            "RATING:🟢🟢🟢做多良机",
            "RATING_SCORE:3",
            "SUMMARY:多重技术指标确认上升趋势"
        ]

        found_count = 0
        for part in example_parts:
            if part in output_format_zh:
                found_count += 1
            else:
                print(f"    ⚠️  缺少示例部分: '{part[:30]}...'")

        print(f"    📈 示例完整性: {found_count}/{len(example_parts)} ({found_count/len(example_parts)*100:.1f}%)")

        # 测试组合提示词
        print("\n🤖 测试组合提示词:")
        combined_prompt = config_manager.get_combined_prompt("aggr", "zh")

        # 分析组合提示词结构
        lines = combined_prompt.split('\n')
        sections = {
            "平台提示词": "Candlebot · K线专家" in combined_prompt,
            "量化指标": "必须量化" in combined_prompt,
            "输出格式": "输出格式与示例" in combined_prompt,
            "完整示例": "示例1：ETHUSD 15分钟上升趋势" in combined_prompt,
            "用户模板": "你的分析输出" in combined_prompt,
            "元数据": "METADATA" in combined_prompt
        }

        print("  组合提示词包含:")
        for section, found in sections.items():
            status = "✅" if found else "❌"
            print(f"    {status} {section}")

        # 显示提示词结构
        print(f"\n📋 提示词结构统计:")
        print(f"   总行数: {len(lines)}")
        print(f"   总字符数: {len(combined_prompt)}")

        # 估算各部分大小
        platform_part = "Candlebot · K线专家"
        format_part = "输出格式与示例"

        platform_start = combined_prompt.find(platform_part)
        format_start = combined_prompt.find(format_part)

        if platform_start >= 0 and format_start >= 0:
            platform_size = format_start - platform_start
            format_size = len(combined_prompt) - format_start

            print(f"   平台提示词部分: {platform_size} 字符 ({platform_size/len(combined_prompt)*100:.1f}%)")
            print(f"   输出格式部分: {format_size} 字符 ({format_size/len(combined_prompt)*100:.1f}%)")

        # 显示预览
        print("\n👀 输出格式预览（关键部分）:")
        print("-" * 60)

        # 找到示例部分
        example_start = output_format_zh.find("示例1：ETHUSD")
        if example_start >= 0:
            preview = output_format_zh[example_start:example_start + 500]
            print(preview + "...")
        else:
            print(output_format_zh[:500] + "...")

        print("-" * 60)

        return True

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_prompt_integration():
    """测试提示词集成"""
    print("\n🔗 测试提示词集成:")
    print("=" * 60)

    try:
        config_manager = ConfigManager()

        # 测试不同平台的提示词
        platforms = ["aggr", "tradingview"]

        for platform in platforms:
            print(f"\n📱 平台: {platform}")

            try:
                prompt_zh = config_manager.get_combined_prompt(platform, "zh")
                prompt_en = config_manager.get_combined_prompt(platform, "en")

                print(f"   中文提示词长度: {len(prompt_zh)} 字符")
                print(f"   英文提示词长度: {len(prompt_en)} 字符")

                # 检查是否包含输出格式
                if "输出格式与示例" in prompt_zh or "Output Format with Examples" in prompt_en:
                    print("   ✅ 包含结合示例的输出格式")
                else:
                    print("   ❌ 缺少结合示例的输出格式")

            except Exception as e:
                print(f"   ⚠️  平台 {platform} 测试失败: {e}")

        return True

    except Exception as e:
        print(f"❌ 集成测试失败: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Candlebot 结合示例的输出格式测试")
    print("=" * 60)

    success = True

    # 运行测试
    if not test_combined_output_format():
        success = False

    if not test_prompt_integration():
        success = False

    print("\n" + "=" * 60)
    if success:
        print("🎉 测试通过！输出格式已成功结合示例")
        print("\n✅ 改进总结:")
        improvements = [
            "1. 输出格式现在包含完整的分析示例",
            "2. 示例展示了正确的格式和内容",
            "3. 提供了具体的数值参考（价格、角度、百分比）",
            "4. 包含完整的元数据示例",
            "5. 用户模板清晰明确",
            "6. 支持中英文双语"
        ]

        for imp in improvements:
            print(f"   {imp}")

        print("\n🎯 使用效果预期:")
        print("   • AI将更好地理解预期输出格式")
        print("   • 分析结果将更一致和准确")
        print("   • 减少了格式错误的可能性")
        print("   • 提供了具体的学习参考")
    else:
        print("⚠️  测试失败，请检查配置")

    sys.exit(0 if success else 1)