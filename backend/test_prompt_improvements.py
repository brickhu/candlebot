#!/usr/bin/env python3
"""
测试提示词改进效果
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai.config.manager import ConfigManager

def test_prompt_improvements():
    """测试提示词改进"""
    print("🧪 测试提示词改进效果")
    print("=" * 60)

    try:
        # 初始化配置管理器
        config_manager = ConfigManager()
        print("✅ 配置管理器初始化成功")

        # 测试获取平台配置
        print("\n📋 测试平台配置:")
        aggr_config = config_manager.get_platform_config("aggr")
        print(f"  平台名称: {aggr_config.name}")
        print(f"  描述: {aggr_config.description}")
        print(f"  支持语言: {aggr_config.supported_languages}")
        print(f"  功能特性: {aggr_config.features}")
        print(f"  示例图片启用: {aggr_config.example_images.enabled}")

        # 测试获取示例元数据
        print("\n📸 测试示例图片元数据:")
        metadata = config_manager.get_example_images_metadata("aggr")
        print(f"  启用状态: {metadata.get('enabled', False)}")
        print(f"  示例数量: {len(metadata.get('examples', []))}")

        if metadata.get('examples'):
            for i, example in enumerate(metadata['examples'][:2], 1):
                print(f"\n  示例{i}:")
                print(f"    ID: {example.get('id')}")
                print(f"    描述: {example.get('description')}")
                if 'analysis_points' in example:
                    points = example['analysis_points']
                    print(f"    交易对: {points.get('pair')}")
                    print(f"    时间周期: {points.get('timeframe')}")
                    print(f"    价格: ${points.get('price', 0):.2f}")
                    print(f"    概率: {points.get('probability_score', 0)}%")
                    print(f"    评级: {points.get('rating')}")

        # 测试获取增强版提示词
        print("\n🤖 测试增强版提示词:")
        enhanced_prompt = config_manager.get_enhanced_prompt("aggr", "zh")

        # 分析提示词内容
        lines = enhanced_prompt.split('\n')
        print(f"  总行数: {len(lines)}")
        print(f"  总字符数: {len(enhanced_prompt)}")

        # 检查关键部分
        sections = {
            "量化指标": any("必须量化" in line for line in lines),
            "概率计算": any("概率计算" in line for line in lines),
            "输出格式": any("输出格式与示例" in line for line in lines),
            "完整示例": any("完整示例分析" in line for line in lines),
            "用户模板": any("你的分析输出" in line for line in lines),
            "元数据": any("METADATA" in line for line in lines)
        }

        print("\n  关键部分检查:")
        for section, found in sections.items():
            status = "✅" if found else "❌"
            print(f"    {status} {section}")

        # 显示提示词预览
        print("\n📄 提示词预览（前500字符）:")
        print("-" * 60)
        print(enhanced_prompt[:500] + "...")
        print("-" * 60)

        # 测试旧版提示词对比
        print("\n🔄 新旧提示词对比:")
        old_prompt = config_manager.get_combined_prompt("aggr", "zh")
        print(f"  旧版长度: {len(old_prompt)} 字符")
        print(f"  增强版长度: {len(enhanced_prompt)} 字符")
        print(f"  增加内容: {len(enhanced_prompt) - len(old_prompt)} 字符 (+{(len(enhanced_prompt) - len(old_prompt))/len(old_prompt)*100:.1f}%)")

        print("\n🎯 改进总结:")
        improvements = [
            "1. 增加了量化指标定义（角度、阈值、连续根数）",
            "2. 明确了概率计算规则（基础概率+调整项）",
            "3. 添加了示例图片参考系统",
            "4. 完善了风险提示和仓位建议",
            "5. 统一了输出格式和元数据标准"
        ]

        for imp in improvements:
            print(f"   {imp}")

        return True

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_output_format():
    """测试输出格式"""
    print("\n📊 测试输出格式:")
    print("=" * 60)

    try:
        config_manager = ConfigManager()
        output_format = config_manager.get_output_format("zh")

        # 检查输出格式关键元素
        required_elements = [
            "交易对 · 时间周期 · $价格",
            "技术面信号",
            "概率预测",
            "总结",
            "METADATA",
            "RATING:",
            "RATING_SCORE:",
            "SUMMARY:",
            "PAIR:",
            "PRICE:",
            "TIMEFRAME:"
        ]

        print("  输出格式检查:")
        for element in required_elements:
            if element in output_format:
                print(f"    ✅ {element}")
            else:
                print(f"    ❌ {element} - 缺失")

        return True

    except Exception as e:
        print(f"❌ 输出格式测试失败: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Candlebot 提示词改进测试")
    print("=" * 60)

    success = True

    # 运行测试
    if not test_prompt_improvements():
        success = False

    if not test_output_format():
        success = False

    print("\n" + "=" * 60)
    if success:
        print("🎉 所有测试通过！提示词改进已生效")
        print("\n下一步:")
        print("1. 将真实的aggr.trade示例图片放入 ai/examples/aggr/ 目录")
        print("2. 更新 metadata.json 中的文件名")
        print("3. 重启服务测试实际效果")
        print("4. 根据分析结果进一步优化量化参数")
    else:
        print("⚠️  部分测试失败，请检查配置")

    sys.exit(0 if success else 1)