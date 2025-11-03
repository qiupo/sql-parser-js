# SQL Parser JS

[![npm version](https://badge.fury.io/js/sql-parser-js.svg)](https://badge.fury.io/js/sql-parser-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/yourusername/sql-parser-js/workflows/CI/badge.svg)](https://github.com/yourusername/sql-parser-js/actions)
[![Coverage Status](https://coveralls.io/repos/github/yourusername/sql-parser-js/badge.svg?branch=main)](https://coveralls.io/github/yourusername/sql-parser-js?branch=main)

一个功能强大的浏览器端 SQL 解析器 JavaScript 库，支持将 SQL 语句解析为抽象语法树(AST)，并提供智能查询分析功能。

## 特性

- 🚀 **纯 JavaScript 实现** - 无需额外依赖，完全兼容浏览器环境
- 📝 **完整 SQL 支持** - 支持 SELECT、INSERT、UPDATE、DELETE 等常见 SQL 语句
- 🌳 **AST 生成** - 将 SQL 语句转换为结构化的抽象语法树
- 🔍 **语法验证** - 提供详细的语法错误检测和定位
- 🎯 **智能查询分析** - 自动提取查询条件、字段信息和表关系，支持生成查询配置界面
- ⚡ **高性能** - 优化的词法和语法分析算法
- 🔧 **TypeScript 支持** - 完整的类型定义文件
- 📦 **多种模块格式** - 支持 ES Module、CommonJS 和 UMD

## 安装

### 使用 npm

```bash
npm install sql-parser-js
```

### 使用 yarn

```bash
yarn add sql-parser-js
```

### 使用 CDN

```html
<!-- 开发版本 -->
<script src="https://unpkg.com/sql-parser-js/dist/sql-parser.js"></script>

<!-- 生产版本 (压缩) -->
<script src="https://unpkg.com/sql-parser-js/dist/sql-parser.min.js"></script>
```

## 快速开始

### 基本用法

```javascript
import { parseSQL } from "sql-parser-js";

// 解析SQL语句
const result = parseSQL("SELECT id, name FROM users WHERE age > 18");

if (result.success) {
  console.log("AST:", result.ast);
  console.log("表名:", result.tables);
  console.log("字段名:", result.columns);
} else {
  console.error("解析错误:", result.error);
}
```

### 查询分析器 - 智能提取查询信息

```javascript
import { analyzeSQL } from "sql-parser-js";

// 分析复杂SQL查询
const analysis = analyzeSQL(`
  SELECT goods_name, liveroom_id, live_date 
  FROM goods_stat_daily 
  WHERE goods_name LIKE '%test%' 
    AND liveroom_id = 'room123'
    AND live_date BETWEEN '2024-01-01' AND '2024-12-31'
`);

if (analysis.success) {
  console.log("查询条件:", analysis.analysis.conditions);
  // [
  //   { field: "goods_name", operator: "LIKE", value: "%test%", type: "pattern" },
  //   { field: "liveroom_id", operator: "=", value: "room123", type: "equality" },
  //   { field: "live_date", operator: "BETWEEN", value: [...], type: "range" }
  // ]
  
  console.log("输出字段:", analysis.analysis.fields);
  // [
  //   { name: "goods_name", type: "column" },
  //   { name: "liveroom_id", type: "column" },
  //   { name: "live_date", type: "column" }
  // ]
  
  console.log("涉及表:", analysis.analysis.tables);
  // ["goods_stat_daily"]
  
  console.log("查询复杂度:", analysis.complexity);
  // { level: "simple", score: 4, factors: ["2个查询条件"] }
}
```

### 生成查询配置界面数据

```javascript
// 基于分析结果生成UI配置数据
function generateQueryConfig(analysis) {
  return {
    conditions: analysis.analysis.conditions.map(condition => ({
      field: condition.field,
      fieldType: getFieldType(condition.field), // "文本", "数字", "日期"等
      operator: condition.operator,
      operatorText: getOperatorText(condition.operator), // "包含", "等于", "介于"等
      value: condition.value,
      valueType: condition.type
    })),
    outputFields: analysis.analysis.fields.map(field => ({
      name: field.name,
      displayName: field.alias || field.name,
      dataType: getFieldDataType(field),
      options: {
        visible: true,
        sortable: true,
        filterable: true
      }
    })),
    metadata: {
      queryType: analysis.analysis.type || "SelectStatement",
      complexity: analysis.complexity.level,
      hasJoins: analysis.analysis.joins.length > 0,
      hasGroupBy: analysis.analysis.groupBy.length > 0,
      hasOrderBy: analysis.analysis.orderBy.length > 0,
      hasLimit: analysis.analysis.limit !== null
    }
  };
}

const config = generateQueryConfig(analysis);
// 这些数据可以直接用于生成查询配置界面
```

### 浏览器中使用

```html
<script src="https://unpkg.com/sql-parser-js/dist/sql-parser.min.js"></script>
<script>
  const result = SQLParser.parseSQL("SELECT * FROM products");
  console.log(result);
</script>
```

## API 文档

### parseSQL(sqlString, options?)

解析 SQL 语句并返回 AST。

**参数:**

- `sqlString` (string): 要解析的 SQL 语句
- `options` (object, 可选): 解析选项
  - `includeComments` (boolean): 是否包含注释，默认 false
  - `strict` (boolean): 是否启用严格模式，默认 false

**返回值:**

```typescript
{
  success: boolean;
  ast?: ASTNode;
  tables?: string[];
  columns?: string[];
  error?: SQLError;
}
```

### analyzeSQL(sqlString)

分析 SQL 查询并提取结构化信息，用于生成查询配置界面。

**参数:**

- `sqlString` (string): 要分析的 SQL 语句

**返回值:**

```typescript
{
  success: boolean;
  analysis?: {
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
      type: 'equality' | 'comparison' | 'pattern' | 'range' | 'list';
    }>;
    fields: Array<{
      name: string;
      alias?: string;
      type: 'column' | 'function' | 'expression';
      functionName?: string;
      isAggregate?: boolean;
    }>;
    tables: string[];
    joins: Array<{
      type: string;
      table: string;
      condition: object;
    }>;
    groupBy: string[];
    orderBy: Array<{
      field: string;
      direction: 'ASC' | 'DESC';
    }>;
    limit?: {
      count: number;
      offset?: number;
    };
  };
  complexity?: {
    level: 'simple' | 'medium' | 'complex';
    score: number;
    factors: string[];
  };
  error?: SQLError;
}
```

**示例:**

```javascript
const analysis = analyzeSQL(`
  SELECT u.name, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  WHERE u.active = 1 AND u.created_at >= '2024-01-01'
  GROUP BY u.id, u.name
  ORDER BY post_count DESC
  LIMIT 10
`);

console.log(analysis.analysis);
// {
//   conditions: [
//     { field: "active", operator: "=", value: 1, type: "equality" },
//     { field: "created_at", operator: ">=", value: "2024-01-01", type: "comparison" }
//   ],
//   fields: [
//     { name: "name", type: "column" },
//     { name: "COUNT", alias: "post_count", type: "function", functionName: "COUNT", isAggregate: true }
//   ],
//   tables: ["users"],
//   joins: [
//     { type: "LEFT", table: "posts", condition: {...} }
//   ],
//   groupBy: ["id", "name"],
//   orderBy: [
//     { field: "post_count", direction: "DESC" }
//   ],
//   limit: { count: 10, offset: null }
// }

console.log(analysis.complexity);
// {
//   level: "medium",
//   score: 12,
//   factors: ["2个查询条件", "1个聚合函数", "GROUP BY", "ORDER BY"]
// }
```

**示例:**

```javascript
const result = parseSQL(`
  SELECT u.id, u.name, p.title 
  FROM users u 
  JOIN posts p ON u.id = p.user_id 
  WHERE u.active = true
`);

console.log(result.ast);
// {
//   type: 'SelectStatement',
//   columns: [
//     { type: 'Column', table: 'u', name: 'id' },
//     { type: 'Column', table: 'u', name: 'name' },
//     { type: 'Column', table: 'p', name: 'title' }
//   ],
//   from: {
//     type: 'FromClause',
//     tables: [
//       { type: 'Table', name: 'users', alias: 'u' }
//     ]
//   },
//   joins: [
//     {
//       type: 'JoinClause',
//       joinType: 'INNER',
//       table: { type: 'Table', name: 'posts', alias: 'p' },
//       condition: { ... }
//     }
//   ],
//   where: { ... }
// }
```

### validateSQL(sqlString)

验证 SQL 语句语法是否正确。

**参数:**

- `sqlString` (string): 要验证的 SQL 语句

**返回值:**

```typescript
{
  valid: boolean;
  errors: SQLError[];
}
```

**示例:**

```javascript
const validation = validateSQL("SELECT * FROM");
console.log(validation);
// {
//   valid: false,
//   errors: [
//     {
//       message: 'Expected table name after FROM',
//       line: 1,
//       column: 15,
//       code: 'SYNTAX_ERROR'
//     }
//   ]
// }
```

### extractTables(sqlString)

提取 SQL 语句中的所有表名。

**参数:**

- `sqlString` (string): SQL 语句

**返回值:**

- `string[]`: 表名数组

**示例:**

```javascript
const tables = extractTables(`
  SELECT * FROM users u
  JOIN orders o ON u.id = o.user_id
  LEFT JOIN products p ON o.product_id = p.id
`);
console.log(tables); // ['users', 'orders', 'products']
```

### extractColumns(sqlString)

提取 SQL 语句中的所有字段名。

**参数:**

- `sqlString` (string): SQL 语句

**返回值:**

- `string[]`: 字段名数组

**示例:**

```javascript
const columns = extractColumns(
  "SELECT id, name, email FROM users WHERE active = 1"
);
console.log(columns); // ['id', 'name', 'email', 'active']
```

## 高级用法

### 使用 Lexer 和 Parser 类

```javascript
import { Lexer, Parser } from "sql-parser-js";

// 词法分析
const lexer = new Lexer("SELECT * FROM users");
const tokens = lexer.tokenize();
console.log(tokens);

// 语法分析
const parser = new Parser(tokens);
const ast = parser.parse();
console.log(ast);
```

### 自定义错误处理

```javascript
import { parseSQL, SQLError } from "sql-parser-js";

try {
  const result = parseSQL("INVALID SQL");
  if (!result.success) {
    const error = result.error;
    console.log(`错误: ${error.message}`);
    console.log(`位置: 第${error.line}行，第${error.column}列`);
    console.log(`错误代码: ${error.code}`);
  }
} catch (error) {
  if (error instanceof SQLError) {
    console.log("SQL解析错误:", error.message);
  }
}
```

### AST 遍历

```javascript
import { parseSQL } from "sql-parser-js";

function traverseAST(node, callback) {
  callback(node);

  // 遍历子节点
  Object.values(node).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === "object" && item.type) {
          traverseAST(item, callback);
        }
      });
    } else if (value && typeof value === "object" && value.type) {
      traverseAST(value, callback);
    }
  });
}

const result = parseSQL("SELECT id, name FROM users WHERE age > 18");
if (result.success) {
  traverseAST(result.ast, (node) => {
    console.log(`节点类型: ${node.type}`);
  });
}
```

## 支持的 SQL 语法

### SELECT 语句

```sql
-- 基本查询
SELECT * FROM users;
SELECT id, name FROM users;

-- 条件查询 (支持所有常见操作符)
SELECT * FROM users WHERE age > 18;
SELECT * FROM users WHERE name LIKE 'John%' AND active = true;
SELECT * FROM users WHERE id IN (1, 2, 3);
SELECT * FROM users WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- 连接查询
SELECT u.name, p.title FROM users u JOIN posts p ON u.id = p.user_id;
SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id;

-- 分组和排序
SELECT department, COUNT(*) FROM employees GROUP BY department;
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- 子查询
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);
```

### 支持的查询操作符

查询分析器能够识别和分析以下操作符：

#### 比较操作符
- `=` - 等于
- `!=`, `<>` - 不等于  
- `>` - 大于
- `>=` - 大于等于
- `<` - 小于
- `<=` - 小于等于

#### 模式匹配
- `LIKE` - 模式匹配 (支持 `%` 和 `_` 通配符)
- `NOT LIKE` - 非模式匹配

#### 范围操作符
- `BETWEEN ... AND ...` - 范围查询
- `NOT BETWEEN ... AND ...` - 非范围查询

#### 列表操作符
- `IN (...)` - 在列表中
- `NOT IN (...)` - 不在列表中

#### 逻辑操作符
- `AND` - 逻辑与
- `OR` - 逻辑或
- `NOT` - 逻辑非

#### 空值检查
- `IS NULL` - 为空
- `IS NOT NULL` - 不为空

### INSERT 语句

```sql
-- 插入单行
INSERT INTO users (name, email) VALUES ('John', 'john@example.com');

-- 插入多行
INSERT INTO users (name, email) VALUES
  ('John', 'john@example.com'),
  ('Jane', 'jane@example.com');
```

### UPDATE 语句

```sql
-- 基本更新
UPDATE users SET name = 'John Doe' WHERE id = 1;

-- 多字段更新
UPDATE users SET name = 'John', email = 'john@new.com' WHERE id = 1;
```

### DELETE 语句

```sql
-- 基本删除
DELETE FROM users WHERE id = 1;

-- 条件删除
DELETE FROM users WHERE created_at < '2023-01-01';
```

## 错误处理

库提供了详细的错误信息，包括：

- **语法错误**: 不符合 SQL 语法规则
- **词法错误**: 无法识别的字符或 token
- **语义错误**: 语法正确但语义有问题

错误对象包含以下信息：

```typescript
interface SQLError {
  message: string; // 错误描述
  code: string; // 错误代码
  line: number; // 错误行号
  column: number; // 错误列号
  context?: string; // 错误上下文
}
```

## 性能优化

### 大型 SQL 语句处理

```javascript
// 对于大型SQL语句，可以使用流式处理
import { Lexer } from "sql-parser-js";

const lexer = new Lexer(largeSQLString, {
  bufferSize: 8192, // 设置缓冲区大小
});
```

### 缓存解析结果

```javascript
const parseCache = new Map();

function cachedParseSQL(sql) {
  if (parseCache.has(sql)) {
    return parseCache.get(sql);
  }

  const result = parseSQL(sql);
  parseCache.set(sql, result);
  return result;
}
```

## 开发指南

### 项目结构

```
sql-parser-js/
├── src/
│   ├── index.js          # 主入口文件
│   ├── lexer/            # 词法分析器
│   │   ├── lexer.js
│   │   └── token-types.js
│   ├── parser/           # 语法分析器
│   │   └── parser.js
│   ├── ast/              # AST节点定义
│   │   └── ast-nodes.js
│   └── errors/           # 错误处理
│       └── sql-error.js
├── tests/                # 测试文件
├── types/                # TypeScript类型定义
├── dist/                 # 构建输出
└── docs/                 # 文档
```

### 构建和测试

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建项目
npm run build

# 代码检查
npm run lint

# 性能测试
npm run benchmark
```

### 扩展解析器

要添加新的 SQL 语法支持：

1. 在`token-types.js`中添加新的 token 类型
2. 在`lexer.js`中添加词法识别规则
3. 在`ast-nodes.js`中定义新的 AST 节点类型
4. 在`parser.js`中实现解析逻辑
5. 添加相应的测试用例

## 贡献指南

我们欢迎所有形式的贡献！请阅读以下指南：

### 开发环境设置

1. **Fork 并克隆项目**
   ```bash
   git clone https://github.com/yourusername/sql-parser-js.git
   cd sql-parser-js
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **运行测试**
   ```bash
   npm test
   ```

4. **构建项目**
   ```bash
   npm run build
   ```

### 提交代码

1. 创建特性分支 (`git checkout -b feature/amazing-feature`)
2. 提交更改 (`git commit -m 'Add some amazing feature'`)
3. 推送到分支 (`git push origin feature/amazing-feature`)
4. 创建 Pull Request

### 代码规范

- 使用 ESLint 进行代码检查：`npm run lint`
- 确保所有测试通过：`npm test`
- 添加适当的测试用例
- 遵循现有的代码风格

### 报告问题

如果您发现了 bug 或有功能建议，请：

1. 检查是否已有相关 [Issue](https://github.com/yourusername/sql-parser-js/issues)
2. 如果没有，请创建新的 Issue
3. 提供详细的问题描述和复现步骤

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 更新日志

### v1.0.0 (2024-01-XX)

- ✨ 初始版本发布
- 🚀 支持基本的 SQL 语句解析 (SELECT, INSERT, UPDATE, DELETE)
- 🌳 完整的 AST 生成功能
- 🔍 智能查询分析器，支持提取查询条件、字段信息和表关系
- 📝 TypeScript 类型定义
- ⚡ 高性能词法和语法分析
- 🎯 支持多种 SQL 操作符和语法结构
- 📦 多种模块格式支持 (ES Module, CommonJS, UMD)
- ✅ 168个测试用例，覆盖率85%+

## 支持与反馈

### 获取帮助

- 📖 查看 [API 文档](docs/API.md)
- 💡 查看 [示例代码](examples/)
- 🔧 查看 [开发指南](docs/development.md)

### 联系我们

- 🐛 [报告 Bug](https://github.com/yourusername/sql-parser-js/issues/new?template=bug_report.md)
- 💡 [功能建议](https://github.com/yourusername/sql-parser-js/issues/new?template=feature_request.md)
- 💬 [讨论区](https://github.com/yourusername/sql-parser-js/discussions)

## 相关项目

- [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) - SQL 格式化工具
- [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser) - Node.js SQL 解析器

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐️**

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div>
