# 开发指南

本文档详细介绍了 SQL Parser JS 库的内部实现原理、架构设计和扩展方法。

## 目录

- [架构概览](#架构概览)
- [词法分析器](#词法分析器)
- [语法分析器](#语法分析器)
- [AST 设计](#ast设计)
- [错误处理](#错误处理)
- [性能优化](#性能优化)
- [扩展开发](#扩展开发)
- [测试策略](#测试策略)
- [构建系统](#构建系统)

## 架构概览

SQL Parser JS 采用经典的编译器前端架构，包含以下主要组件：

```
SQL字符串 → 词法分析器 → Token序列 → 语法分析器 → AST → API接口
```

### 核心组件

1. **词法分析器 (Lexer)**: 将 SQL 字符串转换为 Token 序列
2. **语法分析器 (Parser)**: 将 Token 序列转换为抽象语法树(AST)
3. **AST 节点**: 定义各种 SQL 语法结构的数据表示
4. **错误处理**: 提供详细的错误信息和恢复机制
5. **API 接口**: 提供用户友好的解析接口

### 项目结构

```
src/
├── index.js              # 主入口文件，导出公共API
├── lexer/                # 词法分析器模块
│   ├── lexer.js          # 词法分析器主类
│   └── token-types.js    # Token类型定义
├── parser/               # 语法分析器模块
│   └── parser.js         # 语法分析器主类
├── ast/                  # AST节点定义
│   └── ast-nodes.js      # 各种AST节点类型
└── errors/               # 错误处理
    └── sql-error.js      # SQL错误类定义
```

## 词法分析器

词法分析器负责将 SQL 字符串分解为有意义的 Token 序列。

### Token 类型

```javascript
// token-types.js
export const TokenType = {
  // 关键字
  KEYWORD: "KEYWORD",

  // 标识符和字面量
  IDENTIFIER: "IDENTIFIER",
  STRING: "STRING",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  NULL: "NULL",

  // 操作符
  OPERATOR: "OPERATOR",
  COMPARISON: "COMPARISON",
  LOGICAL: "LOGICAL",

  // 标点符号
  PUNCTUATION: "PUNCTUATION",
  COMMA: "COMMA",
  SEMICOLON: "SEMICOLON",
  DOT: "DOT",

  // 括号
  LEFT_PAREN: "LEFT_PAREN",
  RIGHT_PAREN: "RIGHT_PAREN",

  // 注释和空白
  COMMENT: "COMMENT",
  WHITESPACE: "WHITESPACE",

  // 特殊
  EOF: "EOF",
  UNKNOWN: "UNKNOWN",
};
```

### 词法分析流程

```javascript
// lexer.js 核心方法
class Lexer {
  tokenize() {
    const tokens = [];

    while (!this.isAtEnd()) {
      this.skipWhitespace();

      if (this.isAtEnd()) break;

      const start = this.current;
      const token = this.scanToken();

      if (token) {
        tokens.push(token);
      }
    }

    tokens.push(this.createToken(TokenType.EOF, "", this.line, this.column));
    return tokens;
  }

  scanToken() {
    const char = this.advance();

    // 处理不同类型的字符
    switch (char) {
      case "(":
        return this.createToken(TokenType.LEFT_PAREN, char);
      case ")":
        return this.createToken(TokenType.RIGHT_PAREN, char);
      case ",":
        return this.createToken(TokenType.COMMA, char);
      case ";":
        return this.createToken(TokenType.SEMICOLON, char);
      case ".":
        return this.createToken(TokenType.DOT, char);

      // 字符串字面量
      case "'":
      case '"':
        return this.readString(char);

      // 注释
      case "/":
        if (this.peek() === "*") {
          return this.readMultiLineComment();
        }
        break;
      case "-":
        if (this.peek() === "-") {
          return this.readSingleLineComment();
        }
        break;

      default:
        // 数字
        if (this.isDigit(char)) {
          return this.readNumber();
        }

        // 标识符或关键字
        if (this.isAlpha(char)) {
          return this.readIdentifier();
        }

        // 操作符
        if (this.isOperatorChar(char)) {
          return this.readOperator();
        }

        // 未知字符
        throw SQLError.lexicalError(
          `Unexpected character: ${char}`,
          this.line,
          this.column
        );
    }
  }
}
```

### 关键字识别

```javascript
// 关键字映射表
export const KEYWORDS = {
  // 查询关键字
  SELECT: TokenType.KEYWORD,
  FROM: TokenType.KEYWORD,
  WHERE: TokenType.KEYWORD,
  GROUP: TokenType.KEYWORD,
  BY: TokenType.KEYWORD,
  HAVING: TokenType.KEYWORD,
  ORDER: TokenType.KEYWORD,
  LIMIT: TokenType.KEYWORD,
  OFFSET: TokenType.KEYWORD,

  // JOIN关键字
  JOIN: TokenType.KEYWORD,
  INNER: TokenType.KEYWORD,
  LEFT: TokenType.KEYWORD,
  RIGHT: TokenType.KEYWORD,
  FULL: TokenType.KEYWORD,
  CROSS: TokenType.KEYWORD,
  ON: TokenType.KEYWORD,

  // 数据操作关键字
  INSERT: TokenType.KEYWORD,
  INTO: TokenType.KEYWORD,
  VALUES: TokenType.KEYWORD,
  UPDATE: TokenType.KEYWORD,
  SET: TokenType.KEYWORD,
  DELETE: TokenType.KEYWORD,

  // 逻辑操作符
  AND: TokenType.LOGICAL,
  OR: TokenType.LOGICAL,
  NOT: TokenType.LOGICAL,
  IN: TokenType.LOGICAL,
  LIKE: TokenType.LOGICAL,
  BETWEEN: TokenType.LOGICAL,
  IS: TokenType.LOGICAL,

  // 字面量
  TRUE: TokenType.BOOLEAN,
  FALSE: TokenType.BOOLEAN,
  NULL: TokenType.NULL,

  // 其他
  AS: TokenType.KEYWORD,
  DISTINCT: TokenType.KEYWORD,
  ALL: TokenType.KEYWORD,
  CASE: TokenType.KEYWORD,
  WHEN: TokenType.KEYWORD,
  THEN: TokenType.KEYWORD,
  ELSE: TokenType.KEYWORD,
  END: TokenType.KEYWORD,
};

// 关键字识别函数
function getKeywordType(text) {
  const upperText = text.toUpperCase();
  return KEYWORDS[upperText] || TokenType.IDENTIFIER;
}
```

## 语法分析器

语法分析器使用递归下降解析技术，将 Token 序列转换为 AST。

### 解析器架构

```javascript
class Parser {
  constructor(tokens, options = {}) {
    this.tokens = tokens;
    this.current = 0;
    this.options = options;
  }

  // 主解析方法
  parse() {
    try {
      return this.parseStatement();
    } catch (error) {
      if (error instanceof SQLError) {
        throw error;
      }
      throw SQLError.syntaxError(
        error.message,
        this.getCurrentLine(),
        this.getCurrentColumn()
      );
    }
  }

  // 解析语句
  parseStatement() {
    const token = this.current();

    if (!token || token.type === TokenType.EOF) {
      throw SQLError.unexpectedToken(token, "SQL statement");
    }

    switch (token.value.toUpperCase()) {
      case "SELECT":
        return this.parseSelectStatement();
      case "INSERT":
        return this.parseInsertStatement();
      case "UPDATE":
        return this.parseUpdateStatement();
      case "DELETE":
        return this.parseDeleteStatement();
      default:
        throw SQLError.unexpectedToken(
          token,
          "SELECT, INSERT, UPDATE, or DELETE"
        );
    }
  }
}
```

### SELECT 语句解析

```javascript
parseSelectStatement() {
  this.consume('SELECT');

  // 解析DISTINCT
  const distinct = this.match('DISTINCT');

  // 解析列列表
  const columns = this.parseColumnList();

  // 解析FROM子句
  let from = null;
  if (this.match('FROM')) {
    from = this.parseFromClause();
  }

  // 解析JOIN子句
  const joins = [];
  while (this.isJoinKeyword(this.current()?.value)) {
    joins.push(this.parseJoinClause());
  }

  // 解析WHERE子句
  let where = null;
  if (this.match('WHERE')) {
    where = this.parseExpression();
  }

  // 解析GROUP BY子句
  let groupBy = null;
  if (this.match('GROUP') && this.match('BY')) {
    groupBy = this.parseGroupByClause();
  }

  // 解析HAVING子句
  let having = null;
  if (this.match('HAVING')) {
    having = this.parseExpression();
  }

  // 解析ORDER BY子句
  let orderBy = null;
  if (this.match('ORDER') && this.match('BY')) {
    orderBy = this.parseOrderByClause();
  }

  // 解析LIMIT子句
  let limit = null;
  if (this.match('LIMIT')) {
    limit = this.parseLimitClause();
  }

  return createSelectStatement({
    distinct,
    columns,
    from,
    joins,
    where,
    groupBy,
    having,
    orderBy,
    limit
  });
}
```

### 表达式解析

表达式解析使用操作符优先级算法：

```javascript
// 操作符优先级表
const PRECEDENCE = {
  'OR': 1,
  'AND': 2,
  'NOT': 3,
  'IN': 4,
  'LIKE': 4,
  'BETWEEN': 4,
  'IS': 4,
  '=': 5,
  '!=': 5,
  '<>': 5,
  '<': 5,
  '<=': 5,
  '>': 5,
  '>=': 5,
  '+': 6,
  '-': 6,
  '*': 7,
  '/': 7,
  '%': 7,
  '^': 8
};

parseExpression(minPrecedence = 0) {
  let left = this.parsePrimaryExpression();

  while (true) {
    const operator = this.current();

    if (!operator || operator.type === TokenType.EOF) {
      break;
    }

    const precedence = PRECEDENCE[operator.value.toUpperCase()];

    if (precedence === undefined || precedence < minPrecedence) {
      break;
    }

    this.advance(); // 消费操作符

    const right = this.parseExpression(precedence + 1);

    left = createBinaryExpression(operator.value, left, right);
  }

  return left;
}

parsePrimaryExpression() {
  const token = this.current();

  if (!token) {
    throw SQLError.unexpectedToken(token, 'expression');
  }

  switch (token.type) {
    case TokenType.STRING:
      this.advance();
      return createStringLiteral(token.value);

    case TokenType.NUMBER:
      this.advance();
      return createNumberLiteral(parseFloat(token.value));

    case TokenType.BOOLEAN:
      this.advance();
      return createBooleanLiteral(token.value.toUpperCase() === 'TRUE');

    case TokenType.NULL:
      this.advance();
      return createNullLiteral();

    case TokenType.IDENTIFIER:
      return this.parseIdentifierOrFunction();

    case TokenType.LEFT_PAREN:
      this.advance();
      const expr = this.parseExpression();
      this.consume(')');
      return expr;

    default:
      throw SQLError.unexpectedToken(token, 'expression');
  }
}
```

## AST 设计

AST 节点采用统一的接口设计，便于遍历和操作。

### 基础节点接口

```javascript
// ast-nodes.js
export class ASTNode {
  constructor(type, properties = {}) {
    this.type = type;
    Object.assign(this, properties);
  }

  // 接受访问者模式
  accept(visitor) {
    const methodName = `visit${this.type}`;
    if (typeof visitor[methodName] === "function") {
      return visitor[methodName](this);
    }
    return visitor.visitDefault ? visitor.visitDefault(this) : null;
  }

  // 转换为JSON
  toJSON() {
    return {
      type: this.type,
      ...this,
    };
  }

  // 克隆节点
  clone() {
    return new this.constructor(this.type, { ...this });
  }
}
```

### 语句节点

```javascript
export class SelectStatement extends ASTNode {
  constructor(properties) {
    super("SelectStatement", {
      distinct: false,
      columns: [],
      from: null,
      joins: [],
      where: null,
      groupBy: null,
      having: null,
      orderBy: null,
      limit: null,
      ...properties,
    });
  }

  // 获取所有涉及的表
  getTables() {
    const tables = new Set();

    // 从FROM子句获取表
    if (this.from) {
      this.from.tables.forEach((table) => {
        if (table.type === "Identifier") {
          tables.add(table.name);
        }
      });
    }

    // 从JOIN子句获取表
    this.joins.forEach((join) => {
      if (join.table.type === "Identifier") {
        tables.add(join.table.name);
      }
    });

    return Array.from(tables);
  }

  // 获取所有涉及的列
  getColumns() {
    const columns = new Set();

    // 遍历AST收集列名
    this.accept({
      visitColumn(node) {
        columns.add(node.name);
      },
      visitDefault() {
        // 递归遍历子节点
      },
    });

    return Array.from(columns);
  }
}
```

### 表达式节点

```javascript
export class BinaryExpression extends ASTNode {
  constructor(operator, left, right) {
    super("BinaryExpression", {
      operator,
      left,
      right,
    });
  }

  // 计算表达式（如果可能）
  evaluate(context = {}) {
    const leftValue = this.evaluateNode(this.left, context);
    const rightValue = this.evaluateNode(this.right, context);

    switch (this.operator) {
      case "+":
        return leftValue + rightValue;
      case "-":
        return leftValue - rightValue;
      case "*":
        return leftValue * rightValue;
      case "/":
        return leftValue / rightValue;
      case "=":
        return leftValue === rightValue;
      case "!=":
      case "<>":
        return leftValue !== rightValue;
      case "<":
        return leftValue < rightValue;
      case "<=":
        return leftValue <= rightValue;
      case ">":
        return leftValue > rightValue;
      case ">=":
        return leftValue >= rightValue;
      case "AND":
        return leftValue && rightValue;
      case "OR":
        return leftValue || rightValue;
      default:
        throw new Error(`Unknown operator: ${this.operator}`);
    }
  }

  evaluateNode(node, context) {
    switch (node.type) {
      case "NumberLiteral":
        return node.value;
      case "StringLiteral":
        return node.value;
      case "BooleanLiteral":
        return node.value;
      case "NullLiteral":
        return null;
      case "Column":
        return context[node.name];
      case "BinaryExpression":
        return node.evaluate(context);
      default:
        throw new Error(`Cannot evaluate node type: ${node.type}`);
    }
  }
}
```

## 错误处理

错误处理系统提供详细的错误信息和恢复机制。

### 错误类型

```javascript
// sql-error.js
export class SQLError extends Error {
  constructor(message, code, line, column, context) {
    super(message);
    this.name = "SQLError";
    this.code = code;
    this.line = line;
    this.column = column;
    this.context = context;
  }

  // 静态工厂方法
  static syntaxError(message, line, column, context) {
    return new SQLError(message, "SYNTAX_ERROR", line, column, context);
  }

  static lexicalError(message, line, column, context) {
    return new SQLError(message, "LEXICAL_ERROR", line, column, context);
  }

  static unexpectedToken(token, expected) {
    const message = expected
      ? `Expected ${expected}, but got ${token?.value || "EOF"}`
      : `Unexpected token: ${token?.value || "EOF"}`;

    return new SQLError(
      message,
      "UNEXPECTED_TOKEN",
      token?.line || 0,
      token?.column || 0,
      token?.context
    );
  }

  static unsupportedFeature(feature, line, column) {
    return new SQLError(
      `Unsupported feature: ${feature}`,
      "UNSUPPORTED_FEATURE",
      line,
      column
    );
  }
}
```

### 错误恢复

```javascript
class Parser {
  // 错误恢复机制
  recover() {
    // 跳过当前token直到找到同步点
    while (!this.isAtEnd() && !this.isSyncToken(this.current())) {
      this.advance();
    }
  }

  isSyncToken(token) {
    if (!token) return true;

    const syncTokens = [
      "SELECT",
      "INSERT",
      "UPDATE",
      "DELETE",
      "FROM",
      "WHERE",
    ];
    return syncTokens.includes(token.value.toUpperCase());
  }

  // 带错误恢复的解析
  parseWithRecovery() {
    const errors = [];
    const statements = [];

    while (!this.isAtEnd()) {
      try {
        const stmt = this.parseStatement();
        statements.push(stmt);
      } catch (error) {
        errors.push(error);
        this.recover();
      }
    }

    return { statements, errors };
  }
}
```

## 性能优化

### 内存优化

```javascript
// 对象池模式减少GC压力
class TokenPool {
  constructor() {
    this.pool = [];
  }

  acquire(type, value, line, column) {
    let token = this.pool.pop();
    if (!token) {
      token = new Token();
    }

    token.type = type;
    token.value = value;
    token.line = line;
    token.column = column;

    return token;
  }

  release(token) {
    // 清理token
    token.type = null;
    token.value = null;
    token.line = 0;
    token.column = 0;

    this.pool.push(token);
  }
}
```

### 解析优化

```javascript
// 预编译正则表达式
const PATTERNS = {
  IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  NUMBER: /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/,
  WHITESPACE: /^\s+$/,
  SINGLE_LINE_COMMENT: /^--.*$/,
  MULTI_LINE_COMMENT: /^\/\*[\s\S]*?\*\/$/,
};

// 使用查找表优化关键字识别
const KEYWORD_TRIE = buildKeywordTrie(KEYWORDS);

function buildKeywordTrie(keywords) {
  const trie = {};

  Object.keys(keywords).forEach((keyword) => {
    let node = trie;
    for (const char of keyword) {
      if (!node[char]) {
        node[char] = {};
      }
      node = node[char];
    }
    node.$type = keywords[keyword];
  });

  return trie;
}
```

### 缓存机制

```javascript
// LRU缓存解析结果
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // 移到最前面
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的项
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }
}

// 在解析器中使用缓存
const parseCache = new LRUCache(1000);

function cachedParseSQL(sql) {
  const normalizedSQL = sql.replace(/\s+/g, " ").trim();

  let result = parseCache.get(normalizedSQL);
  if (result) {
    return result;
  }

  result = parseSQL(normalizedSQL);
  parseCache.set(normalizedSQL, result);

  return result;
}
```

## 扩展开发

### 添加新的 SQL 语法

1. **扩展 Token 类型**

```javascript
// 在token-types.js中添加新的token类型
export const TokenType = {
  // ... 现有类型
  CREATE: "CREATE",
  TABLE: "TABLE",
  ALTER: "ALTER",
  DROP: "DROP",
};

// 在KEYWORDS中添加新关键字
export const KEYWORDS = {
  // ... 现有关键字
  CREATE: TokenType.CREATE,
  TABLE: TokenType.TABLE,
  ALTER: TokenType.ALTER,
  DROP: TokenType.DROP,
};
```

2. **扩展 AST 节点**

```javascript
// 在ast-nodes.js中添加新的节点类型
export class CreateTableStatement extends ASTNode {
  constructor(properties) {
    super("CreateTableStatement", {
      table: null,
      columns: [],
      constraints: [],
      ...properties,
    });
  }
}

export function createCreateTableStatement(properties) {
  return new CreateTableStatement(properties);
}
```

3. **扩展解析器**

```javascript
// 在parser.js中添加解析方法
parseStatement() {
  const token = this.current();

  switch (token.value.toUpperCase()) {
    // ... 现有case
    case 'CREATE':
      return this.parseCreateStatement();
    default:
      throw SQLError.unexpectedToken(token, 'SQL statement');
  }
}

parseCreateStatement() {
  this.consume('CREATE');

  if (this.match('TABLE')) {
    return this.parseCreateTableStatement();
  }

  throw SQLError.unexpectedToken(this.current(), 'TABLE');
}

parseCreateTableStatement() {
  const table = this.parseIdentifier();

  this.consume('(');
  const columns = this.parseColumnDefinitions();
  this.consume(')');

  return createCreateTableStatement({
    table,
    columns
  });
}
```

### 插件架构

```javascript
// plugin-system.js
export class PluginManager {
  constructor() {
    this.plugins = [];
  }

  register(plugin) {
    if (typeof plugin.install === "function") {
      plugin.install(this);
    }
    this.plugins.push(plugin);
  }

  applyHook(hookName, ...args) {
    return this.plugins.reduce((result, plugin) => {
      if (typeof plugin[hookName] === "function") {
        return plugin[hookName](result, ...args);
      }
      return result;
    }, args[0]);
  }
}

// 使用插件
const pluginManager = new PluginManager();

// MySQL方言插件
const mysqlPlugin = {
  install(manager) {
    console.log("MySQL plugin installed");
  },

  beforeLex(input) {
    // 预处理MySQL特有语法
    return input.replace(/`([^`]+)`/g, '"$1"'); // 转换反引号
  },

  afterParse(ast) {
    // 后处理AST
    return ast;
  },
};

pluginManager.register(mysqlPlugin);
```

## 测试策略

### 单元测试结构

```javascript
// tests/lexer.test.js
describe("Lexer", () => {
  describe("基本功能", () => {
    test("应该正确识别关键字", () => {
      const lexer = new Lexer("SELECT FROM WHERE");
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(4); // 包括EOF
      expect(tokens[0]).toMatchObject({
        type: TokenType.KEYWORD,
        value: "SELECT",
      });
    });
  });

  describe("错误处理", () => {
    test("应该抛出词法错误", () => {
      const lexer = new Lexer('SELECT * FROM users WHERE name = "unterminated');

      expect(() => lexer.tokenize()).toThrow(SQLError);
    });
  });
});
```

### 集成测试

```javascript
// tests/integration.test.js
describe("完整解析流程", () => {
  test("应该正确解析复杂查询", () => {
    const sql = `
      SELECT u.id, u.name, COUNT(o.id) as order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.active = true
      GROUP BY u.id, u.name
      HAVING COUNT(o.id) > 5
      ORDER BY order_count DESC
      LIMIT 10
    `;

    const result = parseSQL(sql);

    expect(result.success).toBe(true);
    expect(result.ast.type).toBe("SelectStatement");
    expect(result.tables).toEqual(["users", "orders"]);
    expect(result.columns).toContain("id");
    expect(result.columns).toContain("name");
  });
});
```

### 性能测试

```javascript
// tests/performance.test.js
describe("性能测试", () => {
  test("大型查询解析性能", () => {
    const largeSQL = generateLargeSQL(1000); // 生成1000列的查询

    const startTime = performance.now();
    const result = parseSQL(largeSQL);
    const endTime = performance.now();

    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(1000); // 应在1秒内完成
  });

  test("内存使用测试", () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // 解析大量SQL
    for (let i = 0; i < 1000; i++) {
      parseSQL(`SELECT * FROM table_${i}`);
    }

    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 内存增长应小于50MB
  });
});
```

## 构建系统

### Webpack 配置

```javascript
// webpack.config.js
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = [
  // 开发版本
  {
    mode: "development",
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "sql-parser.js",
      library: "SQLParser",
      libraryTarget: "umd",
      globalObject: "this",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
      ],
    },
    devtool: "source-map",
  },

  // 生产版本
  {
    mode: "production",
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "sql-parser.min.js",
      library: "SQLParser",
      libraryTarget: "umd",
      globalObject: "this",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
      ],
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
            mangle: {
              reserved: ["SQLParser", "parseSQL", "validateSQL"],
            },
          },
        }),
      ],
    },
  },
];
```

### Rollup 配置

```javascript
// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import { terser } from "@rollup/plugin-terser";

export default [
  // ES Module版本
  {
    input: "src/index.js",
    output: {
      file: "dist/sql-parser.esm.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
    ],
  },

  // CommonJS版本
  {
    input: "src/index.js",
    output: {
      file: "dist/sql-parser.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
    ],
  },

  // UMD压缩版本
  {
    input: "src/index.js",
    output: {
      file: "dist/sql-parser.umd.min.js",
      format: "umd",
      name: "SQLParser",
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      terser(),
    ],
  },
];
```

### 发布流程

```json
{
  "scripts": {
    "prebuild": "npm run clean && npm run lint",
    "build": "npm run build:rollup && npm run build:webpack",
    "build:rollup": "rollup -c",
    "build:webpack": "webpack --mode=production",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/ tests/ --ext .js",
    "clean": "rm -rf dist/ coverage/",
    "prepublishOnly": "npm run build && npm run test",
    "version": "npm run build && git add -A dist",
    "postversion": "git push && git push --tags"
  }
}
```

通过以上架构设计和实现细节，SQL Parser JS 提供了一个可扩展、高性能的 SQL 解析解决方案。开发者可以基于这个架构添加新的 SQL 方言支持、优化性能或扩展功能。
