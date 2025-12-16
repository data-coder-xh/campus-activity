#!/bin/bash

# GitHub Webhook 启动脚本

echo "🚀 启动GitHub Webhook服务器..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 github-webhook 目录下运行此脚本"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查环境变量
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，使用默认配置"
    echo "💡 建议复制 env-template 为 .env 并配置相关参数"
fi

# 检查必需的环境变量
if [ -z "$GITHUB_WEBHOOK_SECRET" ]; then
    echo "⚠️  未设置 GITHUB_WEBHOOK_SECRET 环境变量"
    echo "🔐 建议设置webhook签名验证以提高安全性"
fi

# 启动服务器
echo "🎯 启动webhook服务器..."
npm start
