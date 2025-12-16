# 🎣 GitHub Webhook 处理器

为校园活动管理系统设计的GitHub Webhook自动化处理器，支持代码部署、事件通知等功能。

## 📋 功能特性

- ✅ **自动部署** - 推送代码到主分支时自动部署
- 📢 **事件通知** - 支持PR、Issue、Release等事件通知
- 🔐 **安全验证** - GitHub签名验证，确保请求安全
- 📝 **详细日志** - 完整的事件记录和错误追踪
- 🚀 **易于扩展** - 支持自定义事件处理和通知方式
- 🐳 **Docker支持** - 可容器化部署

## 🚀 快速开始

### 1. 安装依赖

```bash
cd github-webhook
npm install
```

### 2. 配置环境变量

```bash
# 自动生成环境变量配置
./setup-env.sh

# 或手动配置
cp env-template .env
nano .env
```

**重要**: 必须设置 `GITHUB_WEBHOOK_SECRET`，这是GitHub用于签名验证webhook请求的安全密钥。

### 3. 设置ngrok内网穿透

**重要**：GitHub无法访问localhost，需要使用ngrok将本地服务器暴露到公网：

```bash
# 安装ngrok
brew install ngrok/ngrok/ngrok

# 或手动下载：https://ngrok.com/download

# 登录ngrok（获取token：https://dashboard.ngrok.com/get-started/your-authtoken）
ngrok authtoken YOUR_AUTH_TOKEN

# 启动内网穿透（映射本地3001端口）
./setup-ngrok.sh
```

启动后会显示类似这样的公网URL：
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3001
```

### 4. 配置GitHub Webhook

1. 进入你的GitHub仓库
2. 点击 **Settings** → **Webhooks** → **Add webhook**
3. 填写以下信息：
   - **Payload URL**: `https://abc123.ngrok.io/webhook` （使用ngrok提供的URL）
   - **Content type**: `application/json`
   - **Secret**: 与 `.env` 中的 `GITHUB_WEBHOOK_SECRET` 一致
   - **Which events**: 根据需要选择（推荐选择"Send me everything"）
4. 点击 **Add webhook**

### 5. 启动服务器

```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start

# 使用PM2管理（推荐）
npm install -g pm2
pm2 start webhook-server.js --name github-webhook
```

## ⚙️ 配置说明

### 必需配置

```env
# Webhook服务器端口
WEBHOOK_PORT=3001

# GitHub Webhook Secret（必须与GitHub设置中的Secret一致）
GITHUB_WEBHOOK_SECRET=your_secret_here
```

### 可选配置

```env
# 部署配置
DEPLOY_ENABLED=true
DEPLOY_BRANCH=main

# 通知配置（选择需要的通知方式）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/...
```

## 🎯 支持的事件类型

| 事件类型 | 描述 | 处理逻辑 |
|---------|------|---------|
| `push` | 代码推送 | 自动部署（仅主分支） |
| `pull_request` | PR操作 | 解析PR模板，发送增强通知，保存PR数据 |
| `issues` | Issue操作 | 发送通知 |
| `release` | 版本发布 | 发送通知 |
| `其他` | 其他事件 | 记录日志 |

## 📋 PR模板自动解析

当PR使用项目标准的PR模板时，webhook会自动解析PR中的结构化信息，实现PR信息的自动化管理和通知。

### 🎯 解析的内容

1. **📋 描述** - PR的详细说明文字
2. **🔧 变更类型** - 标记的变更类别（bug修复、新功能、UI改进等）
3. **🎯 相关问题** - 关联的issue编号
4. **✅ 检查清单** - 完成的检查项（代码规范、测试、文档等）
5. **🔍 测试说明** - 测试方法和步骤
6. **🚀 部署影响** - 特殊部署需求的评估

### 📢 增强通知

当PR创建时，webhook会发送包含丰富信息的通知：

```
📝 新PR创建 - PR #42: 优化信息管理页面UI
👤 创建者: test-user
🔧 变更类型: 🎨 UI/样式改进, ✨ 新功能
🎯 解决的问题: #123
✅ 检查清单: 100% 完成
```

### 📊 数据查看

#### 命令行查看
```bash
# 查看PR统计信息
npm run pr-stats

# 查看PR数据列表
npm run pr-data
```

#### API接口
```bash
# 获取PR数据（支持分页和筛选）
curl "http://localhost:3001/pr-data?limit=5&author=test-user"

# 获取PR统计信息
curl "http://localhost:3001/pr-stats"
```

### 💾 数据存储

PR数据保存在 `pr-data.jsonl` 文件中，每行一个JSON记录：

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "prNumber": 42,
  "prTitle": "feat: 优化信息管理页面UI",
  "author": "test-user",
  "action": "opened",
  "templateData": {
    "description": "优化了信息管理页面...",
    "changeTypes": [{"emoji": "🎨", "text": "UI/样式改进"}],
    "relatedIssues": ["123"],
    "checklist": ["代码规范", "测试", "文档"],
    "deploymentImpact": []
  },
  "repository": "data-coder-xh/campus-activity"
}
```

### 🎨 PR模板使用指南

#### 正确填写模板

1. **选择变更类型**：在对应的复选框中打勾 `[x]`
2. **关联问题**：使用格式 `#issue_number`
3. **完成检查清单**：确认所有必备项已完成
4. **详细描述**：提供清晰的变更说明
5. **测试说明**：详细说明如何测试变更

#### 示例PR描述

```markdown
## 📋 描述

修复了用户登录时的验证错误，提升了安全性。

## 🔧 变更类型

- [x] 🐛 修复bug
- [x] 🔒 安全改进

## 🎯 相关问题

- 解决的问题：#[456]

## ✅ 检查清单

- [x] 代码遵循项目的编码规范
- [x] 已添加或更新相关测试
- [x] 本地测试通过
- [x] 代码通过ESLint检查
```

#### 模板标记说明

PR模板使用特殊的HTML注释标记来标识可解析的内容：

```markdown
<!-- WEBHOOK_START -->
<!-- 以下信息将被自动解析并推送到webhook系统 -->

[你的PR模板内容]

<!-- WEBHOOK_END -->
```

只有在这个标记之间的内容会被解析，其他内容会被忽略。

### 🔧 自定义配置

#### 修改解析规则

在 `webhook-server.js` 的 `parsePRTemplate` 函数中添加新的字段解析：

```javascript
// 添加新的字段解析
const customMatch = templateContent.match(/## 🎯 自定义字段\s*\n\n([^#]+)/);
if (customMatch) {
  parsed.customField = customMatch[1].trim();
}
```

#### 添加通知渠道

在 `sendNotification` 函数中集成新的通知方式：

```javascript
// 发送到企业微信
function sendWechatMessage(message) {
  // 实现企业微信通知逻辑
}

// 在sendNotification中调用
if (process.env.WECHAT_WEBHOOK_URL) {
  sendWechatMessage(message);
}
```

### 🧪 测试功能

```bash
# 测试PR模板解析功能
npm run test:pr-parsing

# 测试完整PR事件
npm run test:pr
```

## 📁 文件结构

```
github-webhook/
├── webhook-server.js    # 主服务器文件
├── deploy.sh           # 部署脚本
├── test-webhook.js     # Webhook测试脚本
├── test-pr-parsing.js  # PR解析测试脚本
├── setup-ngrok.sh      # ngrok设置脚本
├── package.json        # Node.js配置
├── env-template        # 环境变量模板
├── README.md          # 说明文档
├── start.sh           # 启动脚本
├── webhook.log        # Webhook日志（自动生成）
├── notifications.log  # 通知日志（自动生成）
└── pr-data.jsonl      # PR数据存储（自动生成）
```

## 🔧 自定义开发

### 添加新事件处理器

在 `webhook-server.js` 中的 `eventHandlers` 对象中添加新的处理器：

```javascript
eventHandlers.your_event = (payload) => {
  console.log('收到自定义事件');
  // 处理逻辑
  sendNotification('your_event', payload, '自定义消息');
};
```

### 集成通知服务

在 `sendNotification` 函数中添加新的通知方式：

```javascript
function sendNotification(eventType, payload, customMessage) {
  // 邮件通知
  if (process.env.SMTP_HOST) {
    sendEmail(eventType, payload, customMessage);
  }

  // Slack通知
  if (process.env.SLACK_WEBHOOK_URL) {
    sendSlackMessage(eventType, payload, customMessage);
  }

  // 企业微信通知
  if (process.env.WECHAT_WEBHOOK_URL) {
    sendWechatMessage(eventType, payload, customMessage);
  }
}
```

## 🐳 Docker部署

### Dockerfile 示例

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  webhook:
    build: .
    ports:
      - "3001:3001"
    environment:
      - GITHUB_WEBHOOK_SECRET=your_secret
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

## 🔍 监控和调试

### 查看日志

```bash
# 查看webhook日志
npm run logs

# 查看通知日志
tail -f notifications.log

# 查看错误日志
tail -f webhook.log | grep "ERROR"
```

### 健康检查

```bash
curl http://localhost:3001/health
```

### 测试webhook

使用GitHub的webhook测试工具或手动发送测试请求：

```bash
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -d '{"test": "data"}'
```

## 🔒 安全说明

1. **签名验证**：务必设置 `GITHUB_WEBHOOK_SECRET` 并启用签名验证
2. **网络安全**：建议使用HTTPS和防火墙限制访问
3. **访问控制**：只监听必要的GitHub事件
4. **日志安全**：敏感信息不要记录到日志中

## 🐛 故障排除

### 常见问题

**Q: GitHub无法访问我的localhost怎么办？**
A: 需要使用ngrok进行内网穿透：
```bash
# 安装ngrok
brew install ngrok/ngrok/ngrok

# 登录ngrok（获取token：https://dashboard.ngrok.com/get-started/your-authtoken）
ngrok authtoken YOUR_AUTH_TOKEN

# 启动内网穿透
./setup-ngrok.sh
```
然后在GitHub webhook配置中使用ngrok提供的公网URL。

**Q: ngrok显示"not authenticated"？**
A: 重新设置认证令牌：
```bash
ngrok authtoken YOUR_AUTH_TOKEN
```

**Q: ngrok连接超时或不稳定？**
A: 检查网络连接，尝试更换ngrok区域：
```bash
ngrok http 3001 --region=ap  # 亚洲区域
```

**Q: Webhook没有触发？**
A: 检查GitHub webhook配置和服务器网络连通性，确认ngrok正常运行

**Q: 签名验证失败？**
A: 确认 `GITHUB_WEBHOOK_SECRET` 与GitHub设置一致

**Q: PR信息没有被解析？**
A: 检查PR模板是否使用了正确的 `<!-- WEBHOOK_START -->` 和 `<!-- WEBHOOK_END -->` 标记

**Q: 部署脚本执行失败？**
A: 检查脚本权限和依赖环境

**Q: 日志文件过大？**
A: 运行 `npm run clean` 清理日志

## 📞 支持

如果遇到问题，请：

1. 查看日志文件获取详细错误信息
2. 检查GitHub webhook交付状态
3. 查看服务器网络和防火墙配置
4. 提交Issue到项目仓库

## 📝 更新日志

### v1.1.0
- 📋 统一文档结构：将所有说明文档合并到README.md中
- 🌐 完善ngrok内网穿透设置指南
- 🔧 增强PR模板解析功能和使用指南
- 📊 添加PR数据统计和API接口
- 🧪 新增PR解析测试脚本

### v1.0.0
- 初始版本发布
- 支持基础的GitHub事件处理
- 自动部署功能
- 多种通知方式集成

---

🎓 **校园活动管理系统** - 让代码协作更高效！
