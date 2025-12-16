#!/bin/bash

# GitHub Webhook ngrok 设置脚本

echo "🚀 设置GitHub Webhook ngrok内网穿透"

# 检查ngrok是否安装
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安装"
    echo "请访问 https://ngrok.com 下载并安装ngrok"
    echo "安装命令："
    echo "  macOS: brew install ngrok/ngrok/ngrok"
    echo "  或下载二进制文件到 /usr/local/bin/ngrok"
    exit 1
fi

# 检查ngrok是否已登录
if ! ngrok config check &> /dev/null; then
    echo "⚠️  ngrok 未登录，请先运行："
    echo "  ngrok authtoken YOUR_AUTH_TOKEN"
    echo "  (在 https://dashboard.ngrok.com/get-started/your-authtoken 获取token)"
    exit 1
fi

# 检查webhook服务器是否运行
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "⚠️  Webhook服务器未运行，请先启动："
    echo "  cd github-webhook && npm run dev"
    exit 1
fi

echo "✅ 环境检查通过"
echo "🌐 启动ngrok内网穿透..."

# 启动ngrok，映射本地3001端口到公网
ngrok http 3001

echo "🎉 ngrok已启动！"
echo "📋 现在你可以在GitHub webhook设置中使用上面的公网URL"
