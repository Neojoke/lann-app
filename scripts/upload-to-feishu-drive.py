#!/usr/bin/env python3
"""
Lann 项目 - 上传测试视频到飞书云盘
使用方法：python3 upload-to-feishu-drive.py <视频文件> <测试名称> <测试状态>
"""

import os
import sys
import requests
import json
from datetime import datetime

# 飞书 API 配置
FEISHU_APP_ID = os.getenv('FEISHU_APP_ID', '')
FEISHU_APP_SECRET = os.getenv('FEISHU_APP_SECRET', '')
FEISHU_FOLDER_TOKEN = os.getenv('FEISHU_FOLDER_TOKEN', 'root')

def get_access_token():
    """获取飞书访问令牌"""
    url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
    payload = {
        "app_id": FEISHU_APP_ID,
        "app_secret": FEISHU_APP_SECRET
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    
    if result.get('code') == 0:
        return result.get('tenant_access_token')
    else:
        print(f"获取访问令牌失败：{result}")
        return None

def upload_file(token, file_path, file_name, parent_token):
    """上传文件到飞书云盘"""
    
    # 第一步：创建文件上传任务
    create_url = "https://open.feishu.cn/open-apis/drive/v1/files/upload"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    create_payload = {
        "file_name": file_name,
        "parent_type": "folder",
        "parent_node": parent_token
    }
    
    create_response = requests.post(create_url, headers=headers, json=create_payload)
    create_result = create_response.json()
    
    if create_result.get('code') != 0:
        print(f"创建上传任务失败：{create_result}")
        return None
    
    upload_token = create_result.get('data', {}).get('upload_token')
    file_token = create_result.get('data', {}).get('token')
    
    # 第二步：上传文件内容
    if upload_token:
        upload_url = "https://open.feishu.cn/open-apis/drive/v1/files/upload_content"
        upload_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "multipart/form-data"
        }
        
        with open(file_path, 'rb') as f:
            files = {'file': (file_name, f)}
            data = {'upload_token': upload_token}
            
            upload_response = requests.post(upload_url, headers=upload_headers, files=files, data=data)
            upload_result = upload_response.json()
            
            if upload_result.get('code') == 0:
                print(f"✅ 上传成功！")
                print(f"文件 Token: {file_token}")
                print(f"文件名称：{file_name}")
                
                # 生成文件链接
                file_url = f"https://app.feishu.cn/drive/file/{file_token}"
                print(f"文件链接：{file_url}")
                
                return {
                    'file_token': file_token,
                    'file_name': file_name,
                    'file_url': file_url
                }
            else:
                print(f"上传文件内容失败：{upload_result}")
                return None
    
    return None

def main():
    if len(sys.argv) < 2:
        print("使用方法：python3 upload-to-feishu-drive.py <视频文件> [测试名称] [测试状态]")
        print("示例：python3 upload-to-feishu-drive.py video.mp4 register-test PASSED")
        sys.exit(1)
    
    video_file = sys.argv[1]
    test_name = sys.argv[2] if len(sys.argv) > 2 else "E2E Test"
    test_status = sys.argv[3] if len(sys.argv) > 3 else "UNKNOWN"
    
    # 检查文件是否存在
    if not os.path.exists(video_file):
        print(f"❌ 文件不存在：{video_file}")
        sys.exit(1)
    
    # 生成文件名
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_name = f"{test_name}_{test_status}_{timestamp}.mp4"
    
    print(f"📤 开始上传视频到飞书云盘...")
    print(f"文件：{video_file}")
    print(f"目标文件名：{file_name}")
    print("")
    
    # 获取访问令牌
    print("🔑 获取访问令牌...")
    token = get_access_token()
    
    if not token:
        print("❌ 无法获取访问令牌，请检查 FEISHU_APP_ID 和 FEISHU_APP_SECRET 环境变量")
        print("")
        print("配置方法:")
        print("export FEISHU_APP_ID='your_app_id'")
        print("export FEISHU_APP_SECRET='your_app_secret'")
        sys.exit(1)
    
    # 上传文件
    print("☁️ 上传文件...")
    result = upload_file(token, video_file, file_name, FEISHU_FOLDER_TOKEN)
    
    if result:
        print("")
        print("✅ 上传完成！")
        print(f"文件链接：{result['file_url']}")
        
        # 输出 JSON 结果供脚本使用
        print("")
        print("JSON 结果:")
        print(json.dumps(result, indent=2))
    else:
        print("")
        print("❌ 上传失败")
        sys.exit(1)

if __name__ == '__main__':
    main()
