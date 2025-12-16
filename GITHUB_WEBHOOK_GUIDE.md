# 🚀 GitHub Webhook 配置指南

**📍 重要更新**: 所有详细文档已统一合并到 `github-webhook/README.md` 中。

## 📁 快速访问

```bash
# 查看完整文档
cat github-webhook/README.md

# 或在浏览器中查看
open github-webhook/README.md
```

## ⚡ 快速开始（5步）

### 1. 配置环境变量

```bash
cd github-webhook
cp env-template .env
# 编辑 .env 文件，设置 GITHUB_WEBHOOK_SECRET
```

### 2. 安装依赖

```bash
npm install
```

### 3. 设置ngrok内网穿透

```bash
# 安装ngrok
brew install ngrok/ngrok/ngrok

# 登录ngrok
ngrok authtoken 36uUjdymkhwemaBl091bDDkVMct_2PtEJ6nZdqXMiAiz2HGDm

# 启动内网穿透
./setup-ngrok.sh
```

### 4. 配置GitHub Webhook

在GitHub仓库设置中使用ngrok提供的URL：
- **URL**: `https://abc123.ngrok.io/webhook`

### 5. 测试功能

```bash
# 测试PR模板解析
npm run test:pr-parsing

# 测试webhook功能
npm run test:pr
```

## 📖 完整文档

详细的使用指南、配置说明、故障排除等内容请查看：

**📄 `github-webhook/README.md`**

该文档包含：
- 🚀 完整的快速开始指南
- ⚙️ 详细的配置说明
- 📋 PR模板自动解析功能
- 🐳 Docker部署指南
- 🔍 监控和调试方法
- 🐛 故障排除指南
- 🔧 自定义开发说明

---

🎓 **GitHub Webhook系统已经完全设置好，现在就开始使用吧！**
