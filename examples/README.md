# SQL 解析器使用示例

这个目录包含了多种环境下使用 SQL 解析器的完整示例。

## 📁 文件说明

### 1. `node-example.js` - Node.js ES 模块示例
使用现代 ES 模块语法的 Node.js 示例，展示了所有主要功能。

**运行方式:**
```bash
node examples/node-example.js
```

**功能演示:**
- ✅ 基本 SELECT 语句解析
- ✅ 复杂查询解析 (JOIN + CASE)
- ✅ INSERT 语句解析
- ✅ SQL 验证
- ✅ 表名提取
- ✅ 列名提取
- ✅ 错误处理

### 2. `query-analysis-example.js` - 查询分析示例 ⭐ 新功能
智能查询分析器示例，展示如何提取查询条件、字段信息和生成配置界面数据。

**运行方式:**
```bash
node examples/query-analysis-example.js
```

**功能演示:**
- 🎯 智能提取查询条件 (LIKE、IN、BETWEEN等)
- 📋 分析输出字段和聚合函数
- 🏢 识别涉及的表和JOIN关系
- 📊 评估查询复杂度
- 🎛️ 生成查询配置界面数据
- 💡 支持生成类似图片中的查询配置界面

### 3. `commonjs-example.cjs` - CommonJS 示例
传统 CommonJS 模块语法的示例，适用于旧版 Node.js 项目。

**运行方式:**
```bash
node examples/commonjs-example.cjs
```

**功能演示:**
- 📋 基本解析功能
- 🔍 复杂查询解析
- 🛠️ 实用工具演示
- ⚠️ 错误处理演示
- ⚡ 性能测试演示

### 4. `browser-example.html` - 浏览器示例
完整的 HTML 页面，提供交互式的 SQL 解析器界面。

**使用方式:**
1. 在浏览器中打开 `browser-example.html`
2. 输入 SQL 语句或选择预设示例
3. 点击相应按钮进行解析、验证或提取操作

**特性:**
- 🎨 美观的用户界面
- 📝 多种预设 SQL 示例
- 🔍 实时解析和验证
- 📊 详细的结果显示
- ⚠️ 友好的错误提示

## 🚀 快速开始

### 1. 确保项目已构建
```bash
npm run build
```

### 2. 运行 Node.js 示例
```bash
# ES 模块示例
node examples/node-example.js

# 查询分析示例 (新功能)
node examples/query-analysis-example.js

# CommonJS 示例
node examples/commonjs-example.cjs
```

### 3. 打开浏览器示例
直接在浏览器中打开 `examples/browser-example.html` 文件。

## 📋 支持的 SQL 语句类型

### SELECT 语句
```sql
SELECT id, name, email FROM users WHERE age > 18
```

### INSERT 语句
```sql
INSERT INTO users (name, email) VALUES ('John', 'john@example.com')
```

### UPDATE 语句
```sql
UPDATE users SET email = 'new@example.com' WHERE id = 1
```

### DELETE 语句
```sql
DELETE FROM users WHERE active = false
```

### 复杂查询
```sql
SELECT u.name, p.title,
       CASE 
           WHEN u.age >= 18 THEN 'Adult'
           ELSE 'Minor'
       END as category
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.active = true
ORDER BY u.name
LIMIT 10
```

## 🛠️ API 使用说明

### parseSQL(sqlString, options)
解析 SQL 语句并返回 AST。

```javascript
const result = parseSQL('SELECT * FROM users');
console.log(result.ast.type); // 'SELECT'
```

### analyzeSQL(sqlString) ⭐ 新功能
智能分析 SQL 查询，提取结构化信息用于生成查询配置界面。

```javascript
const analysis = analyzeSQL(`
  SELECT goods_name, liveroom_id 
  FROM goods_stat_daily 
  WHERE goods_name LIKE '%test%' AND liveroom_id = 'room123'
`);

console.log(analysis.analysis.conditions);
// [
//   { field: "goods_name", operator: "LIKE", value: "%test%", type: "pattern" },
//   { field: "liveroom_id", operator: "=", value: "room123", type: "equality" }
// ]

console.log(analysis.analysis.fields);
// [
//   { name: "goods_name", type: "column" },
//   { name: "liveroom_id", type: "column" }
// ]

console.log(analysis.complexity);
// { level: "simple", score: 4, factors: ["2个查询条件"] }
```

### validateSQL(sqlString, options)
验证 SQL 语句的语法正确性。

```javascript
const result = validateSQL('SELECT * FROM users');
console.log(result.isValid); // true
```

### extractTables(sqlString)
提取 SQL 语句中的所有表名。

```javascript
const tables = extractTables('SELECT * FROM users JOIN posts ON users.id = posts.user_id');
console.log(tables); // ['users', 'posts']
```

### extractColumns(sqlString)
提取 SQL 语句中的所有列名。

```javascript
const columns = extractColumns('SELECT id, name FROM users WHERE age > 18');
console.log(columns); // ['id', 'name', 'age']
```

## ⚠️ 错误处理

所有解析函数都会在遇到语法错误时抛出 `SQLError` 异常：

```javascript
try {
    parseSQL('SELECT * FROM'); // 语法错误
} catch (error) {
    console.log(error.type);    // 错误类型
    console.log(error.message); // 错误信息
    console.log(error.line);    // 错误行号
    console.log(error.column);  // 错误列号
}
```

## 🎯 使用场景

1. **SQL 查询分析工具** - 分析和理解复杂的 SQL 查询
2. **查询配置界面生成** - 基于 SQL 结构自动生成查询配置界面 ⭐ 新功能
3. **代码生成器** - 基于 SQL 结构生成代码
4. **查询优化器** - 分析查询结构进行优化建议
5. **数据库迁移工具** - 解析和转换 SQL 语句
6. **SQL 教学工具** - 帮助理解 SQL 语句结构
7. **代码审查工具** - 检查 SQL 语句的规范性
8. **BI 工具开发** - 为商业智能工具提供 SQL 解析能力 ⭐ 新功能

## 💡 提示

- 所有示例都包含详细的注释和错误处理
- 可以根据需要修改示例代码来测试自己的 SQL 语句
- 浏览器示例提供了最直观的使用体验
- 性能测试显示解析器可以高效处理复杂查询

## 🔗 相关链接

- [API 文档](../docs/API.md)
- [开发指南](../docs/development.md)
- [项目主页](../README.md)