#!/bin/bash

# GitHub Webhook 自动部署脚本
# 用于校园活动管理系统

set -e  # 遇到错误立即退出

echo "🚀 开始自动部署..."

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT"

echo "📁 项目目录: $PROJECT_ROOT"
echo "📁 后端目录: $BACKEND_DIR"

# 检查是否在主分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🌿 当前分支: $CURRENT_BRANCH"

if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    echo "⚠️  非主分支，跳过部署"
    exit 0
fi

# 进入项目目录
cd "$PROJECT_ROOT"

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin $CURRENT_BRANCH

# 检查是否有新的提交
if git diff --quiet HEAD~1; then
    echo "ℹ️  没有代码变更，跳过部署"
    exit 0
fi

# 后端部署
echo "🔧 部署后端服务..."
cd "$BACKEND_DIR"

# 安装依赖（如果需要）
if [ -f "package-lock.json" ]; then
    echo "📦 安装后端依赖..."
    npm ci
fi

# 构建应用（如果有构建步骤）
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    echo "🏗️  构建后端..."
    npm run build
fi

# 重启后端服务（假设使用PM2）
if command -v pm2 &> /dev/null; then
    echo "🔄 重启后端服务..."
    pm2 restart campus-activity-backend || pm2 start app.js --name campus-activity-backend
elif [ -f "app.js" ]; then
    # 如果没有PM2，使用node直接启动
    echo "▶️  启动后端服务..."
    # 这里可以添加进程管理逻辑
    echo "✅ 后端部署完成"
fi

# 前端部署
echo "🎨 部署前端..."
cd "$FRONTEND_DIR"

# 安装依赖
if [ -f "package-lock.json" ]; then
    echo "📦 安装前端依赖..."
    npm ci
fi

# 构建前端
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    echo "🏗️  构建前端..."
    npm run build
fi

# 如果有静态文件部署逻辑，可以在这里添加
# 例如：复制dist文件到nginx目录，重新加载nginx等

echo "✅ 部署完成！"
echo "🎉 校园活动管理系统已更新"

# 发送部署成功通知（可选）
# 这里可以添加curl命令调用通知API

exit 0
