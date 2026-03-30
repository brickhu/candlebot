#!/usr/bin/env python3
"""
测试修复后的analysis/history接口
"""
import sys
import os
sys.path.append('backend')

from fastapi.testclient import TestClient
from main import app
import json

# 创建测试客户端
client = TestClient(app)

def test_analysis_history():
    """测试分析历史接口"""
    print("测试修复后的分析历史接口...")

    # 首先登录获取token
    login_data = {
        "email": "test@example.com",
        "password": "test123"
    }

    print("1. 登录...")
    response = client.post("/auth/login-json", json=login_data)
    if response.status_code != 200:
        print(f"登录失败: {response.status_code}")
        print(response.text)
        return False

    token_data = response.json()
    token = token_data["access_token"]
    print(f"登录成功，token: {token[:30]}...")

    # 测试历史接口
    print("\n2. 测试分析历史接口...")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/analysis/history", headers=headers)

    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 历史接口成功!")
        print(f"   总记录数: {data['total']}")
        print(f"   返回记录数: {len(data['items'])}")

        # 显示记录详情
        if data['items']:
            print(f"\n   第一条记录详情:")
            first_item = data['items'][0]
            print(f"     ID: {first_item['id']}")
            print(f"     平台: {first_item['platform']}")
            print(f"     交易对: {first_item['analysis_metadata']['pair']}")
            print(f"     可见性: {first_item.get('visibility', 'private')}")
            print(f"     创建时间: {first_item['created_at']}")

        return True
    else:
        print(f"历史接口失败: {response.text}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("测试修复后的analysis/history接口")
    print("=" * 60)

    success = test_analysis_history()

    print("\n" + "=" * 60)
    if success:
        print("✅ 测试通过!")
    else:
        print("❌ 测试失败")
    print("=" * 60)