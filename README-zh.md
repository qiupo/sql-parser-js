# SQL Parser JS

[![npm version](https://badge.fury.io/js/sql-parser-ast-js.svg)](https://badge.fury.io/js/sql-parser-ast-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/qiupo/sql-parser-ast-js/workflows/CI/badge.svg)](https://github.com/qiupo/sql-parser-ast-js/actions)
[![Coverage Status](https://coveralls.io/repos/github/qiupo/sql-parser-ast-js/badge.svg?branch=main)](https://coveralls.io/github/qiupo/sql-parser-ast-js?branch=main)

一个强大的 JavaScript SQL 解析器库，支持将常见的 SQL 语句解析为抽象语法树（AST），并提供智能查询分析功能。

## ✨ 特性

- 🚀 **高性能解析** - 优化的词法分析器和解析器，快速处理复杂 SQL 语句
- 🌳 **AST 生成** - 生成结构化的抽象语法树，便于分析和操作
- 🔍 **智能分析** - 内置查询分析器，提供性能优化建议
- 📝 **TypeScript 支持** - 完整的类型定义，提供优秀的开发体验
- 🌐 **跨平台** - 支持浏览器和 Node.js 环境
- 🔧 **零依赖** - 无外部运行时依赖，轻量级设计
- 🧪 **高测试覆盖率** - 超过 80% 的测试覆盖率，确保代码质量
- 🔌 **可扩展** - 支持插件系统，可自定义语法规则

## 📦 安装

### npm
```bash
npm install sql-parser-ast-js
```

### yarn
```bash
yarn add sql-parser-ast-js
```

### CDN
```html
<script src="https://unpkg.com/sql-parser-ast-js@latest/dist/sql-parser.min.js"></script>
```

## 🚀 快速开始

### 基础使用

```javascript
import { parseSQL } from 'sql-parser-ast-js';

// 解析 SELECT 语句
const result = parseSQL('SELECT id, name FROM users WHERE age > 18');

if (result.success) {
    console.log('解析成功！');
    console.log('AST:', result.ast);
    console.log('分析结果:', result.analysis);
} else {
    console.error('解析失败:', result.errors);
}
```

### Node.js 环境

```javascript
const { parseSQL } = require('sql-parser-ast-js');

const sql = `
    SELECT u.id, u.name, p.title 
    FROM users u 
    LEFT JOIN posts p ON u.id = p.user_id 
    WHERE u.active = true 
    ORDER BY u.created_at DESC 
    LIMIT 10
`;

const result = parseSQL(sql);
console.log(JSON.stringify(result.ast, null, 2));
```

### 浏览器环境

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/sql-parser-ast-js@latest/dist/sql-parser.min.js"></script>
</head>
<body>
    <script>
        const result = SQLParser.parseSQL('SELECT * FROM products WHERE price < 100');
        console.log(result);
    </script>
</body>
</html>
```

## 📖 支持的 SQL 语法

### SELECT 语句
```sql
-- 基础查询
SELECT id, name FROM users;

-- 条件查询
SELECT * FROM products WHERE price > 100 AND category = 'electronics';

-- 连接查询
SELECT u.name, p.title 
FROM users u 
INNER JOIN posts p ON u.id = p.user_id;

-- 聚合查询
SELECT category, COUNT(*), AVG(price) 
FROM products 
GROUP BY category 
HAVING COUNT(*) > 5;

-- 排序和限制
SELECT * FROM users 
ORDER BY created_at DESC 
LIMIT 10 OFFSET 20;
```

### INSERT 语句
```sql
-- 单行插入
INSERT INTO users (name, email) VALUES ('张三', 'zhangsan@example.com');

-- 多行插入
INSERT INTO products (name, price, category) VALUES 
    ('iPhone', 999, 'electronics'),
    ('MacBook', 1999, 'electronics');
```

### UPDATE 语句
```sql
-- 条件更新
UPDATE users SET email = 'newemail@example.com' WHERE id = 1;

-- 多字段更新
UPDATE products 
SET price = price * 0.9, updated_at = NOW() 
WHERE category = 'electronics';
```

### DELETE 语句
```sql
-- 条件删除
DELETE FROM users WHERE active = false;

-- 连接删除
DELETE u FROM users u 
LEFT JOIN posts p ON u.id = p.user_id 
WHERE p.id IS NULL;
```

## 🔧 API 参考

### parseSQL(sql, options?)

解析 SQL 语句并返回结果对象。

**参数:**
- `sql` (string): 要解析的 SQL 语句
- `options` (object, 可选): 解析选项
  - `dialect` (string): SQL 方言 ('mysql', 'postgresql', 'sqlite')
  - `strict` (boolean): 严格模式，默认 false
  - `includeComments` (boolean): 包含注释，默认 false

**返回值:**
```typescript
{
  success: boolean;
  ast?: ASTNode;
  errors?: SQLError[];
  analysis?: QueryAnalysis;
}
```

### 示例

```javascript
import { parseSQL } from 'sql-parser-ast-js';

// 基础解析
const result1 = parseSQL('SELECT * FROM users');

// 带选项的解析
const result2 = parseSQL('SELECT * FROM users', {
    dialect: 'mysql',
    strict: true,
    includeComments: true
});

// 错误处理
if (!result2.success) {
    result2.errors.forEach(error => {
        console.error(`错误 ${error.code}: ${error.message}`);
        console.error(`位置: 行 ${error.line}, 列 ${error.column}`);
    });
}
```

## 🎯 高级功能

### 查询分析

```javascript
const result = parseSQL(`
    SELECT u.id, u.name, COUNT(p.id) as post_count
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    WHERE u.created_at > '2023-01-01'
    GROUP BY u.id, u.name
    ORDER BY post_count DESC
`);

if (result.success && result.analysis) {
    console.log('查询类型:', result.analysis.queryType);
    console.log('涉及的表:', result.analysis.tables);
    console.log('使用的列:', result.analysis.columns);
    console.log('性能建议:', result.analysis.suggestions);
}
```

### AST 遍历

```javascript
import { parseSQL, ASTVisitor } from 'sql-parser-ast-js';

const result = parseSQL('SELECT id, name FROM users WHERE age > 18');

if (result.success) {
    const visitor = new ASTVisitor();
    
    visitor.visitSelectStatement = (node) => {
        console.log('发现 SELECT 语句');
        console.log('选择的列:', node.columns);
    };
    
    visitor.visitWhereClause = (node) => {
        console.log('发现 WHERE 条件:', node.condition);
    };
    
    visitor.visit(result.ast);
}
```

### 自定义插件

```javascript
import { parseSQL, registerPlugin } from 'sql-parser-ast-js';

// 注册 MySQL 特定语法插件
registerPlugin('mysql', {
    keywords: ['LIMIT', 'OFFSET'],
    functions: ['NOW()', 'CONCAT()'],
    operators: ['REGEXP', 'RLIKE']
});

const result = parseSQL('SELECT * FROM users WHERE name REGEXP "^[A-Z]"', {
    dialect: 'mysql'
});
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行特定测试套件
npm run test:unit          # 单元测试
npm run test:integration   # 集成测试
npm run test:performance   # 性能测试

# 生成覆盖率报告
npm run test:coverage

# 监听模式
npm run test:watch
```

## 🏗️ 构建

```bash
# 构建所有版本
npm run build

# 仅构建开发版本
npm run build:dev

# 清理构建文件
npm run clean
```

## 📊 性能

SQL Parser JS 经过性能优化，能够高效处理各种规模的 SQL 语句：

- **小型查询** (< 100 字符): < 1ms
- **中型查询** (100-1000 字符): < 5ms  
- **大型查询** (1000+ 字符): < 20ms
- **内存使用**: 平均每个 AST 节点 < 1KB

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 开发环境设置

1. Fork 并克隆项目
```bash
git clone https://github.com/qiupo/sql-parser-ast-js.git
cd sql-parser-ast-js
```

2. 安装依赖
```bash
npm install
```

3. 运行测试
```bash
npm test
```

4. 开始开发
```bash
npm run dev
```

### 提交代码

1. 创建功能分支
```bash
git checkout -b feature/your-feature-name
```

2. 提交更改
```bash
git commit -m "feat: 添加新功能描述"
```

3. 推送并创建 PR
```bash
git push origin feature/your-feature-name
```

## 📚 文档

- [API 文档](docs/API.md) - 完整的 API 参考
- [示例代码](docs/examples.md) - 实际使用示例
- [开发指南](docs/development.md) - 架构和扩展指南

## 🆕 更新日志

### v1.0.0 (2024-01-XX)

🎉 **首次发布**
- ✅ 支持基本 SQL 语句解析（SELECT、INSERT、UPDATE、DELETE）
- ✅ 生成结构化抽象语法树
- ✅ 内置查询分析器
- ✅ 完整的 TypeScript 类型定义
- ✅ 超过 80% 的测试覆盖率
- ✅ 支持多种构建格式（ES Module、CommonJS、UMD）
- ✅ 浏览器和 Node.js 兼容

查看完整的 [更新日志](CHANGELOG.md)。

## 📞 支持

### 📖 文档和资源
- [API 文档](docs/API.md) - 完整的接口说明
- [使用示例](docs/examples.md) - 实际应用场景
- [开发指南](docs/development.md) - 架构和扩展

### 🐛 问题反馈
- [Bug 报告](https://github.com/qiupo/sql-parser-ast-js/issues/new?template=bug_report.md) - 报告问题
- [功能请求](https://github.com/qiupo/sql-parser-ast-js/issues/new?template=feature_request.md) - 建议新功能
- [讨论区](https://github.com/qiupo/sql-parser-ast-js/discussions) - 社区讨论

### 💬 联系方式
- GitHub Issues: 技术问题和 Bug 报告
- Email: your.email@example.com
- 微信群: 扫描二维码加入开发者群

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🌟 致谢

感谢所有为这个项目做出贡献的开发者！

---

如果这个项目对您有帮助，请给我们一个 ⭐️！

**由 [qiupo](https://github.com/qiupo) 用 ❤️ 制作**