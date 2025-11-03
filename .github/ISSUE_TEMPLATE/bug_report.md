---
name: Bug 报告
about: 创建一个 bug 报告来帮助我们改进
title: '[BUG] '
labels: 'bug'
assignees: ''

---

## 🐛 Bug 描述
简洁明了地描述这个 bug。

## 🔄 复现步骤
复现该行为的步骤：
1. 执行 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## ✅ 期望行为
简洁明了地描述您期望发生的事情。

## 📸 截图
如果适用，请添加截图来帮助解释您的问题。

## 🖥️ 环境信息
**桌面环境 (请填写以下信息):**
 - 操作系统: [例如 iOS]
 - 浏览器: [例如 chrome, safari]
 - 版本: [例如 22]

**Node.js 环境 (请填写以下信息):**
 - Node.js 版本: [例如 18.17.0]
 - npm 版本: [例如 9.6.7]
 - sql-parser-js 版本: [例如 1.0.0]

## 📝 SQL 语句
如果 bug 与特定的 SQL 语句相关，请提供：

```sql
-- 您的 SQL 语句
SELECT * FROM users WHERE id = 1;
```

## 💻 代码示例
如果适用，请添加代码示例来重现问题：

```javascript
import { parseSQL } from 'sql-parser-js';

const result = parseSQL('您的SQL语句');
console.log(result);
```

## 📋 错误信息
如果有错误信息，请完整地粘贴在这里：

```
错误信息内容
```

## 🔍 附加信息
在此处添加有关该问题的任何其他信息。