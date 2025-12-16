#!/usr/bin/env node

/**
 * PR模板解析测试脚本
 * 用于测试PR模板解析功能
 */

// 复制parsePRTemplate函数到这里进行测试
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

// 测试PR模板内容
const testPRBody = `<!-- WEBHOOK_START -->
<!-- 以下信息将被自动解析并推送到webhook系统 -->

## 📋 描述

这是一个测试PR，用于验证webhook系统的PR模板解析功能。

## 🔧 变更类型

请选择所有适用的变更类型：

- [x] 🐛 修复bug
- [x] ✨ 新功能
- [ ] 🎨 UI/样式改进
- [x] 🧪 测试相关

## 🎯 相关问题

- 解决的问题：#[123],[456]
- 关联的任务：#[test-task]

## ✅ 检查清单

请确认以下项目已完成：

- [x] 代码遵循项目的编码规范
- [x] 已添加或更新相关测试
- [ ] 已更新相关文档（如有必要）
- [x] 本地测试通过
- [x] 代码通过ESLint检查

## 📸 截图（如果适用）

测试截图：
- 修复了UI显示问题
- 添加了新的测试用例

## 🔍 测试说明

1. 运行测试脚本
2. 检查解析结果
3. 验证数据保存

## 🚀 部署影响

这个PR是否需要特殊部署步骤？

- [ ] 无需特殊部署
- [x] 需要数据库迁移
- [ ] 需要重启服务
- [x] 其他：更新配置文件

## 💡 其他信息

这是一个自动化测试PR，验证webhook功能是否正常工作。

<!-- WEBHOOK_END -->`;

console.log('🧪 测试PR模板解析功能\n');

const result = parsePRTemplate(testPRBody);

if (result) {
  console.log('✅ 解析成功！');
  console.log('📊 解析结果：\n', JSON.stringify(result, null, 2));

  console.log('\n📈 统计信息：');
  console.log(`- 变更类型数量: ${result.changeTypes.length}`);
  console.log(`- 相关问题数量: ${result.relatedIssues.length}`);
  console.log(`- 检查清单完成项: ${result.checklist.length}/5`);
  console.log(`- 部署影响项数: ${result.deploymentImpact.length}`);

} else {
  console.log('❌ 解析失败：未找到有效的PR模板内容');
}

console.log('\n🎉 测试完成！');
