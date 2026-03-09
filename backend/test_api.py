#!/usr/bin/env python3
"""
Candlebot API 测试脚本
"""
import requests
import json
import base64
import sys

# 配置
BASE_URL = "http://localhost:8000"  # 修改为实际API地址
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"

def print_response(response, description=""):
    """打印响应信息"""
    print(f"\n{'='*60}")
    if description:
        print(f"{description}")
        print(f"{'-'*60}")

    print(f"状态码: {response.status_code}")
    print(f"响应头: {dict(response.headers)}")

    try:
        data = response.json()
        print(f"响应体: {json.dumps(data, indent=2, ensure_ascii=False)}")
    except:
        print(f"响应体: {response.text[:500]}")

def test_auth():
    """测试认证API"""
    print("测试认证API...")

    # 1. 注册用户
    print("\n1. 注册用户")
    register_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "username": "测试用户"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print_response(response, "注册响应")

    # 2. 登录
    print("\n2. 用户登录")
    login_data = {
        "username": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    print_response(response, "登录响应")

    if response.status_code == 200:
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. 获取用户信息
        print("\n3. 获取当前用户信息")
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print_response(response, "用户信息")

        return headers
    else:
        print("登录失败，跳过后续测试")
        return None

def test_analysis(headers):
    """测试分析API"""
    if not headers:
        print("未提供认证头，跳过分析测试")
        return

    print("\n测试分析API...")

    # 1. 获取分析历史
    print("\n1. 获取分析历史")
    response = requests.get(f"{BASE_URL}/analysis/history", headers=headers, params={"page": 1, "per_page": 5})
    print_response(response, "分析历史")

    # 2. 获取统计信息
    print("\n2. 获取分析统计")
    response = requests.get(f"{BASE_URL}/analysis/stats/summary", headers=headers)
    print_response(response, "分析统计")

def test_conversation(headers):
    """测试对话API"""
    if not headers:
        print("未提供认证头，跳过对话测试")
        return

    print("\n测试对话API...")

    # 注意：需要先有分析记录才能测试对话
    print("注意：需要先有分析记录才能测试对话API")
    print("跳过对话测试，需要实际的分析记录ID")

def test_health():
    """测试健康检查"""
    print("\n测试健康检查API...")
    response = requests.get(f"{BASE_URL}/health")
    print_response(response, "健康检查")

def test_root():
    """测试根端点"""
    print("\n测试根端点...")
    response = requests.get(BASE_URL)
    print_response(response, "根端点")

def main():
    """主测试函数"""
    print("Candlebot API 测试")
    print(f"API地址: {BASE_URL}")
    print("="*60)

    try:
        # 测试基础API
        test_root()
        test_health()

        # 测试认证API
        headers = test_auth()

        # 测试其他API（需要认证）
        if headers:
            test_analysis(headers)
            test_conversation(headers)

        print("\n" + "="*60)
        print("测试完成！")

    except requests.exceptions.ConnectionError:
        print(f"\n错误：无法连接到 {BASE_URL}")
        print("请确保后端服务正在运行")
        sys.exit(1)
    except Exception as e:
        print(f"\n测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()