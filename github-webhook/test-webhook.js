#!/usr/bin/env node

/**
 * GitHub Webhook 测试脚本
 * 用于测试webhook服务器是否正常工作
 */

import fetch from 'node-fetch';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001/webhook';

// 测试数据 - 模拟GitHub webhook payload
const testPayloads = {
  ping: {
    "zen": "Responsive is better than fast.",
    "hook_id": 123456,
    "hook": {
      "type": "Repository",
      "id": 123456,
      "name": "web",
      "active": true,
      "events": ["push", "pull_request"],
      "config": {
        "content_type": "json",
        "url": "http://localhost:3001/webhook"
      }
    },
    "repository": {
      "id": 123456,
      "name": "campus-activity",
      "full_name": "data-coder-xh/campus-activity",
      "owner": {
        "login": "data-coder-xh",
        "id": 12345
      }
    },
    "sender": {
      "login": "test-user",
      "id": 12345
    }
  },

  push: {
    "ref": "refs/heads/main",
    "before": "abc123def456",
    "after": "def456ghi789",
    "repository": {
      "id": 123456,
      "name": "campus-activity",
      "full_name": "data-coder-xh/campus-activity",
      "owner": {
        "login": "data-coder-xh",
        "id": 12345
      }
    },
    "pusher": {
      "name": "test-user",
      "email": "test@example.com"
    },
    "sender": {
      "login": "test-user",
      "id": 12345
    },
    "head_commit": {
      "id": "def456ghi789",
      "message": "feat: 添加新的活动管理功能\n\n- 新增活动统计卡片\n- 优化用户界面\n- 改进响应式设计",
      "author": {
        "name": "Test User",
        "email": "test@example.com"
      },
      "committer": {
        "name": "Test User",
        "email": "test@example.com"
      }
    },
    "commits": [
      {
        "id": "def456ghi789",
        "message": "feat: 添加新的活动管理功能",
        "author": {
          "name": "Test User",
          "email": "test@example.com"
        }
      }
    ]
  },

  pull_request: {
    "action": "opened",
    "number": 42,
    "pull_request": {
      "url": "https://api.github.com/repos/data-coder-xh/campus-activity/pulls/42",
      "id": 123456,
      "number": 42,
      "state": "open",
      "title": "feat: 优化信息管理页面UI",
      "user": {
        "login": "test-user",
        "id": 12345
      },
      "body": `<!-- WEBHOOK_START -->
<!-- 以下信息将被自动解析并推送到webhook系统 -->

## 📋 描述

优化了信息管理页面的UI设计，提升用户体验，添加了现代化的卡片布局和动画效果。

## 🔧 变更类型

请选择所有适用的变更类型：

- [x] 🎨 UI/样式改进
- [x] ✨ 新功能
- [ ] ♻️ 代码重构
- [ ] 📚 文档更新
- [ ] 🧪 测试相关

## 🎯 相关问题

- 解决的问题：#[123]
- 关联的任务：#[ui-optimization]

## ✅ 检查清单

请确认以下项目已完成：

- [x] 代码遵循项目的编码规范
- [x] 已添加或更新相关测试
- [x] 已更新相关文档（如有必要）
- [x] 本地测试通过
- [x] 代码通过ESLint检查

## 📸 截图（如果适用）

UI改进前后对比：
- 优化了统计卡片的设计
- 改进了表格的交互效果
- 添加了响应式布局

## 🔍 测试说明

1. 打开信息管理页面
2. 验证新UI的显示效果
3. 测试响应式布局在不同屏幕尺寸下的表现
4. 确认所有交互功能正常

## 🚀 部署影响

这个PR是否需要特殊部署步骤？

- [x] 无需特殊部署
- [ ] 需要数据库迁移
- [ ] 需要重启服务

## 💡 其他信息

这个PR包含了大量的UI优化，建议在合并后进行一次完整的回归测试。

<!-- WEBHOOK_END -->`,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "merged": false,
      "mergeable": true
    },
    "repository": {
      "id": 123456,
      "name": "campus-activity",
      "full_name": "data-coder-xh/campus-activity",
      "owner": {
        "login": "data-coder-xh",
        "id": 12345
      }
    },
    "sender": {
      "login": "test-user",
      "id": 12345
    }
  },

  issues: {
    "action": "opened",
    "issue": {
      "url": "https://api.github.com/repos/data-coder-xh/campus-activity/issues/1",
      "repository_url": "https://api.github.com/repos/data-coder-xh/campus-activity",
      "labels_url": "https://api.github.com/repos/data-coder-xh/campus-activity/issues/1/labels{/name}",
      "comments_url": "https://api.github.com/repos/data-coder-xh/campus-activity/issues/1/comments",
      "events_url": "https://api.github.com/repos/data-coder-xh/campus-activity/issues/1/events",
      "html_url": "https://github.com/data-coder-xh/campus-activity/issues/1",
      "id": 123456,
      "number": 1,
      "title": "Bug: 活动创建时图片上传失败",
      "user": {
        "login": "test-user",
        "id": 12345
      },
      "labels": [
        {
          "id": 12345,
          "name": "bug",
          "color": "d73a49"
        }
      ],
      "state": "open",
      "locked": false,
      "assignee": null,
      "assignees": [],
      "comments": 0,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "body": "在创建活动时上传图片偶尔会出现失败的情况"
    },
    "repository": {
      "id": 123456,
      "name": "campus-activity",
      "full_name": "data-coder-xh/campus-activity",
      "owner": {
        "login": "data-coder-xh",
        "id": 12345
      }
    },
    "sender": {
      "login": "test-user",
      "id": 12345
    }
  }
};

// 发送测试请求
async function sendTestRequest(eventType, payload) {
  console.log(`\n🧪 发送 ${eventType} 事件测试...`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': eventType,
        'User-Agent': 'GitHub-Webhook-Test/1.0'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log(`📡 响应状态: ${response.status}`);
    console.log(`📄 响应内容: ${result}`);

    if (response.ok) {
      console.log(`✅ ${eventType} 事件测试成功`);
    } else {
      console.log(`❌ ${eventType} 事件测试失败`);
    }

  } catch (error) {
    console.error(`❌ ${eventType} 事件测试错误:`, error.message);
  }
}

// 健康检查
async function healthCheck() {
  console.log('🏥 正在检查webhook服务器健康状态...');

  try {
    const response = await fetch(`${WEBHOOK_URL.replace('/webhook', '/health')}`);
    const result = await response.json();

    console.log(`📡 健康检查状态: ${response.status}`);
    console.log(`📄 响应:`, result);

    if (response.ok && result.status === 'ok') {
      console.log('✅ Webhook服务器运行正常');
      return true;
    } else {
      console.log('❌ Webhook服务器异常');
      return false;
    }

  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const eventType = args[0] || 'all';

  console.log('🎣 GitHub Webhook 测试工具');
  console.log('=' .repeat(50));
  console.log(`🎯 Webhook URL: ${WEBHOOK_URL}`);

  // 先进行健康检查
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.log('\n❌ Webhook服务器未运行，请先启动服务器:');
    console.log('   npm run dev');
    process.exit(1);
  }

  console.log('\n🚀 开始测试...\n');

  if (eventType === 'all') {
    // 测试所有事件类型
    for (const [type, payload] of Object.entries(testPayloads)) {
      await sendTestRequest(type, payload);
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } else if (testPayloads[eventType]) {
    // 测试指定事件类型
    await sendTestRequest(eventType, testPayloads[eventType]);
  } else {
    console.log(`❌ 未知的事件类型: ${eventType}`);
    console.log('📋 支持的事件类型:', Object.keys(testPayloads).join(', '));
    process.exit(1);
  }

  console.log('\n🎉 测试完成！');
  console.log('💡 查看 webhook.log 文件了解详细处理过程');
}

// 运行测试
main().catch(console.error);
