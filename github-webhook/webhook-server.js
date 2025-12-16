import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;

// GitHub Webhook Secret (需要在环境变量中设置)
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.warn('⚠️  警告: 未设置 GITHUB_WEBHOOK_SECRET 环境变量');
  console.warn('🔐 建议设置webhook签名验证以提高安全性');
  console.warn('📝 设置方法: 在 .env 文件中添加 GITHUB_WEBHOOK_SECRET=your_secret_here');
}

// 中间件：验证GitHub webhook签名
function verifySignature(req, res, buf) {
  // 如果没有设置secret，跳过签名验证
  if (!WEBHOOK_SECRET) {
    console.log('⏭️  跳过签名验证（未设置GITHUB_WEBHOOK_SECRET）');
    return;
  }

  const signature = req.get('X-Hub-Signature-256');
  if (!signature) {
    console.error('❌ 未找到签名头');
    return;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(buf)
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');

    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    )) {
      console.error('❌ 签名验证失败');
      throw new Error('Invalid signature');
    }

    console.log('✅ 签名验证通过');
  } catch (error) {
    console.error('❌ 签名验证错误:', error.message);
    throw error;
  }
}

// 使用原始body解析器（用于签名验证）
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.get('X-Hub-Signature-256')) {
      verifySignature(req, res, buf);
    }
  }
}));

// 日志记录器
function logEvent(eventType, payload) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    repository: payload.repository?.full_name,
    sender: payload.sender?.login,
    action: payload.action,
    ref: payload.ref,
    head_commit: payload.head_commit?.message
  };

  console.log(`📝 [${timestamp}] ${eventType}:`, JSON.stringify(logEntry, null, 2));

  // 记录到文件
  const logFile = path.join(__dirname, 'webhook.log');
  const logLine = `[${timestamp}] ${eventType} - ${payload.repository?.full_name} - ${payload.sender?.login}\n`;
  fs.appendFileSync(logFile, logLine);

  // 如果是PR事件且包含模板信息，单独保存PR数据
  if (eventType === 'pull_request' && payload.pull_request?.body) {
    const templateData = parsePRTemplate(payload.pull_request.body);
    if (templateData) {
      const prDataFile = path.join(__dirname, 'pr-data.jsonl');
      const prRecord = {
        timestamp,
        prNumber: payload.pull_request.number,
        prTitle: payload.pull_request.title,
        author: payload.pull_request.user?.login,
        action: payload.action,
        templateData,
        repository: payload.repository?.full_name
      };
      fs.appendFileSync(prDataFile, JSON.stringify(prRecord) + '\n');
    }
  }
}

// 执行部署脚本
function executeDeployScript() {
  return new Promise((resolve, reject) => {
    const deployScript = path.join(__dirname, 'deploy.sh');

    if (!fs.existsSync(deployScript)) {
      console.log('⚠️ 部署脚本不存在，跳过部署');
      resolve();
      return;
    }

    console.log('🚀 开始执行部署脚本...');

    exec(`bash ${deployScript}`, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ 部署失败:', error);
        reject(error);
        return;
      }

      console.log('✅ 部署成功');
      if (stdout) console.log('📄 部署输出:', stdout);
      if (stderr) console.warn('⚠️ 部署警告:', stderr);

      resolve({ stdout, stderr });
    });
  });
}

// 解析PR模板信息
function parsePRTemplate(prBody) {
  if (!prBody) return null;

  // 提取webhook标记之间的内容
  const webhookMatch = prBody.match(/<!-- WEBHOOK_START -->([\s\S]*?)<!-- WEBHOOK_END -->/);
  if (!webhookMatch) return null;

  const templateContent = webhookMatch[1];
  const parsed = {
    description: '',
    changeTypes: [],
    relatedIssues: [],
    relatedTasks: [],
    checklist: [],
    screenshots: '',
    testInstructions: '',
    deploymentImpact: [],
    additionalInfo: ''
  };

  // 解析描述
  const descMatch = templateContent.match(/## 📋 描述\s*\n\n([^#]+)/);
  if (descMatch) {
    parsed.description = descMatch[1].trim();
  }

  // 解析变更类型
  const changeTypeMatches = templateContent.match(/- \[x\] ([^\n]+)/g);
  if (changeTypeMatches) {
    parsed.changeTypes = changeTypeMatches.map(match => {
      const type = match.replace('- [x] ', '');
      // 提取emoji和文字
      const emojiMatch = type.match(/^(\p{Emoji}) (.+)$/u);
      return emojiMatch ? { emoji: emojiMatch[1], text: emojiMatch[2] } : { text: type };
    });
  }

  // 解析相关问题
  const issueMatch = templateContent.match(/- 解决的问题：#\[([^\]]+)\]/);
  if (issueMatch) {
    parsed.relatedIssues = issueMatch[1].split(',').map(s => s.trim());
  }

  const taskMatch = templateContent.match(/- 关联的任务：#\[([^\]]+)\]/);
  if (taskMatch) {
    parsed.relatedTasks = taskMatch[1].split(',').map(s => s.trim());
  }

  // 解析检查清单
  const checklistMatches = templateContent.match(/- \[x\] ([^\n]+)/g);
  if (checklistMatches) {
    // 过滤掉变更类型，只保留检查清单项
    parsed.checklist = checklistMatches
      .filter(match => !match.includes('🐛') && !match.includes('✨') && !match.includes('🎨'))
      .map(match => match.replace('- [x] ', ''));
  }

  // 解析截图
  const screenshotMatch = templateContent.match(/## 📸 截图.*?\n\n([^#]+)/s);
  if (screenshotMatch) {
    parsed.screenshots = screenshotMatch[1].trim();
  }

  // 解析测试说明
  const testMatch = templateContent.match(/## 🔍 测试说明\s*\n\n([^#]+)/);
  if (testMatch) {
    parsed.testInstructions = testMatch[1].trim();
  }

  // 解析部署影响
  const deployMatch = templateContent.match(/- \[x\] ([^\n]+部署[^\n]*)/g);
  if (deployMatch) {
    parsed.deploymentImpact = deployMatch.map(match => match.replace('- [x] ', ''));
  }

  // 解析其他信息
  const infoMatch = templateContent.match(/## 💡 其他信息\s*\n\n([^#]+)/);
  if (infoMatch) {
    parsed.additionalInfo = infoMatch[1].trim();
  }

  return parsed;
}

// 发送通知（可以集成到各种通知服务）
function sendNotification(eventType, payload, customMessage = '') {
  const message = customMessage || `GitHub事件: ${eventType}`;

  // 这里可以集成各种通知服务：
  // - 发送邮件
  // - 发送到Slack/Discord
  // - 发送到企业微信/钉钉
  // - 发送短信等

  console.log(`📤 发送通知: ${message}`);

  // 示例：写入通知日志
  const notificationLog = path.join(__dirname, 'notifications.log');
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${eventType} - ${message}\n`;
  fs.appendFileSync(notificationLog, logEntry);
}

// 处理不同类型的GitHub事件
const eventHandlers = {
  // Push事件 - 代码推送
  push: async (payload) => {
    console.log('🔄 收到push事件');

    const branch = payload.ref.replace('refs/heads/', '');
    const commitMessage = payload.head_commit?.message || '无提交信息';
    const author = payload.head_commit?.author?.name || payload.sender?.login || '未知';

    console.log(`📋 分支: ${branch}`);
    console.log(`👤 作者: ${author}`);
    console.log(`💬 提交信息: ${commitMessage}`);

    // 只在main/master分支上触发部署
    if (branch === 'main' || branch === 'master') {
      console.log('🎯 主分支推送，准备部署...');

      try {
        await executeDeployScript();
        sendNotification('push', payload, `🚀 代码已部署 - ${commitMessage.substring(0, 50)}...`);
      } catch (error) {
        sendNotification('push', payload, `❌ 部署失败 - ${error.message}`);
      }
    } else {
      console.log(`⏭️ 非主分支(${branch})推送，跳过部署`);
    }
  },

  // Pull Request事件
  pull_request: (payload) => {
    console.log('🔄 收到PR事件');

    const action = payload.action;
    const prNumber = payload.pull_request?.number;
    const prTitle = payload.pull_request?.title;
    const author = payload.pull_request?.user?.login;
    const prBody = payload.pull_request?.body || '';

    console.log(`📋 PR #${prNumber}: ${prTitle}`);
    console.log(`👤 创建者: ${author}`);
    console.log(`🎯 操作: ${action}`);

    // 解析PR模板信息
    const templateData = parsePRTemplate(prBody);

    if (templateData) {
      console.log('📝 解析到PR模板信息:');
      console.log(`   描述: ${templateData.description.substring(0, 100)}...`);
      console.log(`   变更类型: ${templateData.changeTypes.map(t => t.text || t).join(', ')}`);
      console.log(`   相关问题: ${templateData.relatedIssues.join(', ')}`);
      console.log(`   检查清单完成: ${templateData.checklist.length} 项`);

      // 验证检查清单
      const totalChecklistItems = 5; // 根据模板定义
      const completedItems = templateData.checklist.length;
      const completionRate = Math.round((completedItems / totalChecklistItems) * 100);

      console.log(`   检查清单完成率: ${completionRate}% (${completedItems}/${totalChecklistItems})`);

      // 检查是否有特殊的部署需求
      if (templateData.deploymentImpact.length > 0) {
        console.log(`   🚨 部署影响: ${templateData.deploymentImpact.join(', ')}`);
      }

      // 生成增强的通知消息
      let enhancedMessage = '';
      const baseMessage = `PR #${prNumber}: ${prTitle}`;

      switch (action) {
        case 'opened':
          enhancedMessage = `📝 新PR创建 - ${baseMessage}\n`;
          enhancedMessage += `👤 创建者: ${author}\n`;
          enhancedMessage += `🔧 变更类型: ${templateData.changeTypes.map(t => t.emoji ? `${t.emoji} ${t.text}` : t.text).join(', ')}\n`;
          if (templateData.relatedIssues.length > 0) {
            enhancedMessage += `🎯 解决的问题: #${templateData.relatedIssues.join(', #')}\n`;
          }
          enhancedMessage += `✅ 检查清单: ${completionRate}% 完成`;
          break;

        case 'closed':
          if (payload.pull_request?.merged) {
            enhancedMessage = `✅ PR合并 - ${baseMessage}\n`;
            enhancedMessage += `👤 合并者: ${author}`;
            if (templateData.deploymentImpact.length > 0) {
              enhancedMessage += `\n🚨 注意部署影响: ${templateData.deploymentImpact.join(', ')}`;
            }
          } else {
            enhancedMessage = `❌ PR关闭 - ${baseMessage}`;
          }
          break;

        case 'reopened':
          enhancedMessage = `🔄 PR重新打开 - ${baseMessage}`;
          break;

        case 'review_requested':
          enhancedMessage = `👀 请求代码审查 - ${baseMessage}\n`;
          enhancedMessage += `🔍 测试说明: ${templateData.testInstructions ? '已提供' : '未提供'}`;
          break;

        default:
          enhancedMessage = `PR ${action} - ${baseMessage}`;
      }

      // 发送增强的通知
      sendNotification('pull_request', payload, enhancedMessage);

      // 如果是PR合并且有部署影响，发送额外警告
      if (action === 'closed' && payload.pull_request?.merged && templateData.deploymentImpact.length > 0) {
        setTimeout(() => {
          sendNotification('pull_request', payload, `🚨 部署警告 - PR #${prNumber} 有特殊部署需求: ${templateData.deploymentImpact.join(', ')}`);
        }, 1000);
      }

    } else {
      // 没有模板信息的标准处理
      const messages = {
        opened: `📝 新PR创建 - #${prNumber} ${prTitle}`,
        closed: payload.pull_request?.merged
          ? `✅ PR合并 - #${prNumber} ${prTitle}`
          : `❌ PR关闭 - #${prNumber} ${prTitle}`,
        reopened: `🔄 PR重新打开 - #${prNumber} ${prTitle}`,
        review_requested: `👀 请求代码审查 - #${prNumber} ${prTitle}`
      };

      sendNotification('pull_request', payload, messages[action] || `PR ${action} - #${prNumber}`);
    }
  },

  // Issues事件
  issues: (payload) => {
    console.log('🔄 收到issue事件');

    const action = payload.action;
    const issueNumber = payload.issue?.number;
    const issueTitle = payload.issue?.title;
    const author = payload.issue?.user?.login;

    console.log(`📋 Issue #${issueNumber}: ${issueTitle}`);
    console.log(`👤 创建者: ${author}`);
    console.log(`🎯 操作: ${action}`);

    const messages = {
      opened: `🐛 新问题 - #${issueNumber} ${issueTitle}`,
      closed: `✅ 问题解决 - #${issueNumber} ${issueTitle}`,
      reopened: `🔄 问题重新打开 - #${issueNumber} ${issueTitle}`
    };

    sendNotification('issues', payload, messages[action] || `Issue ${action} - #${issueNumber}`);
  },

  // Release事件
  release: (payload) => {
    console.log('🔄 收到release事件');

    const action = payload.action;
    const tagName = payload.release?.tag_name;
    const releaseName = payload.release?.name;

    console.log(`🏷️ 标签: ${tagName}`);
    console.log(`📦 发布名称: ${releaseName}`);
    console.log(`🎯 操作: ${action}`);

    if (action === 'published') {
      sendNotification('release', payload, `🚀 新版本发布 - ${tagName} ${releaseName}`);
    }
  },

  // 默认事件处理器
  default: (eventType, payload) => {
    console.log(`🔄 收到未处理的事件: ${eventType}`);
    sendNotification(eventType, payload, `收到GitHub事件: ${eventType}`);
  }
};

// Webhook主端点
app.post('/webhook', (req, res) => {
  try {
    const eventType = req.get('X-GitHub-Event');
    const payload = req.body;

    if (!eventType) {
      console.error('❌ 未找到事件类型');
      return res.status(400).json({ error: 'Missing X-GitHub-Event header' });
    }

    console.log(`\n🎉 ===== 收到GitHub Webhook =====`);
    console.log(`📅 时间: ${new Date().toISOString()}`);
    console.log(`🎯 事件类型: ${eventType}`);
    console.log(`📦 Payload大小: ${JSON.stringify(payload).length} 字符`);

    // 记录事件
    logEvent(eventType, payload);

    // 处理事件
    const handler = eventHandlers[eventType] || eventHandlers.default;
    handler(payload);

    console.log(`✅ ===== Webhook处理完成 =====\n`);

    res.status(200).json({ status: 'ok', event: eventType });

  } catch (error) {
    console.error('❌ Webhook处理错误:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    webhook: 'active'
  });
});

// 获取PR数据端点
app.get('/pr-data', (req, res) => {
  try {
    const prDataFile = path.join(__dirname, 'pr-data.jsonl');
    if (!fs.existsSync(prDataFile)) {
      return res.json({ prs: [], total: 0 });
    }

    const data = fs.readFileSync(prDataFile, 'utf8');
    const lines = data.trim().split('\n').filter(line => line.trim());

    const prs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // 支持查询参数
    const { limit = 10, offset = 0, author, status } = req.query;

    let filteredPrs = prs;

    if (author) {
      filteredPrs = filteredPrs.filter(pr => pr.author === author);
    }

    if (status) {
      filteredPrs = filteredPrs.filter(pr => pr.action === status);
    }

    const startIndex = parseInt(offset) || 0;
    const limitNum = parseInt(limit) || 10;
    const paginatedPrs = filteredPrs.slice(startIndex, startIndex + limitNum);

    res.json({
      prs: paginatedPrs,
      total: filteredPrs.length,
      limit: limitNum,
      offset: startIndex,
      hasMore: startIndex + limitNum < filteredPrs.length
    });

  } catch (error) {
    console.error('获取PR数据失败:', error);
    res.status(500).json({ error: '获取PR数据失败', message: error.message });
  }
});

// 获取PR统计信息
app.get('/pr-stats', (req, res) => {
  try {
    const prDataFile = path.join(__dirname, 'pr-data.jsonl');
    if (!fs.existsSync(prDataFile)) {
      return res.json({
        total: 0,
        byAuthor: {},
        byChangeType: {},
        checklistCompletion: 0,
        recentActivity: []
      });
    }

    const data = fs.readFileSync(prDataFile, 'utf8');
    const lines = data.trim().split('\n').filter(line => line.trim());

    const prs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // 按作者统计
    const byAuthor = {};
    const byChangeType = {};
    let totalChecklistItems = 0;
    let completedChecklistItems = 0;

    prs.forEach(pr => {
      // 作者统计
      byAuthor[pr.author] = (byAuthor[pr.author] || 0) + 1;

      // 变更类型统计
      if (pr.templateData?.changeTypes) {
        pr.templateData.changeTypes.forEach(type => {
          const typeKey = type.text || type;
          byChangeType[typeKey] = (byChangeType[typeKey] || 0) + 1;
        });
      }

      // 检查清单完成率
      if (pr.templateData?.checklist) {
        totalChecklistItems += 5; // 模板中有5个检查项
        completedChecklistItems += pr.templateData.checklist.length;
      }
    });

    const checklistCompletion = totalChecklistItems > 0
      ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
      : 0;

    // 最近活动（最近10条）
    const recentActivity = prs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(pr => ({
        prNumber: pr.prNumber,
        title: pr.prTitle,
        author: pr.author,
        action: pr.action,
        timestamp: pr.timestamp,
        changeTypes: pr.templateData?.changeTypes || []
      }));

    res.json({
      total: prs.length,
      byAuthor,
      byChangeType,
      checklistCompletion,
      recentActivity
    });

  } catch (error) {
    console.error('获取PR统计失败:', error);
    res.status(500).json({ error: '获取PR统计失败', message: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 GitHub Webhook服务器已启动`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🔐 签名验证: ${WEBHOOK_SECRET ? '已启用' : '未配置'}`);
  console.log(`📋 健康检查: http://localhost:${PORT}/health`);
  console.log(`🎯 Webhook URL: http://your-domain:${PORT}/webhook`);
  console.log(`\n💡 提示: 请在GitHub仓库设置中配置此webhook URL\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭webhook服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 正在关闭webhook服务器...');
  process.exit(0);
});
