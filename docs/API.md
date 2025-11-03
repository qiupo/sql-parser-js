# API 文档

## 目录

- [主要API](#主要api)
  - [parseSQL](#parsesql)
  - [analyzeSQL](#analyzesql) ⭐ 新功能
  - [validateSQL](#validatesql)
  - [extractTables](#extracttables)
  - [extractColumns](#extractcolumns)
- [核心类](#核心类)
  - [Lexer](#lexer)
  - [Parser](#parser)
  - [SQLError](#sqlerror)
- [AST节点类型](#ast节点类型)
- [选项配置](#选项配置)

## 主要API

### parseSQL

解析SQL语句并返回抽象语法树(AST)。

```typescript
function parseSQL(sqlString: string, options?: ParserOptions): ParseResult
```

**参数:**

- `sqlString` (string): 要解析的SQL语句
- `options` (ParserOptions, 可选): 解析选项

**返回值:**

```typescript
interface ParseResult {
  success: boolean;
  ast?: ASTNode;
  tables?: string[];
  columns?: string[];
  error?: SQLError;
}
```

**示例:**

```javascript
import { parseSQL } from 'sql-parser-js';

// 基本用法
const result = parseSQL('SELECT id, name FROM users WHERE age > 18');

if (result.success) {
  console.log('解析成功');
  console.log('AST:', result.ast);
  console.log('涉及的表:', result.tables); // ['users']
  console.log('涉及的字段:', result.columns); // ['id', 'name', 'age']
} else {
  console.error('解析失败:', result.error.message);
}

// 带选项的用法
const resultWithOptions = parseSQL(`
  SELECT * FROM users -- 获取所有用户
  WHERE active = 1
`, {
  includeComments: true,
  strict: false
});
```

**支持的SQL语句类型:**

- SELECT语句（包括JOIN、子查询、聚合函数等）
- INSERT语句（单行和多行插入）
- UPDATE语句（单表和多表更新）
- DELETE语句（条件删除）

### analyzeSQL ⭐ 新功能

智能分析SQL查询，提取结构化信息用于生成查询配置界面。

```typescript
function analyzeSQL(sqlString: string): AnalysisResult
```

**参数:**

- `sqlString` (string): 要分析的SQL查询语句

**返回值:**

```typescript
interface AnalysisResult {
  analysis: QueryAnalysis;
  complexity: ComplexityInfo;
}

interface QueryAnalysis {
  conditions: Condition[];
  fields: Field[];
  tables: Table[];
  joins: Join[];
  groupBy: string[];
  orderBy: OrderBy[];
  limit?: number;
  offset?: number;
}

interface Condition {
  field: string;
  operator: string;
  value: any;
  type: 'equality' | 'comparison' | 'pattern' | 'range' | 'list' | 'null';
}

interface Field {
  name: string;
  type: 'column' | 'aggregate' | 'expression';
  aggregateFunction?: string;
  alias?: string;
}

interface Table {
  name: string;
  alias?: string;
}

interface Join {
  type: string;
  table: string;
  condition: string;
}

interface OrderBy {
  field: string;
  direction: 'ASC' | 'DESC';
}

interface ComplexityInfo {
  level: 'simple' | 'medium' | 'complex';
  score: number;
  factors: string[];
}
```

**示例:**

```javascript
import { analyzeSQL } from 'sql-parser-js';

// 基本查询分析
const basicAnalysis = analyzeSQL(`
  SELECT goods_name, liveroom_id 
  FROM goods_stat_daily 
  WHERE goods_name LIKE '%test%' AND liveroom_id = 'room123'
`);

console.log(basicAnalysis.analysis.conditions);
// [
//   { field: "goods_name", operator: "LIKE", value: "%test%", type: "pattern" },
//   { field: "liveroom_id", operator: "=", value: "room123", type: "equality" }
// ]

console.log(basicAnalysis.analysis.fields);
// [
//   { name: "goods_name", type: "column" },
//   { name: "liveroom_id", type: "column" }
// ]

console.log(basicAnalysis.complexity);
// { level: "simple", score: 4, factors: ["2个查询条件"] }

// 复杂查询分析
const complexAnalysis = analyzeSQL(`
  SELECT 
    u.department,
    COUNT(*) as user_count,
    AVG(p.view_count) as avg_views
  FROM users u
  LEFT JOIN posts p ON u.id = p.user_id
  WHERE u.active = true 
    AND u.created_at BETWEEN '2023-01-01' AND '2023-12-31'
    AND p.status IN ('published', 'featured')
  GROUP BY u.department
  ORDER BY user_count DESC, avg_views DESC
  LIMIT 50
`);

console.log(complexAnalysis.analysis.conditions);
// [
//   { field: "u.active", operator: "=", value: true, type: "equality" },
//   { field: "u.created_at", operator: "BETWEEN", value: ["2023-01-01", "2023-12-31"], type: "range" },
//   { field: "p.status", operator: "IN", value: ["published", "featured"], type: "list" }
// ]

console.log(complexAnalysis.analysis.fields);
// [
//   { name: "u.department", type: "column" },
//   { name: "user_count", type: "aggregate", aggregateFunction: "COUNT", alias: "user_count" },
//   { name: "avg_views", type: "aggregate", aggregateFunction: "AVG", alias: "avg_views" }
// ]

console.log(complexAnalysis.analysis.joins);
// [
//   { type: "LEFT JOIN", table: "posts", condition: "u.id = p.user_id" }
// ]

console.log(complexAnalysis.complexity);
// { level: "medium", score: 15, factors: ["3个查询条件", "聚合函数", "GROUP BY", "ORDER BY"] }
```

**支持的查询条件类型:**

- **equality**: 等值比较 (`=`, `!=`, `<>`)
- **comparison**: 数值比较 (`>`, `<`, `>=`, `<=`)
- **pattern**: 模式匹配 (`LIKE`, `NOT LIKE`)
- **range**: 范围查询 (`BETWEEN`, `NOT BETWEEN`)
- **list**: 列表查询 (`IN`, `NOT IN`)
- **null**: 空值检查 (`IS NULL`, `IS NOT NULL`)

**复杂度评估:**

- **simple** (0-5分): 基本查询，少量条件
- **medium** (6-15分): 中等复杂度，包含JOIN、聚合等
- **complex** (16+分): 高复杂度，多表JOIN、子查询、复杂条件

**使用场景:**

- 生成查询配置界面
- 查询复杂度评估
- SQL查询优化建议
- BI工具开发

### validateSQL

验证SQL语句的语法正确性。

```typescript
function validateSQL(sqlString: string): ValidationResult
```

**参数:**

- `sqlString` (string): 要验证的SQL语句

**返回值:**

```typescript
interface ValidationResult {
  valid: boolean;
  errors: SQLError[];
}
```

**示例:**

```javascript
import { validateSQL } from 'sql-parser-js';

// 有效的SQL
const valid = validateSQL('SELECT * FROM users');
console.log(valid.valid); // true
console.log(valid.errors); // []

// 无效的SQL
const invalid = validateSQL('SELECT * FROM');
console.log(invalid.valid); // false
console.log(invalid.errors); 
// [
//   {
//     message: 'Expected table name after FROM',
//     code: 'SYNTAX_ERROR',
//     line: 1,
//     column: 15
//   }
// ]
```

### extractTables

从SQL语句中提取所有表名。

```typescript
function extractTables(sqlString: string): string[]
```

**参数:**

- `sqlString` (string): SQL语句

**返回值:**

- `string[]`: 表名数组

**示例:**

```javascript
import { extractTables } from 'sql-parser-js';

const tables1 = extractTables('SELECT * FROM users');
console.log(tables1); // ['users']

const tables2 = extractTables(`
  SELECT u.name, o.total 
  FROM users u 
  JOIN orders o ON u.id = o.user_id
  LEFT JOIN products p ON o.product_id = p.id
`);
console.log(tables2); // ['users', 'orders', 'products']

const tables3 = extractTables(`
  INSERT INTO user_logs (user_id, action) 
  SELECT id, 'login' FROM users WHERE active = 1
`);
console.log(tables3); // ['user_logs', 'users']
```

### extractColumns

从SQL语句中提取所有字段名。

```typescript
function extractColumns(sqlString: string): string[]
```

**参数:**

- `sqlString` (string): SQL语句

**返回值:**

- `string[]`: 字段名数组

**示例:**

```javascript
import { extractColumns } from 'sql-parser-js';

const columns1 = extractColumns('SELECT id, name, email FROM users');
console.log(columns1); // ['id', 'name', 'email']

const columns2 = extractColumns(`
  SELECT u.id, u.name, o.total, p.title
  FROM users u
  JOIN orders o ON u.id = o.user_id
  JOIN products p ON o.product_id = p.id
  WHERE u.active = 1 AND o.status = 'completed'
`);
console.log(columns2); // ['id', 'name', 'total', 'title', 'active', 'status']

const columns3 = extractColumns(`
  UPDATE users 
  SET name = 'John', email = 'john@example.com', updated_at = NOW()
  WHERE id = 1
`);
console.log(columns3); // ['name', 'email', 'updated_at', 'id']
```

## 核心类

### Lexer

词法分析器，将SQL字符串转换为token序列。

```typescript
class Lexer {
  constructor(input: string, options?: LexerOptions);
  tokenize(): Token[];
}
```

**构造函数参数:**

- `input` (string): 要分析的SQL字符串
- `options` (LexerOptions, 可选): 词法分析选项

**方法:**

- `tokenize()`: 返回token数组

**示例:**

```javascript
import { Lexer } from 'sql-parser-js';

const lexer = new Lexer('SELECT * FROM users WHERE id = 1');
const tokens = lexer.tokenize();

tokens.forEach(token => {
  console.log(`${token.type}: ${token.value} (${token.line}:${token.column})`);
});

// 输出:
// KEYWORD: SELECT (1:1)
// OPERATOR: * (1:8)
// KEYWORD: FROM (1:10)
// IDENTIFIER: users (1:15)
// KEYWORD: WHERE (1:21)
// IDENTIFIER: id (1:27)
// OPERATOR: = (1:30)
// NUMBER: 1 (1:32)
// EOF:  (1:33)
```

**词法分析选项:**

```typescript
interface LexerOptions {
  includeComments?: boolean;  // 是否包含注释token，默认false
  includeWhitespace?: boolean; // 是否包含空白字符token，默认false
  caseSensitive?: boolean;    // 是否区分大小写，默认false
}
```

### Parser

语法分析器，将token序列转换为AST。

```typescript
class Parser {
  constructor(tokens: Token[], options?: ParserOptions);
  parse(): ASTNode;
}
```

**构造函数参数:**

- `tokens` (Token[]): 词法分析器生成的token数组
- `options` (ParserOptions, 可选): 语法分析选项

**方法:**

- `parse()`: 返回AST根节点

**示例:**

```javascript
import { Lexer, Parser } from 'sql-parser-js';

const lexer = new Lexer('SELECT id, name FROM users WHERE age > 18');
const tokens = lexer.tokenize();

const parser = new Parser(tokens);
const ast = parser.parse();

console.log(JSON.stringify(ast, null, 2));
```

### SQLError

SQL解析错误类。

```typescript
class SQLError extends Error {
  code: string;
  line: number;
  column: number;
  context?: string;
  
  static syntaxError(message: string, line: number, column: number): SQLError;
  static lexicalError(message: string, line: number, column: number): SQLError;
  static unexpectedToken(token: Token, expected?: string): SQLError;
  static unsupportedFeature(feature: string, line: number, column: number): SQLError;
}
```

**属性:**

- `message` (string): 错误消息
- `code` (string): 错误代码
- `line` (number): 错误行号
- `column` (number): 错误列号
- `context` (string, 可选): 错误上下文

**静态方法:**

- `syntaxError()`: 创建语法错误
- `lexicalError()`: 创建词法错误
- `unexpectedToken()`: 创建意外token错误
- `unsupportedFeature()`: 创建不支持特性错误

**示例:**

```javascript
import { parseSQL, SQLError } from 'sql-parser-js';

try {
  const result = parseSQL('SELECT * FROM');
  if (!result.success) {
    const error = result.error;
    console.log(`错误类型: ${error.code}`);
    console.log(`错误消息: ${error.message}`);
    console.log(`错误位置: 第${error.line}行，第${error.column}列`);
    if (error.context) {
      console.log(`错误上下文: ${error.context}`);
    }
  }
} catch (error) {
  if (error instanceof SQLError) {
    console.log('捕获到SQL错误:', error.message);
  }
}
```

## AST节点类型

### 语句节点

#### SelectStatement

```typescript
interface SelectStatement extends ASTNode {
  type: 'SelectStatement';
  distinct?: boolean;
  columns: (Column | Expression)[];
  from?: FromClause;
  joins?: JoinClause[];
  where?: Expression;
  groupBy?: GroupByClause;
  having?: Expression;
  orderBy?: OrderByClause;
  limit?: LimitClause;
}
```

#### InsertStatement

```typescript
interface InsertStatement extends ASTNode {
  type: 'InsertStatement';
  table: Identifier;
  columns?: Identifier[];
  values: Expression[][];
  select?: SelectStatement;
}
```

#### UpdateStatement

```typescript
interface UpdateStatement extends ASTNode {
  type: 'UpdateStatement';
  table: Identifier;
  set: Assignment[];
  where?: Expression;
}
```

#### DeleteStatement

```typescript
interface DeleteStatement extends ASTNode {
  type: 'DeleteStatement';
  from: Identifier;
  where?: Expression;
}
```

### 表达式节点

#### BinaryExpression

```typescript
interface BinaryExpression extends ASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}
```

#### FunctionCall

```typescript
interface FunctionCall extends ASTNode {
  type: 'FunctionCall';
  name: string;
  arguments: Expression[];
  distinct?: boolean;
}
```

#### CaseExpression

```typescript
interface CaseExpression extends ASTNode {
  type: 'CaseExpression';
  expression?: Expression;
  whenClauses: WhenClause[];
  elseClause?: Expression;
}
```

### 子句节点

#### FromClause

```typescript
interface FromClause extends ASTNode {
  type: 'FromClause';
  tables: (Identifier | SelectStatement)[];
}
```

#### JoinClause

```typescript
interface JoinClause extends ASTNode {
  type: 'JoinClause';
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
  table: Identifier | SelectStatement;
  condition?: Expression;
}
```

#### OrderByClause

```typescript
interface OrderByClause extends ASTNode {
  type: 'OrderByClause';
  expressions: OrderByExpression[];
}

interface OrderByExpression extends ASTNode {
  type: 'OrderByExpression';
  expression: Expression;
  direction: 'ASC' | 'DESC';
}
```

### 字面量节点

#### StringLiteral

```typescript
interface StringLiteral extends ASTNode {
  type: 'StringLiteral';
  value: string;
}
```

#### NumberLiteral

```typescript
interface NumberLiteral extends ASTNode {
  type: 'NumberLiteral';
  value: number;
}
```

#### BooleanLiteral

```typescript
interface BooleanLiteral extends ASTNode {
  type: 'BooleanLiteral';
  value: boolean;
}
```

#### NullLiteral

```typescript
interface NullLiteral extends ASTNode {
  type: 'NullLiteral';
  value: null;
}
```

## 选项配置

### ParserOptions

```typescript
interface ParserOptions {
  includeComments?: boolean;    // 是否包含注释，默认false
  strict?: boolean;             // 是否启用严格模式，默认false
  dialect?: 'standard' | 'mysql' | 'postgresql' | 'sqlite'; // SQL方言，默认'standard'
  maxDepth?: number;           // 最大解析深度，默认100
}
```

### LexerOptions

```typescript
interface LexerOptions {
  includeComments?: boolean;    // 是否包含注释token，默认false
  includeWhitespace?: boolean;  // 是否包含空白字符token，默认false
  caseSensitive?: boolean;      // 是否区分大小写，默认false
  bufferSize?: number;         // 缓冲区大小，默认4096
}
```

## 错误代码

| 错误代码 | 描述 |
|---------|------|
| `SYNTAX_ERROR` | 语法错误 |
| `LEXICAL_ERROR` | 词法错误 |
| `UNEXPECTED_TOKEN` | 意外的token |
| `UNEXPECTED_EOF` | 意外的文件结束 |
| `UNSUPPORTED_FEATURE` | 不支持的特性 |
| `INVALID_IDENTIFIER` | 无效的标识符 |
| `INVALID_NUMBER` | 无效的数字 |
| `INVALID_STRING` | 无效的字符串 |
| `UNTERMINATED_STRING` | 未终止的字符串 |
| `UNTERMINATED_COMMENT` | 未终止的注释 |

## 使用示例

### 复杂查询解析

```javascript
import { parseSQL } from 'sql-parser-js';

const complexSQL = `
  SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_spent,
    CASE 
      WHEN SUM(o.total) > 1000 THEN 'VIP'
      WHEN SUM(o.total) > 500 THEN 'Premium'
      ELSE 'Regular'
    END as customer_level
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.active = true
    AND u.created_at >= '2023-01-01'
  GROUP BY u.id, u.name, u.email
  HAVING COUNT(o.id) > 0
  ORDER BY total_spent DESC, u.name ASC
  LIMIT 100
`;

const result = parseSQL(complexSQL);
if (result.success) {
  console.log('解析成功');
  console.log('表名:', result.tables); // ['users', 'orders']
  console.log('字段名:', result.columns); // ['id', 'name', 'email', 'total', 'active', 'created_at', 'user_id']
  
  // 遍历AST
  const selectStmt = result.ast;
  console.log('查询列数:', selectStmt.columns.length);
  console.log('是否有JOIN:', selectStmt.joins && selectStmt.joins.length > 0);
  console.log('是否有GROUP BY:', !!selectStmt.groupBy);
  console.log('是否有ORDER BY:', !!selectStmt.orderBy);
}
```

### 批量SQL验证

```javascript
import { validateSQL } from 'sql-parser-js';

const sqlStatements = [
  'SELECT * FROM users',
  'INSERT INTO users (name) VALUES ("John")',
  'UPDATE users SET name = "Jane" WHERE id = 1',
  'DELETE FROM users WHERE active = false',
  'SELECT * FROM', // 无效SQL
  'INSERT INTO users VALUES', // 无效SQL
];

sqlStatements.forEach((sql, index) => {
  const validation = validateSQL(sql);
  console.log(`SQL ${index + 1}: ${validation.valid ? '有效' : '无效'}`);
  if (!validation.valid) {
    validation.errors.forEach(error => {
      console.log(`  错误: ${error.message} (${error.line}:${error.column})`);
    });
  }
});
```

### 自定义AST处理

```javascript
import { parseSQL } from 'sql-parser-js';

function analyzeSQL(sql) {
  const result = parseSQL(sql);
  if (!result.success) {
    return { error: result.error.message };
  }

  const analysis = {
    type: result.ast.type,
    complexity: 0,
    features: []
  };

  // 分析查询复杂度
  if (result.ast.type === 'SelectStatement') {
    const stmt = result.ast;
    
    // 基础复杂度
    analysis.complexity += 1;
    
    // JOIN增加复杂度
    if (stmt.joins && stmt.joins.length > 0) {
      analysis.complexity += stmt.joins.length * 2;
      analysis.features.push('JOIN');
    }
    
    // 子查询增加复杂度
    function countSubqueries(node) {
      let count = 0;
      if (node && typeof node === 'object') {
        if (node.type === 'SelectStatement') {
          count += 1;
        }
        Object.values(node).forEach(value => {
          if (Array.isArray(value)) {
            value.forEach(item => count += countSubqueries(item));
          } else {
            count += countSubqueries(value);
          }
        });
      }
      return count;
    }
    
    const subqueryCount = countSubqueries(stmt) - 1; // 减去主查询
    if (subqueryCount > 0) {
      analysis.complexity += subqueryCount * 3;
      analysis.features.push('SUBQUERY');
    }
    
    // 其他特性
    if (stmt.groupBy) {
      analysis.complexity += 1;
      analysis.features.push('GROUP BY');
    }
    
    if (stmt.having) {
      analysis.complexity += 1;
      analysis.features.push('HAVING');
    }
    
    if (stmt.orderBy) {
      analysis.complexity += 1;
      analysis.features.push('ORDER BY');
    }
  }

  return analysis;
}

// 使用示例
const analysis = analyzeSQL(`
  SELECT u.name, COUNT(o.id) as order_count
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.id IN (SELECT user_id FROM premium_users)
  GROUP BY u.id, u.name
  HAVING COUNT(o.id) > 5
  ORDER BY order_count DESC
`);

console.log(analysis);
// {
//   type: 'SelectStatement',
//   complexity: 9,
//   features: ['JOIN', 'SUBQUERY', 'GROUP BY', 'HAVING', 'ORDER BY']
// }
```