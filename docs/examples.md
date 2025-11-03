# 使用示例

本文档提供了 SQL Parser JS 库的详细使用示例，涵盖各种常见场景和高级用法。

## 目录

- [基础用法](#基础用法)
- [SELECT 语句解析](#select语句解析)
- [INSERT 语句解析](#insert语句解析)
- [UPDATE 语句解析](#update语句解析)
- [DELETE 语句解析](#delete语句解析)
- [错误处理](#错误处理)
- [AST 操作](#ast操作)
- [性能优化](#性能优化)
- [实际应用场景](#实际应用场景)

## 基础用法

### 简单的 SQL 解析

```javascript
import { parseSQL } from "sql-parser-js";

// 解析简单的SELECT语句
const result = parseSQL("SELECT * FROM users");

if (result.success) {
  console.log("解析成功!");
  console.log("AST类型:", result.ast.type); // 'SelectStatement'
  console.log("涉及的表:", result.tables); // ['users']
  console.log("涉及的字段:", result.columns); // ['*']
} else {
  console.error("解析失败:", result.error.message);
}
```

### 语法验证

```javascript
import { validateSQL } from "sql-parser-js";

const sqlQueries = [
  "SELECT * FROM users", // 有效
  "SELECT name, email FROM users", // 有效
  "SELECT * FROM", // 无效
  "INSERT INTO users VALUES", // 无效
];

sqlQueries.forEach((sql, index) => {
  const validation = validateSQL(sql);
  console.log(`查询 ${index + 1}: ${validation.valid ? "✓ 有效" : "✗ 无效"}`);

  if (!validation.valid) {
    validation.errors.forEach((error) => {
      console.log(`  错误: ${error.message}`);
      console.log(`  位置: 第${error.line}行，第${error.column}列`);
    });
  }
});
```

### 提取表名和字段名

```javascript
import { extractTables, extractColumns } from "sql-parser-js";

const sql = `
  SELECT u.id, u.name, p.title, c.name as category
  FROM users u
  JOIN posts p ON u.id = p.user_id
  JOIN categories c ON p.category_id = c.id
  WHERE u.active = 1 AND p.published = true
`;

const tables = extractTables(sql);
console.log("涉及的表:", tables);
// ['users', 'posts', 'categories']

const columns = extractColumns(sql);
console.log("涉及的字段:", columns);
// ['id', 'name', 'title', 'category', 'user_id', 'category_id', 'active', 'published']
```

## SELECT 语句解析

### 基本 SELECT 查询

```javascript
import { parseSQL } from "sql-parser-js";

const basicSelect = parseSQL(
  "SELECT id, name, email FROM users WHERE active = 1"
);

if (basicSelect.success) {
  const stmt = basicSelect.ast;

  console.log("查询类型:", stmt.type); // 'SelectStatement'
  console.log("选择的列:");
  stmt.columns.forEach((col) => {
    if (col.type === "Column") {
      console.log(`  - ${col.table ? col.table + "." : ""}${col.name}`);
    }
  });

  console.log("FROM子句:", stmt.from.tables[0].name); // 'users'
  console.log("WHERE条件存在:", !!stmt.where); // true
}
```

### 复杂 SELECT 查询

```javascript
const complexSelect = `
  SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_amount,
    AVG(o.total) as avg_order_value,
    MAX(o.created_at) as last_order_date
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.active = true
    AND u.created_at >= '2023-01-01'
    AND (u.type = 'premium' OR u.total_spent > 1000)
  GROUP BY u.id, u.name, u.email
  HAVING COUNT(o.id) > 0 AND SUM(o.total) > 500
  ORDER BY total_amount DESC, u.name ASC
  LIMIT 50 OFFSET 10
`;

const result = parseSQL(complexSelect);

if (result.success) {
  const stmt = result.ast;

  console.log("是否有JOIN:", stmt.joins && stmt.joins.length > 0);
  console.log("JOIN类型:", stmt.joins[0].joinType); // 'LEFT'
  console.log("是否有GROUP BY:", !!stmt.groupBy);
  console.log("是否有HAVING:", !!stmt.having);
  console.log("是否有ORDER BY:", !!stmt.orderBy);
  console.log("是否有LIMIT:", !!stmt.limit);

  if (stmt.limit) {
    console.log("LIMIT值:", stmt.limit.count);
    console.log("OFFSET值:", stmt.limit.offset);
  }
}
```

### 子查询处理

```javascript
const subquerySQL = `
  SELECT u.name, u.email
  FROM users u
  WHERE u.id IN (
    SELECT DISTINCT user_id 
    FROM orders 
    WHERE total > 100 
      AND created_at >= '2023-01-01'
  )
  AND u.department_id = (
    SELECT id 
    FROM departments 
    WHERE name = 'Engineering'
  )
`;

const result = parseSQL(subquerySQL);

if (result.success) {
  console.log("主查询表:", result.tables);

  // 遍历AST查找子查询
  function findSubqueries(node, subqueries = []) {
    if (node && typeof node === "object") {
      if (node.type === "SelectStatement" && subqueries.length > 0) {
        subqueries.push(node);
      }

      Object.values(node).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((item) => findSubqueries(item, subqueries));
        } else {
          findSubqueries(value, subqueries);
        }
      });
    }
    return subqueries;
  }

  const subqueries = findSubqueries(result.ast, []);
  console.log("子查询数量:", subqueries.length);
}
```

## INSERT 语句解析

### 单行插入

```javascript
const insertSQL =
  "INSERT INTO users (name, email, age) VALUES ('John Doe', 'john@example.com', 30)";

const result = parseSQL(insertSQL);

if (result.success) {
  const stmt = result.ast;

  console.log("插入表:", stmt.table.name); // 'users'
  console.log("插入字段:");
  stmt.columns.forEach((col) => {
    console.log(`  - ${col.name}`);
  });

  console.log("插入值:");
  stmt.values[0].forEach((value, index) => {
    const column = stmt.columns[index].name;
    const val =
      value.type === "StringLiteral" ? `'${value.value}'` : value.value;
    console.log(`  ${column}: ${val}`);
  });
}
```

### 多行插入

```javascript
const multiInsertSQL = `
  INSERT INTO products (name, price, category_id, in_stock)
  VALUES 
    ('Laptop', 999.99, 1, true),
    ('Mouse', 29.99, 1, true),
    ('Keyboard', 79.99, 1, false),
    ('Monitor', 299.99, 2, true)
`;

const result = parseSQL(multiInsertSQL);

if (result.success) {
  const stmt = result.ast;

  console.log(`插入 ${stmt.values.length} 行数据到表 ${stmt.table.name}`);

  stmt.values.forEach((row, rowIndex) => {
    console.log(`第 ${rowIndex + 1} 行:`);
    row.forEach((value, colIndex) => {
      const column = stmt.columns[colIndex].name;
      let val;
      switch (value.type) {
        case "StringLiteral":
          val = `'${value.value}'`;
          break;
        case "NumberLiteral":
          val = value.value;
          break;
        case "BooleanLiteral":
          val = value.value;
          break;
        default:
          val = value.value;
      }
      console.log(`  ${column}: ${val}`);
    });
  });
}
```

### INSERT SELECT 语句

```javascript
const insertSelectSQL = `
  INSERT INTO user_backup (id, name, email, created_at)
  SELECT id, name, email, created_at
  FROM users
  WHERE active = false AND created_at < '2022-01-01'
`;

const result = parseSQL(insertSelectSQL);

if (result.success) {
  const stmt = result.ast;

  console.log("目标表:", stmt.table.name); // 'user_backup'
  console.log("是否使用SELECT插入:", !!stmt.select); // true

  if (stmt.select) {
    console.log("源表:", stmt.select.from.tables[0].name); // 'users'
    console.log("是否有WHERE条件:", !!stmt.select.where); // true
  }
}
```

## UPDATE 语句解析

### 基本 UPDATE

```javascript
const updateSQL = `
  UPDATE users 
  SET name = 'John Smith', 
      email = 'john.smith@example.com',
      updated_at = NOW()
  WHERE id = 1
`;

const result = parseSQL(updateSQL);

if (result.success) {
  const stmt = result.ast;

  console.log("更新表:", stmt.table.name); // 'users'
  console.log("更新字段:");

  stmt.set.forEach((assignment) => {
    const column = assignment.column.name;
    const value = assignment.value;

    let val;
    if (value.type === "StringLiteral") {
      val = `'${value.value}'`;
    } else if (value.type === "FunctionCall") {
      val = `${value.name}()`;
    } else {
      val = value.value;
    }

    console.log(`  ${column} = ${val}`);
  });

  console.log("是否有WHERE条件:", !!stmt.where);
}
```

### 条件 UPDATE

```javascript
const conditionalUpdateSQL = `
  UPDATE products 
  SET price = price * 0.9,
      sale_price = price * 0.8,
      on_sale = true
  WHERE category_id IN (1, 2, 3)
    AND in_stock = true
    AND price > 50
`;

const result = parseSQL(conditionalUpdateSQL);

if (result.success) {
  const stmt = result.ast;

  console.log("更新表:", stmt.table.name);
  console.log("SET子句数量:", stmt.set.length);

  // 分析WHERE条件
  if (stmt.where && stmt.where.type === "BinaryExpression") {
    console.log("WHERE条件是复合条件");
    console.log("主要操作符:", stmt.where.operator); // 'AND'
  }
}
```

## DELETE 语句解析

### 基本 DELETE

```javascript
const deleteSQL = "DELETE FROM users WHERE active = false";

const result = parseSQL(deleteSQL);

if (result.success) {
  const stmt = result.ast;

  console.log("删除表:", stmt.from.name); // 'users'
  console.log("是否有WHERE条件:", !!stmt.where); // true

  if (stmt.where) {
    console.log("WHERE条件类型:", stmt.where.type); // 'BinaryExpression'
    console.log("条件操作符:", stmt.where.operator); // '='
  }
}
```

### 复杂 DELETE 条件

```javascript
const complexDeleteSQL = `
  DELETE FROM orders 
  WHERE status = 'cancelled' 
    AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)
    AND user_id NOT IN (
      SELECT id FROM users WHERE type = 'premium'
    )
`;

const result = parseSQL(complexDeleteSQL);

if (result.success) {
  const stmt = result.ast;

  console.log("删除表:", stmt.from.name);
  console.log("WHERE条件复杂度: 包含子查询和函数调用");

  // 检查是否包含子查询
  function hasSubquery(node) {
    if (node && typeof node === "object") {
      if (node.type === "SelectStatement") {
        return true;
      }
      return Object.values(node).some((value) => {
        if (Array.isArray(value)) {
          return value.some(hasSubquery);
        }
        return hasSubquery(value);
      });
    }
    return false;
  }

  console.log("包含子查询:", hasSubquery(stmt.where));
}
```

## 错误处理

### 语法错误处理

```javascript
import { parseSQL, SQLError } from "sql-parser-js";

const invalidSQLs = [
  "SELECT * FROM", // 缺少表名
  "SELECT name, FROM users", // 语法错误
  "INSERT INTO users VALUES", // 缺少值
  "UPDATE users SET WHERE id = 1", // 缺少SET值
  "DELETE FROM users WHERE", // 缺少WHERE条件
];

invalidSQLs.forEach((sql, index) => {
  console.log(`\n测试SQL ${index + 1}: ${sql}`);

  try {
    const result = parseSQL(sql);

    if (!result.success) {
      const error = result.error;
      console.log(`❌ 解析失败`);
      console.log(`   错误类型: ${error.code}`);
      console.log(`   错误消息: ${error.message}`);
      console.log(`   错误位置: 第${error.line}行，第${error.column}列`);

      if (error.context) {
        console.log(`   错误上下文: ${error.context}`);
      }
    }
  } catch (error) {
    if (error instanceof SQLError) {
      console.log(`❌ 捕获异常: ${error.message}`);
    } else {
      console.log(`❌ 未知错误: ${error.message}`);
    }
  }
});
```

### 词法错误处理

```javascript
import { Lexer } from "sql-parser-js";

const invalidTokens = [
  "SELECT * FROM users WHERE name = 'unterminated string",
  "SELECT * FROM users /* unterminated comment",
  "SELECT * FROM users WHERE id = 123abc", // 无效数字
];

invalidTokens.forEach((sql, index) => {
  console.log(`\n词法分析测试 ${index + 1}:`);

  try {
    const lexer = new Lexer(sql);
    const tokens = lexer.tokenize();
    console.log("✓ 词法分析成功");
  } catch (error) {
    if (error instanceof SQLError) {
      console.log(`❌ 词法错误: ${error.message}`);
      console.log(`   位置: 第${error.line}行，第${error.column}列`);
    }
  }
});
```

## AST 操作

### AST 遍历

```javascript
import { parseSQL } from "sql-parser-js";

function traverseAST(node, callback, depth = 0) {
  if (!node || typeof node !== "object") return;

  callback(node, depth);

  Object.values(node).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === "object" && item.type) {
          traverseAST(item, callback, depth + 1);
        }
      });
    } else if (value && typeof value === "object" && value.type) {
      traverseAST(value, callback, depth + 1);
    }
  });
}

const sql = `
  SELECT u.name, COUNT(o.id) as order_count
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.active = true
  GROUP BY u.name
  HAVING COUNT(o.id) > 5
`;

const result = parseSQL(sql);

if (result.success) {
  console.log("AST结构:");
  traverseAST(result.ast, (node, depth) => {
    const indent = "  ".repeat(depth);
    console.log(`${indent}${node.type}`);
  });
}
```

### AST 修改

```javascript
function modifyAST(ast) {
  // 深拷贝AST
  const modifiedAST = JSON.parse(JSON.stringify(ast));

  // 添加新的WHERE条件
  if (modifiedAST.type === "SelectStatement") {
    const newCondition = {
      type: "BinaryExpression",
      operator: "=",
      left: {
        type: "Column",
        name: "deleted_at",
        table: null,
      },
      right: {
        type: "NullLiteral",
        value: null,
      },
    };

    if (modifiedAST.where) {
      // 如果已有WHERE条件，用AND连接
      modifiedAST.where = {
        type: "BinaryExpression",
        operator: "AND",
        left: modifiedAST.where,
        right: newCondition,
      };
    } else {
      // 如果没有WHERE条件，直接添加
      modifiedAST.where = newCondition;
    }
  }

  return modifiedAST;
}

const originalSQL = "SELECT * FROM users WHERE active = true";
const result = parseSQL(originalSQL);

if (result.success) {
  const modifiedAST = modifyAST(result.ast);
  console.log("原始AST WHERE条件:", result.ast.where);
  console.log("修改后AST WHERE条件:", modifiedAST.where);
}
```

### AST 转 SQL

```javascript
function astToSQL(node) {
  if (!node || typeof node !== "object") return "";

  switch (node.type) {
    case "SelectStatement":
      let sql = "SELECT ";

      // 处理DISTINCT
      if (node.distinct) {
        sql += "DISTINCT ";
      }

      // 处理列
      sql += node.columns.map((col) => astToSQL(col)).join(", ");

      // 处理FROM
      if (node.from) {
        sql += " FROM " + astToSQL(node.from);
      }

      // 处理JOIN
      if (node.joins && node.joins.length > 0) {
        sql += " " + node.joins.map((join) => astToSQL(join)).join(" ");
      }

      // 处理WHERE
      if (node.where) {
        sql += " WHERE " + astToSQL(node.where);
      }

      // 处理GROUP BY
      if (node.groupBy) {
        sql += " GROUP BY " + astToSQL(node.groupBy);
      }

      // 处理HAVING
      if (node.having) {
        sql += " HAVING " + astToSQL(node.having);
      }

      // 处理ORDER BY
      if (node.orderBy) {
        sql += " ORDER BY " + astToSQL(node.orderBy);
      }

      // 处理LIMIT
      if (node.limit) {
        sql += " LIMIT " + astToSQL(node.limit);
      }

      return sql;

    case "Column":
      return (node.table ? node.table + "." : "") + node.name;

    case "Identifier":
      return node.name + (node.alias ? " AS " + node.alias : "");

    case "BinaryExpression":
      return (
        astToSQL(node.left) + " " + node.operator + " " + astToSQL(node.right)
      );

    case "StringLiteral":
      return `'${node.value}'`;

    case "NumberLiteral":
      return node.value.toString();

    case "BooleanLiteral":
      return node.value ? "true" : "false";

    case "NullLiteral":
      return "NULL";

    default:
      return "";
  }
}

// 使用示例
const result = parseSQL("SELECT id, name FROM users WHERE active = true");
if (result.success) {
  const regeneratedSQL = astToSQL(result.ast);
  console.log("重新生成的SQL:", regeneratedSQL);
}
```

## 性能优化

### 批量解析优化

```javascript
import { parseSQL } from "sql-parser-js";

// 缓存解析结果
const parseCache = new Map();

function cachedParseSQL(sql) {
  // 标准化SQL（去除多余空格）
  const normalizedSQL = sql.replace(/\s+/g, " ").trim();

  if (parseCache.has(normalizedSQL)) {
    return parseCache.get(normalizedSQL);
  }

  const result = parseSQL(normalizedSQL);
  parseCache.set(normalizedSQL, result);

  return result;
}

// 批量解析
const sqlQueries = [
  "SELECT * FROM users",
  "SELECT id, name FROM users",
  "SELECT * FROM users", // 重复查询，会使用缓存
  "SELECT * FROM products",
];

console.time("批量解析");
const results = sqlQueries.map((sql) => cachedParseSQL(sql));
console.timeEnd("批量解析");

console.log(
  `缓存命中率: ${
    ((sqlQueries.length - parseCache.size) / sqlQueries.length) * 100
  }%`
);
```

### 内存使用优化

```javascript
import { Lexer, Parser } from "sql-parser-js";

function parseWithMemoryOptimization(sql) {
  // 使用较小的缓冲区
  const lexer = new Lexer(sql, { bufferSize: 1024 });
  const tokens = lexer.tokenize();

  // 解析完成后清理词法分析器
  lexer.cleanup && lexer.cleanup();

  const parser = new Parser(tokens);
  const ast = parser.parse();

  // 解析完成后清理解析器
  parser.cleanup && parser.cleanup();

  return ast;
}

// 监控内存使用
function measureMemoryUsage(fn, ...args) {
  const memBefore = process.memoryUsage();
  const result = fn(...args);
  const memAfter = process.memoryUsage();

  console.log("内存使用变化:");
  console.log(
    `  堆内存: ${(memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024} MB`
  );
  console.log(
    `  外部内存: ${(memAfter.external - memBefore.external) / 1024 / 1024} MB`
  );

  return result;
}

// 使用示例
const largSQL = `
  SELECT 
    u.id, u.name, u.email, u.created_at,
    p.id as profile_id, p.bio, p.avatar_url,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_spent,
    AVG(o.total) as avg_order_value
  FROM users u
  LEFT JOIN user_profiles p ON u.id = p.user_id
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.active = true
    AND u.created_at >= '2023-01-01'
    AND (u.type = 'premium' OR u.total_spent > 1000)
  GROUP BY u.id, u.name, u.email, u.created_at, p.id, p.bio, p.avatar_url
  HAVING COUNT(o.id) > 0
  ORDER BY total_spent DESC, u.name ASC
  LIMIT 100
`;

measureMemoryUsage(parseWithMemoryOptimization, largSQL);
```

## 实际应用场景

### SQL 查询分析器

```javascript
import { parseSQL, extractTables, extractColumns } from "sql-parser-js";

class SQLAnalyzer {
  constructor() {
    this.cache = new Map();
  }

  analyze(sql) {
    if (this.cache.has(sql)) {
      return this.cache.get(sql);
    }

    const result = parseSQL(sql);

    if (!result.success) {
      return {
        valid: false,
        error: result.error.message,
        suggestions: this.getSuggestions(result.error),
      };
    }

    const analysis = {
      valid: true,
      type: result.ast.type,
      tables: result.tables,
      columns: result.columns,
      complexity: this.calculateComplexity(result.ast),
      features: this.extractFeatures(result.ast),
      performance: this.analyzePerformance(result.ast),
      security: this.checkSecurity(sql),
    };

    this.cache.set(sql, analysis);
    return analysis;
  }

  calculateComplexity(ast) {
    let complexity = 1; // 基础复杂度

    // JOIN增加复杂度
    if (ast.joins) {
      complexity += ast.joins.length * 2;
    }

    // 子查询增加复杂度
    complexity += this.countSubqueries(ast) * 3;

    // 聚合函数增加复杂度
    complexity += this.countAggregations(ast);

    return complexity;
  }

  extractFeatures(ast) {
    const features = [];

    if (ast.type === "SelectStatement") {
      if (ast.distinct) features.push("DISTINCT");
      if (ast.joins && ast.joins.length > 0) features.push("JOIN");
      if (ast.where) features.push("WHERE");
      if (ast.groupBy) features.push("GROUP BY");
      if (ast.having) features.push("HAVING");
      if (ast.orderBy) features.push("ORDER BY");
      if (ast.limit) features.push("LIMIT");
    }

    return features;
  }

  analyzePerformance(ast) {
    const issues = [];

    // 检查SELECT *
    if (ast.type === "SelectStatement") {
      const hasSelectAll = ast.columns.some(
        (col) => col.type === "Column" && col.name === "*"
      );
      if (hasSelectAll) {
        issues.push({
          type: "warning",
          message: "使用SELECT *可能影响性能，建议明确指定需要的列",
        });
      }

      // 检查没有WHERE条件的查询
      if (!ast.where && !ast.limit) {
        issues.push({
          type: "warning",
          message: "没有WHERE条件和LIMIT的查询可能返回大量数据",
        });
      }

      // 检查复杂的JOIN
      if (ast.joins && ast.joins.length > 3) {
        issues.push({
          type: "info",
          message: "多表JOIN可能影响查询性能，考虑优化查询结构",
        });
      }
    }

    return issues;
  }

  checkSecurity(sql) {
    const issues = [];

    // 简单的SQL注入检查
    const suspiciousPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from.*where.*1\s*=\s*1/i,
      /update.*set.*where.*1\s*=\s*1/i,
    ];

    suspiciousPatterns.forEach((pattern) => {
      if (pattern.test(sql)) {
        issues.push({
          type: "error",
          message: "检测到可能的SQL注入模式",
        });
      }
    });

    return issues;
  }

  countSubqueries(node) {
    let count = 0;
    if (node && typeof node === "object") {
      if (node.type === "SelectStatement") {
        count += 1;
      }
      Object.values(node).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((item) => (count += this.countSubqueries(item)));
        } else {
          count += this.countSubqueries(value);
        }
      });
    }
    return count - 1; // 减去主查询
  }

  countAggregations(node) {
    let count = 0;
    if (node && typeof node === "object") {
      if (node.type === "FunctionCall") {
        const aggFunctions = ["COUNT", "SUM", "AVG", "MIN", "MAX"];
        if (aggFunctions.includes(node.name.toUpperCase())) {
          count += 1;
        }
      }
      Object.values(node).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((item) => (count += this.countAggregations(item)));
        } else {
          count += this.countAggregations(value);
        }
      });
    }
    return count;
  }

  getSuggestions(error) {
    const suggestions = [];

    if (error.message.includes("Expected table name")) {
      suggestions.push("请在FROM子句后添加表名");
    }

    if (error.message.includes("Expected column name")) {
      suggestions.push("请检查SELECT子句中的列名");
    }

    return suggestions;
  }
}

// 使用示例
const analyzer = new SQLAnalyzer();

const testQueries = [
  "SELECT * FROM users",
  `SELECT u.name, COUNT(o.id) as order_count
   FROM users u
   LEFT JOIN orders o ON u.id = o.user_id
   GROUP BY u.name
   HAVING COUNT(o.id) > 5`,
  "SELECT * FROM users WHERE 1=1", // 可能的安全问题
];

testQueries.forEach((sql, index) => {
  console.log(`\n查询 ${index + 1} 分析结果:`);
  const analysis = analyzer.analyze(sql);

  if (analysis.valid) {
    console.log(`✓ 类型: ${analysis.type}`);
    console.log(`  复杂度: ${analysis.complexity}`);
    console.log(`  特性: ${analysis.features.join(", ")}`);
    console.log(`  涉及表: ${analysis.tables.join(", ")}`);

    if (analysis.performance.length > 0) {
      console.log("  性能建议:");
      analysis.performance.forEach((issue) => {
        console.log(`    ${issue.type}: ${issue.message}`);
      });
    }

    if (analysis.security.length > 0) {
      console.log("  安全警告:");
      analysis.security.forEach((issue) => {
        console.log(`    ${issue.type}: ${issue.message}`);
      });
    }
  } else {
    console.log(`✗ 无效: ${analysis.error}`);
    if (analysis.suggestions.length > 0) {
      console.log("  建议:");
      analysis.suggestions.forEach((suggestion) => {
        console.log(`    - ${suggestion}`);
      });
    }
  }
});
```

### SQL 格式化工具

```javascript
import { parseSQL } from "sql-parser-js";

class SQLFormatter {
  constructor(options = {}) {
    this.options = {
      indent: "  ",
      keywordCase: "upper", // 'upper', 'lower', 'preserve'
      lineBreakAfterKeywords: true,
      alignColumns: true,
      ...options,
    };
  }

  format(sql) {
    const result = parseSQL(sql);

    if (!result.success) {
      throw new Error(`无法格式化SQL: ${result.error.message}`);
    }

    return this.formatAST(result.ast, 0);
  }

  formatAST(node, depth = 0) {
    if (!node || typeof node !== "object") return "";

    const indent = this.options.indent.repeat(depth);

    switch (node.type) {
      case "SelectStatement":
        return this.formatSelectStatement(node, depth);
      case "InsertStatement":
        return this.formatInsertStatement(node, depth);
      case "UpdateStatement":
        return this.formatUpdateStatement(node, depth);
      case "DeleteStatement":
        return this.formatDeleteStatement(node, depth);
      default:
        return "";
    }
  }

  formatSelectStatement(node, depth) {
    const indent = this.options.indent.repeat(depth);
    let sql = "";

    // SELECT子句
    sql += this.keyword("SELECT");
    if (node.distinct) {
      sql += " " + this.keyword("DISTINCT");
    }

    if (this.options.lineBreakAfterKeywords) {
      sql += "\n" + indent + this.options.indent;
    } else {
      sql += " ";
    }

    // 格式化列
    const columns = node.columns
      .map((col) => this.formatExpression(col))
      .join(",\n" + indent + this.options.indent);
    sql += columns;

    // FROM子句
    if (node.from) {
      sql += "\n" + indent + this.keyword("FROM") + " ";
      sql += node.from.tables
        .map((table) => this.formatExpression(table))
        .join(", ");
    }

    // JOIN子句
    if (node.joins && node.joins.length > 0) {
      node.joins.forEach((join) => {
        sql += "\n" + indent + this.formatJoin(join);
      });
    }

    // WHERE子句
    if (node.where) {
      sql += "\n" + indent + this.keyword("WHERE") + " ";
      sql += this.formatExpression(node.where);
    }

    // GROUP BY子句
    if (node.groupBy) {
      sql += "\n" + indent + this.keyword("GROUP BY") + " ";
      sql += node.groupBy.expressions
        .map((expr) => this.formatExpression(expr))
        .join(", ");
    }

    // HAVING子句
    if (node.having) {
      sql += "\n" + indent + this.keyword("HAVING") + " ";
      sql += this.formatExpression(node.having);
    }

    // ORDER BY子句
    if (node.orderBy) {
      sql += "\n" + indent + this.keyword("ORDER BY") + " ";
      sql += node.orderBy.expressions
        .map((expr) => {
          return (
            this.formatExpression(expr.expression) +
            (expr.direction ? " " + this.keyword(expr.direction) : "")
          );
        })
        .join(", ");
    }

    // LIMIT子句
    if (node.limit) {
      sql += "\n" + indent + this.keyword("LIMIT") + " " + node.limit.count;
      if (node.limit.offset) {
        sql += " " + this.keyword("OFFSET") + " " + node.limit.offset;
      }
    }

    return sql;
  }

  formatExpression(node) {
    if (!node) return "";

    switch (node.type) {
      case "Column":
        return (node.table ? node.table + "." : "") + node.name;

      case "Identifier":
        return (
          node.name +
          (node.alias ? " " + this.keyword("AS") + " " + node.alias : "")
        );

      case "BinaryExpression":
        return (
          this.formatExpression(node.left) +
          " " +
          node.operator +
          " " +
          this.formatExpression(node.right)
        );

      case "FunctionCall":
        const args = node.arguments
          .map((arg) => this.formatExpression(arg))
          .join(", ");
        return node.name.toUpperCase() + "(" + args + ")";

      case "StringLiteral":
        return `'${node.value}'`;

      case "NumberLiteral":
        return node.value.toString();

      case "BooleanLiteral":
        return node.value ? this.keyword("TRUE") : this.keyword("FALSE");

      case "NullLiteral":
        return this.keyword("NULL");

      default:
        return node.value || "";
    }
  }

  keyword(word) {
    switch (this.options.keywordCase) {
      case "upper":
        return word.toUpperCase();
      case "lower":
        return word.toLowerCase();
      default:
        return word;
    }
  }
}

// 使用示例
const formatter = new SQLFormatter({
  indent: "  ",
  keywordCase: "upper",
  lineBreakAfterKeywords: true,
});

const messySQL = `select u.id,u.name,count(o.id) as order_count from users u left join orders o on u.id=o.user_id where u.active=true group by u.id,u.name having count(o.id)>5 order by order_count desc limit 10`;

try {
  const formattedSQL = formatter.format(messySQL);
  console.log("格式化后的SQL:");
  console.log(formattedSQL);
} catch (error) {
  console.error("格式化失败:", error.message);
}
```

这些示例展示了 SQL Parser JS 库的各种使用场景，从基本的解析和验证到复杂的 AST 操作和实际应用。通过这些示例，您可以了解如何在实际项目中有效地使用这个库。

### SQL 查询优化建议工具

```javascript
import { parseSQL } from "sql-parser-js";

class SQLOptimizer {
  constructor() {
    this.rules = [
      this.checkSelectStar,
      this.checkMissingWhere,
      this.checkUnindexedColumns,
      this.checkComplexJoins,
      this.checkSubqueryOptimization,
    ];
  }

  optimize(sql) {
    const result = parseSQL(sql);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    const suggestions = [];
    
    this.rules.forEach(rule => {
      const ruleSuggestions = rule.call(this, result.ast, sql);
      suggestions.push(...ruleSuggestions);
    });

    return {
      success: true,
      originalSQL: sql,
      suggestions,
      optimizedSQL: this.applyOptimizations(sql, suggestions),
    };
  }

  checkSelectStar(ast, sql) {
    const suggestions = [];
    
    if (ast.type === 'SelectStatement') {
      const hasSelectStar = ast.columns.some(col => 
        col.type === 'Column' && col.name === '*'
      );
      
      if (hasSelectStar) {
        suggestions.push({
          type: 'performance',
          severity: 'medium',
          message: '避免使用 SELECT *，明确指定需要的列',
          rule: 'avoid-select-star',
          suggestion: '将 SELECT * 替换为具体的列名',
        });
      }
    }
    
    return suggestions;
  }

  checkMissingWhere(ast, sql) {
    const suggestions = [];
    
    if (ast.type === 'SelectStatement' && !ast.where && !ast.limit) {
      suggestions.push({
        type: 'performance',
        severity: 'high',
        message: '查询缺少 WHERE 条件和 LIMIT，可能返回大量数据',
        rule: 'missing-where-clause',
        suggestion: '添加适当的 WHERE 条件或 LIMIT 子句',
      });
    }
    
    return suggestions;
  }

  checkComplexJoins(ast, sql) {
    const suggestions = [];
    
    if (ast.type === 'SelectStatement' && ast.joins && ast.joins.length > 3) {
      suggestions.push({
        type: 'performance',
        severity: 'medium',
        message: `查询包含 ${ast.joins.length} 个 JOIN，可能影响性能`,
        rule: 'complex-joins',
        suggestion: '考虑拆分查询或使用子查询优化',
      });
    }
    
    return suggestions;
  }

  applyOptimizations(sql, suggestions) {
    let optimizedSQL = sql;
    
    // 这里可以实现自动优化逻辑
    // 例如：自动添加 LIMIT，优化 JOIN 顺序等
    
    return optimizedSQL;
  }
}

// 使用示例
const optimizer = new SQLOptimizer();

const testSQL = `
  SELECT *
  FROM users u
  JOIN orders o ON u.id = o.user_id
  JOIN products p ON o.product_id = p.id
  JOIN categories c ON p.category_id = c.id
  JOIN suppliers s ON p.supplier_id = s.id
`;

const optimization = optimizer.optimize(testSQL);

if (optimization.success) {
  console.log('优化建议:');
  optimization.suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. [${suggestion.severity.toUpperCase()}] ${suggestion.message}`);
    console.log(`   建议: ${suggestion.suggestion}`);
  });
} else {
  console.error('优化失败:', optimization.error);
}
```

### 数据库迁移工具

```javascript
import { parseSQL } from "sql-parser-js";

class DatabaseMigrationHelper {
  constructor(sourceDialect, targetDialect) {
    this.sourceDialect = sourceDialect;
    this.targetDialect = targetDialect;
    this.typeMapping = this.getTypeMapping();
    this.functionMapping = this.getFunctionMapping();
  }

  convertSQL(sql) {
    const result = parseSQL(sql);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    try {
      const convertedAST = this.convertAST(result.ast);
      const convertedSQL = this.astToSQL(convertedAST);
      
      return {
        success: true,
        originalSQL: sql,
        convertedSQL,
        warnings: this.getConversionWarnings(result.ast),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  convertAST(ast) {
    // 深拷贝 AST
    const convertedAST = JSON.parse(JSON.stringify(ast));
    
    // 递归转换 AST 节点
    this.traverseAndConvert(convertedAST);
    
    return convertedAST;
  }

  traverseAndConvert(node) {
    if (!node || typeof node !== 'object') return;

    // 转换函数调用
    if (node.type === 'FunctionCall') {
      this.convertFunction(node);
    }

    // 转换数据类型
    if (node.type === 'DataType') {
      this.convertDataType(node);
    }

    // 递归处理子节点
    Object.values(node).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => this.traverseAndConvert(item));
      } else {
        this.traverseAndConvert(value);
      }
    });
  }

  convertFunction(node) {
    const mapping = this.functionMapping[node.name.toUpperCase()];
    if (mapping) {
      node.name = mapping.name;
      if (mapping.transform) {
        mapping.transform(node);
      }
    }
  }

  getTypeMapping() {
    // MySQL to PostgreSQL 类型映射示例
    if (this.sourceDialect === 'mysql' && this.targetDialect === 'postgresql') {
      return {
        'TINYINT': 'SMALLINT',
        'MEDIUMINT': 'INTEGER',
        'BIGINT': 'BIGINT',
        'DATETIME': 'TIMESTAMP',
        'TEXT': 'TEXT',
        'LONGTEXT': 'TEXT',
        'BLOB': 'BYTEA',
        'LONGBLOB': 'BYTEA',
      };
    }
    return {};
  }

  getFunctionMapping() {
    // MySQL to PostgreSQL 函数映射示例
    if (this.sourceDialect === 'mysql' && this.targetDialect === 'postgresql') {
      return {
        'NOW': { name: 'NOW' },
        'CONCAT': { 
          name: 'CONCAT',
          transform: (node) => {
            // PostgreSQL 使用 || 操作符进行字符串连接
            if (node.arguments.length === 2) {
              node.type = 'BinaryExpression';
              node.operator = '||';
              node.left = node.arguments[0];
              node.right = node.arguments[1];
              delete node.name;
              delete node.arguments;
            }
          }
        },
        'IFNULL': { 
          name: 'COALESCE',
        },
        'LIMIT': {
          name: 'LIMIT',
        },
      };
    }
    return {};
  }

  getConversionWarnings(ast) {
    const warnings = [];
    
    // 检查可能需要手动调整的部分
    this.checkForWarnings(ast, warnings);
    
    return warnings;
  }

  checkForWarnings(node, warnings) {
    if (!node || typeof node !== 'object') return;

    // 检查自增字段
    if (node.type === 'ColumnDefinition' && node.autoIncrement) {
      warnings.push({
        type: 'manual_review',
        message: '自增字段可能需要手动调整语法',
      });
    }

    // 检查存储引擎
    if (node.type === 'CreateTableStatement' && node.engine) {
      warnings.push({
        type: 'manual_review',
        message: '存储引擎设置在目标数据库中可能不适用',
      });
    }

    // 递归检查
    Object.values(node).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => this.checkForWarnings(item, warnings));
      } else {
        this.checkForWarnings(value, warnings);
      }
    });
  }
}

// 使用示例
const migrationHelper = new DatabaseMigrationHelper('mysql', 'postgresql');

const mysqlSQL = `
  SELECT 
    CONCAT(first_name, ' ', last_name) as full_name,
    IFNULL(email, 'no-email') as email_address,
    NOW() as current_time
  FROM users
  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  LIMIT 100
`;

const conversion = migrationHelper.convertSQL(mysqlSQL);

if (conversion.success) {
  console.log('原始 SQL (MySQL):');
  console.log(conversion.originalSQL);
  console.log('\n转换后 SQL (PostgreSQL):');
  console.log(conversion.convertedSQL);
  
  if (conversion.warnings.length > 0) {
    console.log('\n转换警告:');
    conversion.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning.message}`);
    });
  }
} else {
  console.error('转换失败:', conversion.error);
}
```

### SQL 安全审计工具

```javascript
import { parseSQL } from "sql-parser-js";

class SQLSecurityAuditor {
  constructor() {
    this.securityRules = [
      this.checkSQLInjection,
      this.checkPrivilegeEscalation,
      this.checkDataExfiltration,
      this.checkUnsafeOperations,
    ];
  }

  audit(sql, context = {}) {
    const result = parseSQL(sql);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    const findings = [];
    
    this.securityRules.forEach(rule => {
      const ruleFindings = rule.call(this, result.ast, sql, context);
      findings.push(...ruleFindings);
    });

    return {
      success: true,
      sql,
      riskLevel: this.calculateRiskLevel(findings),
      findings,
      recommendations: this.generateRecommendations(findings),
    };
  }

  checkSQLInjection(ast, sql, context) {
    const findings = [];
    
    // 检查常见的 SQL 注入模式
    const injectionPatterns = [
      { pattern: /union\s+select/i, risk: 'high', description: 'UNION SELECT 注入' },
      { pattern: /;\s*drop\s+table/i, risk: 'critical', description: 'DROP TABLE 注入' },
      { pattern: /;\s*delete\s+from/i, risk: 'high', description: 'DELETE 注入' },
      { pattern: /'\s*or\s+'1'\s*=\s*'1/i, risk: 'high', description: '经典布尔注入' },
      { pattern: /'\s*or\s+1\s*=\s*1/i, risk: 'high', description: '数字布尔注入' },
    ];

    injectionPatterns.forEach(({ pattern, risk, description }) => {
      if (pattern.test(sql)) {
        findings.push({
          type: 'sql_injection',
          risk,
          description,
          location: this.findPatternLocation(sql, pattern),
        });
      }
    });

    return findings;
  }

  checkPrivilegeEscalation(ast, sql, context) {
    const findings = [];
    
    // 检查危险的系统函数调用
    const dangerousFunctions = [
      'LOAD_FILE', 'INTO OUTFILE', 'INTO DUMPFILE',
      'SYSTEM', 'EXEC', 'EXECUTE',
    ];

    this.traverseAST(ast, (node) => {
      if (node.type === 'FunctionCall') {
        const funcName = node.name.toUpperCase();
        if (dangerousFunctions.includes(funcName)) {
          findings.push({
            type: 'privilege_escalation',
            risk: 'critical',
            description: `使用了危险函数: ${funcName}`,
            function: funcName,
          });
        }
      }
    });

    return findings;
  }

  checkDataExfiltration(ast, sql, context) {
    const findings = [];
    
    if (ast.type === 'SelectStatement') {
      // 检查 SELECT * 可能导致的数据泄露
      const hasSelectAll = ast.columns.some(col => 
        col.type === 'Column' && col.name === '*'
      );
      
      if (hasSelectAll && !ast.where && !ast.limit) {
        findings.push({
          type: 'data_exfiltration',
          risk: 'medium',
          description: 'SELECT * 查询没有限制条件，可能导致大量数据泄露',
        });
      }

      // 检查敏感表访问
      const sensitiveTables = ['users', 'passwords', 'tokens', 'sessions'];
      const accessedTables = this.extractTableNames(ast);
      
      accessedTables.forEach(table => {
        if (sensitiveTables.includes(table.toLowerCase())) {
          findings.push({
            type: 'data_exfiltration',
            risk: 'medium',
            description: `访问敏感表: ${table}`,
            table,
          });
        }
      });
    }

    return findings;
  }

  checkUnsafeOperations(ast, sql, context) {
    const findings = [];
    
    // 检查批量删除操作
    if (ast.type === 'DeleteStatement' && !ast.where) {
      findings.push({
        type: 'unsafe_operation',
        risk: 'critical',
        description: 'DELETE 语句没有 WHERE 条件，将删除所有数据',
      });
    }

    // 检查批量更新操作
    if (ast.type === 'UpdateStatement' && !ast.where) {
      findings.push({
        type: 'unsafe_operation',
        risk: 'high',
        description: 'UPDATE 语句没有 WHERE 条件，将更新所有记录',
      });
    }

    return findings;
  }

  calculateRiskLevel(findings) {
    if (findings.some(f => f.risk === 'critical')) return 'critical';
    if (findings.some(f => f.risk === 'high')) return 'high';
    if (findings.some(f => f.risk === 'medium')) return 'medium';
    return 'low';
  }

  generateRecommendations(findings) {
    const recommendations = [];
    
    findings.forEach(finding => {
      switch (finding.type) {
        case 'sql_injection':
          recommendations.push('使用参数化查询或预处理语句');
          recommendations.push('对用户输入进行严格验证和转义');
          break;
        case 'privilege_escalation':
          recommendations.push('限制数据库用户权限');
          recommendations.push('禁用危险的系统函数');
          break;
        case 'data_exfiltration':
          recommendations.push('明确指定需要的列，避免使用 SELECT *');
          recommendations.push('添加适当的 WHERE 条件和 LIMIT 限制');
          break;
        case 'unsafe_operation':
          recommendations.push('为 DELETE 和 UPDATE 语句添加 WHERE 条件');
          recommendations.push('在生产环境中禁用批量操作');
          break;
      }
    });

    return [...new Set(recommendations)]; // 去重
  }

  traverseAST(node, callback) {
    if (!node || typeof node !== 'object') return;
    
    callback(node);
    
    Object.values(node).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => this.traverseAST(item, callback));
      } else {
        this.traverseAST(value, callback);
      }
    });
  }

  extractTableNames(ast) {
    const tables = [];
    
    this.traverseAST(ast, (node) => {
      if (node.type === 'Identifier' && node.context === 'table') {
        tables.push(node.name);
      }
    });
    
    return tables;
  }

  findPatternLocation(sql, pattern) {
    const match = sql.match(pattern);
    if (match) {
      const lines = sql.substring(0, match.index).split('\n');
      return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
      };
    }
    return null;
  }
}

// 使用示例
const auditor = new SQLSecurityAuditor();

const suspiciousQueries = [
  "SELECT * FROM users WHERE id = 1 OR 1=1",
  "SELECT * FROM users; DROP TABLE users; --",
  "DELETE FROM logs",
  "SELECT LOAD_FILE('/etc/passwd')",
];

suspiciousQueries.forEach((sql, index) => {
  console.log(`\n审计查询 ${index + 1}:`);
  console.log(sql);
  
  const audit = auditor.audit(sql);
  
  if (audit.success) {
    console.log(`风险级别: ${audit.riskLevel.toUpperCase()}`);
    
    if (audit.findings.length > 0) {
      console.log('安全问题:');
      audit.findings.forEach((finding, i) => {
        console.log(`  ${i + 1}. [${finding.risk.toUpperCase()}] ${finding.description}`);
      });
      
      console.log('建议:');
      audit.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    } else {
      console.log('✓ 未发现安全问题');
    }
  } else {
    console.error('审计失败:', audit.error);
  }
});
```

## 最佳实践

### 1. 性能优化建议

```javascript
// ✅ 好的做法：缓存解析结果
const parseCache = new Map();

function optimizedParseSQL(sql) {
  const key = sql.trim().toLowerCase();
  
  if (parseCache.has(key)) {
    return parseCache.get(key);
  }
  
  const result = parseSQL(sql);
  parseCache.set(key, result);
  
  return result;
}

// ✅ 好的做法：批量处理
function batchParseSQL(sqlArray) {
  return sqlArray.map(sql => ({
    sql,
    result: optimizedParseSQL(sql)
  }));
}
```

### 2. 错误处理最佳实践

```javascript
// ✅ 好的做法：详细的错误处理
function safeParseSQL(sql) {
  try {
    const result = parseSQL(sql);
    
    if (!result.success) {
      return {
        success: false,
        error: {
          type: 'parse_error',
          message: result.error.message,
          line: result.error.line,
          column: result.error.column,
          sql: sql,
        }
      };
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'unexpected_error',
        message: error.message,
        sql: sql,
      }
    };
  }
}
```

### 3. 类型安全使用

```javascript
// ✅ 好的做法：类型检查和验证
function validateSelectStatement(ast) {
  if (ast.type !== 'SelectStatement') {
    throw new Error('Expected SelectStatement');
  }
  
  // 验证必需字段
  if (!ast.columns || !Array.isArray(ast.columns)) {
    throw new Error('Invalid columns in SelectStatement');
  }
  
  return true;
}

// 使用示例
const result = parseSQL('SELECT * FROM users');
if (result.success) {
  try {
    validateSelectStatement(result.ast);
    // 安全地使用 AST
    console.log('Columns:', result.ast.columns);
  } catch (error) {
    console.error('AST validation failed:', error.message);
  }
}
```

通过这些扩展示例和最佳实践，您可以更好地理解和使用 SQL Parser JS 库，构建更安全、更高效的 SQL 处理应用程序。
