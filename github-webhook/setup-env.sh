#!/bin/bash

# GitHub Webhook 环境变量设置脚本

echo "🔧 设置GitHub Webhook环境变量"

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -f "webhook-server.js" ]; then
    echo "❌ 请在 github-webhook 目录下运行此脚本"
    exit 1
fi

# 检查是否已有.env文件
if [ -f ".env" ]; then
    echo "📄 发现现有的 .env 文件"
    read -p "是否要重新生成? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ 保持现有配置"
        exit 0
    fi
fi

echo "🔑 生成GitHub Webhook Secret..."

# 生成一个32字节的随机字符串作为webhook secret
if command -v openssl &> /dev/null; then
    WEBHOOK_SECRET=$(openssl rand -hex 32)
elif command -v node &> /dev/null; then
    WEBHOOK_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
else
    # 最后的备选方案
    WEBHOOK_SECRET=$(date +%s%N | sha256sum | head -c 64)
fi

echo "🔐 生成的Webhook Secret: $WEBHOOK_SECRET"

# 创建.env文件
cat > .env << EOF
# GitHub Webhook 配置
# 此文件包含敏感信息，请勿提交到版本控制系统

# Webhook服务器端口
WEBHOOK_PORT=3001

# GitHub Webhook Secret (必须设置，用于验证签名)
# 在GitHub仓库设置 -> Webhooks -> Add webhook -> Secret 中使用此值
GITHUB_WEBHOOK_SECRET=${WEBHOOK_SECRET}

# 部署相关配置（可选）
DEPLOY_ENABLED=true
DEPLOY_BRANCH=main

# 通知配置（可选）
# Slack通知
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# 企业微信通知
# WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/...
EOF

echo "✅ .env 文件已创建"
echo ""
echo "📋 请复制以下信息到GitHub Webhook设置中："
echo "   Secret: ${WEBHOOK_SECRET}"
echo ""
echo "🔄 请重启webhook服务器以应用新配置："
echo "   npm run dev"
echo ""
echo "⚠️  重要提醒："
echo "   - 妥善保管 .env 文件，不要提交到Git"
echo "   - 定期更换webhook secret以增强安全性"
