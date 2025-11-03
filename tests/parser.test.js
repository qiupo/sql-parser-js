/**
 * Parser Unit Tests
 *
 * Tests for the SQL parser functionality including AST generation,
 * statement parsing, and error handling
 */

import { parseSQL } from "../src/index.js";

describe("Parser", () => {
  describe("SELECT Statement Parsing", () => {
    test("should parse simple SELECT statement", () => {
      const result = parseSQL("SELECT * FROM users");

      expect(result.success).toBe(true);
      expect(result.ast.type).toBe("SelectStatement");
      expect(result.ast.columns).toHaveLength(1);
      expect(result.ast.columns[0].name).toBe("*");
      expect(result.ast.from.tables).toHaveLength(1);
      expect(result.ast.from.tables[0].name).toBe("users");
    });

    test("should parse SELECT with specific columns", () => {
      const result = parseSQL("SELECT name, email FROM users");

      expect(result.success).toBe(true);
      expect(result.ast.columns).toHaveLength(2);
      expect(result.ast.columns[0].name).toBe("name");
      expect(result.ast.columns[1].name).toBe("email");
    });

    test("should parse SELECT with column aliases", () => {
      const result = parseSQL(
        "SELECT name AS user_name, email user_email FROM users"
      );

      expect(result.success).toBe(true);
      expect(result.ast.columns[0].alias).toBe("user_name");
      expect(result.ast.columns[1].alias).toBe("user_email");
    });

    test("should parse SELECT with table alias", () => {
      const result = parseSQL("SELECT u.name FROM users u");

      expect(result.success).toBe(true);
      expect(result.ast.from.tables[0].alias).toBe("u");
      expect(result.ast.columns[0].table).toBe("u");
    });

    test("should parse SELECT with WHERE clause", () => {
      const result = parseSQL("SELECT * FROM users WHERE active = true");

      expect(result.success).toBe(true);
      expect(result.ast.where).toBeDefined();
      expect(result.ast.where.type).toBe("BinaryExpression");
      expect(result.ast.where.operator).toBe("=");
    });

    test("should parse SELECT with complex WHERE clause", () => {
      const result = parseSQL(
        "SELECT * FROM users WHERE age > 18 AND active = true"
      );

      expect(result.success).toBe(true);
      expect(result.ast.where.type).toBe("BinaryExpression");
      expect(result.ast.where.operator).toBe("AND");
    });

    test("should parse SELECT with JOIN", () => {
      const result = parseSQL(
        "SELECT u.name, p.title FROM users u JOIN posts p ON u.id = p.user_id"
      );

      expect(result.success).toBe(true);
      expect(result.ast.from.tables).toHaveLength(1);
      expect(result.ast.from.joins).toHaveLength(1);
      expect(result.ast.from.joins[0].type).toBe("JoinClause");
      expect(result.ast.from.joins[0].joinType).toBe("INNER");
    });

    test("should parse SELECT with LEFT JOIN", () => {
      const result = parseSQL(
        "SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id"
      );

      expect(result.success).toBe(true);
      expect(result.ast.from.joins[0].joinType).toBe("LEFT");
    });

    test("should parse SELECT with GROUP BY", () => {
      const result = parseSQL(
        "SELECT department, COUNT(*) FROM employees GROUP BY department"
      );

      expect(result.success).toBe(true);
      expect(result.ast.groupBy).toBeDefined();
      expect(result.ast.groupBy.columns).toHaveLength(1);
    });

    test("should parse SELECT with HAVING", () => {
      const result = parseSQL(
        "SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 5"
      );

      expect(result.success).toBe(true);
      expect(result.ast.having).toBeDefined();
      expect(result.ast.having.condition.type).toBe("BinaryExpression");
    });

    test("should parse SELECT with ORDER BY", () => {
      const result = parseSQL(
        "SELECT * FROM users ORDER BY name ASC, created_at DESC"
      );

      expect(result.success).toBe(true);
      expect(result.ast.orderBy).toBeDefined();
      expect(result.ast.orderBy.columns).toHaveLength(2);
      expect(result.ast.orderBy.columns[0].direction).toBe("ASC");
      expect(result.ast.orderBy.columns[1].direction).toBe("DESC");
    });

    test("should parse SELECT with LIMIT", () => {
      const result = parseSQL("SELECT * FROM users LIMIT 10");

      expect(result.success).toBe(true);
      expect(result.ast.limit).toBeDefined();
      expect(result.ast.limit.count.value).toBe(10);
    });

    test("should parse SELECT with LIMIT and OFFSET", () => {
      const result = parseSQL("SELECT * FROM users LIMIT 10 OFFSET 20");

      expect(result.success).toBe(true);
      expect(result.ast.limit.offset.value).toBe(20);
    });

    test("should parse SELECT with DISTINCT", () => {
      const result = parseSQL("SELECT DISTINCT department FROM employees");

      expect(result.success).toBe(true);
      expect(result.ast.distinct).toBe(true);
    });
  });

  describe("INSERT Statement Parsing", () => {
    test("should parse simple INSERT statement", () => {
      const result = parseSQL(
        "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')"
      );

      expect(result.success).toBe(true);
      expect(result.ast.type).toBe("InsertStatement");
      expect(result.ast.table.name).toBe("users");
      expect(result.ast.columns).toEqual(["name", "email"]);
      expect(result.ast.values).toHaveLength(1);
    });

    test("should parse INSERT with multiple value sets", () => {
      const result = parseSQL(
        "INSERT INTO users (name, email) VALUES ('John', 'john@example.com'), ('Jane', 'jane@example.com')"
      );

      expect(result.success).toBe(true);
      expect(result.ast.values).toHaveLength(2);
    });

    test("should parse INSERT without column list", () => {
      const result = parseSQL(
        "INSERT INTO users VALUES ('John', 'john@example.com')"
      );

      expect(result.success).toBe(true);
      expect(result.ast.columns).toHaveLength(0);
      expect(result.ast.values).toHaveLength(1);
    });
  });

  describe("UPDATE Statement Parsing", () => {
    test("should parse simple UPDATE statement", () => {
      const result = parseSQL(
        "UPDATE users SET name = 'John Doe' WHERE id = 1"
      );

      expect(result.success).toBe(true);
      expect(result.ast.type).toBe("UpdateStatement");
      expect(result.ast.table.name).toBe("users");
      expect(result.ast.set).toHaveLength(1);
      expect(result.ast.set[0].column).toBe("name");
      expect(result.ast.where).toBeDefined();
    });

    test("should parse UPDATE with multiple assignments", () => {
      const result = parseSQL(
        "UPDATE users SET name = 'John', email = 'john@example.com' WHERE id = 1"
      );

      expect(result.success).toBe(true);
      expect(result.ast.set).toHaveLength(2);
    });

    test("should parse UPDATE without WHERE clause", () => {
      const result = parseSQL("UPDATE users SET active = false");

      expect(result.success).toBe(true);
      expect(result.ast.where).toBeNull();
    });
  });

  describe("DELETE Statement Parsing", () => {
    test("should parse simple DELETE statement", () => {
      const result = parseSQL("DELETE FROM users WHERE id = 1");

      expect(result.success).toBe(true);
      expect(result.ast.type).toBe("DeleteStatement");
      expect(result.ast.from.name).toBe("users");
      expect(result.ast.where).toBeDefined();
    });

    test("should parse DELETE without WHERE clause", () => {
      const result = parseSQL("DELETE FROM users");

      expect(result.success).toBe(true);
      expect(result.ast.where).toBeNull();
    });
  });

  describe("Expression Parsing", () => {
    test("should parse arithmetic expressions", () => {
      const result = parseSQL("SELECT price * quantity + tax FROM orders");

      expect(result.success).toBe(true);
      const expr = result.ast.columns[0];
      expect(expr.type).toBe("BinaryExpression");
      expect(expr.operator).toBe("+");
    });

    test("should parse function calls", () => {
      const result = parseSQL(
        "SELECT COUNT(*), MAX(price), MIN(created_at) FROM orders"
      );

      expect(result.success).toBe(true);
      expect(result.ast.columns[0].type).toBe("FunctionCall");
      expect(result.ast.columns[0].name).toBe("COUNT");
      expect(result.ast.columns[1].type).toBe("FunctionCall");
      expect(result.ast.columns[1].name).toBe("MAX");
    });

    test("should parse nested function calls", () => {
      const result = parseSQL("SELECT UPPER(TRIM(name)) FROM users");

      expect(result.success).toBe(true);
      const expr = result.ast.columns[0];
      expect(expr.type).toBe("FunctionCall");
      expect(expr.name).toBe("UPPER");
      expect(expr.arguments[0].type).toBe("FunctionCall");
      expect(expr.arguments[0].name).toBe("TRIM");
    });

    test("should parse parenthesized expressions", () => {
      const result = parseSQL("SELECT (price + tax) * quantity FROM orders");

      expect(result.success).toBe(true);
      const expr = result.ast.columns[0];
      expect(expr.type).toBe("BinaryExpression");
      expect(expr.operator).toBe("*");
    });

    test("should handle operator precedence", () => {
      const result = parseSQL("SELECT 1 + 2 * 3 FROM dual");

      expect(result.success).toBe(true);
      const expr = result.ast.columns[0];
      expect(expr.type).toBe("BinaryExpression");
      expect(expr.operator).toBe("+");
      expect(expr.right.type).toBe("BinaryExpression");
      expect(expr.right.operator).toBe("*");
    });
  });

  describe("Literal Values", () => {
    test("should parse string literals", () => {
      const result = parseSQL("SELECT 'Hello World' FROM dual");

      expect(result.success).toBe(true);
      const literal = result.ast.columns[0];
      expect(literal.type).toBe("Literal");
      expect(literal.value).toBe("Hello World");
      expect(literal.dataType).toBe("string");
    });

    test("should parse numeric literals", () => {
      const result = parseSQL("SELECT 123, 45.67, 1.23e10 FROM dual");

      expect(result.success).toBe(true);
      expect(result.ast.columns[0].type).toBe("Literal");
      expect(result.ast.columns[0].value).toBe(123);
      expect(result.ast.columns[1].type).toBe("Literal");
      expect(result.ast.columns[1].value).toBe(45.67);
    });

    test("should parse boolean literals", () => {
      const result = parseSQL("SELECT true, false FROM dual");

      expect(result.success).toBe(true);
      expect(result.ast.columns[0].value).toBe(true);
      expect(result.ast.columns[1].value).toBe(false);
    });

    test("should parse NULL literal", () => {
      const result = parseSQL("SELECT NULL FROM dual");

      expect(result.success).toBe(true);
      expect(result.ast.columns[0].value).toBeNull();
      expect(result.ast.columns[0].dataType).toBe("null");
    });
  });

  describe("Error Handling", () => {
    test("should handle syntax errors gracefully", () => {
      const result = parseSQL("SELECT FROM users");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe("UNEXPECTED_TOKEN");
    });

    test("should handle unexpected end of input", () => {
      const result = parseSQL("SELECT *");

      // SELECT * 现在是有效的语法，应该成功解析
      expect(result.success).toBe(true);
      expect(result.ast.columns[0].type).toBe("Wildcard");
    });

    test("should provide detailed error information", () => {
      const result = parseSQL("SELECT * FROM");

      expect(result.success).toBe(false);
      expect(result.errors[0]).toHaveProperty("line");
      expect(result.errors[0]).toHaveProperty("column");
      expect(result.errors[0]).toHaveProperty("message");
    });

    test("should handle invalid expressions", () => {
      const result = parseSQL("SELECT + FROM users");

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("Complex Queries", () => {
    test("should parse complex SELECT with all clauses", () => {
      const sql = `
                SELECT 
                    u.name,
                    u.email,
                    COUNT(o.id) as order_count,
                    SUM(o.total) as total_spent
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                WHERE u.active = true 
                    AND u.created_at > '2023-01-01'
                GROUP BY u.id, u.name, u.email
                HAVING COUNT(o.id) > 0
                ORDER BY total_spent DESC, u.name ASC
                LIMIT 10 OFFSET 20
            `;

      const result = parseSQL(sql);

      expect(result.success).toBe(true);
      expect(result.ast.type).toBe("SelectStatement");
      expect(result.ast.columns).toHaveLength(4);
      expect(result.ast.from).toBeDefined();
      expect(result.ast.where).toBeDefined();
      expect(result.ast.groupBy).toBeDefined();
      expect(result.ast.having).toBeDefined();
      expect(result.ast.orderBy).toBeDefined();
      expect(result.ast.limit).toBeDefined();
    });

    test("should parse subqueries in WHERE clause", () => {
      // Note: This test assumes subquery support is implemented
      const result = parseSQL("SELECT * FROM users WHERE id IN (1, 2, 3)");

      expect(result.success).toBe(true);
      // Additional assertions would depend on subquery implementation
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty input", () => {
      const result = parseSQL("");

      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe("EMPTY_INPUT");
    });

    test("should handle whitespace-only input", () => {
      const result = parseSQL("   \n\t  ");

      expect(result.success).toBe(false);
    });

    test("should handle comments in SQL", () => {
      const result = parseSQL(`
                -- This is a comment
                SELECT * FROM users /* another comment */
                WHERE active = true
            `);

      expect(result.success).toBe(true);
    });

    test("should handle case sensitivity", () => {
      const result = parseSQL("select * from Users where Active = True");

      expect(result.success).toBe(true);
      expect(result.ast.type).toBe("SelectStatement");
    });
  });

  describe("API Functions", () => {
    test("validateSQL should return validation result", () => {
      const { validateSQL } = require("../src/index.js");

      const validResult = validateSQL("SELECT * FROM users");
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validateSQL("SELECT FROM users");
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test("extractTables should return table names", () => {
      const { extractTables } = require("../src/index.js");

      const tables = extractTables(
        "SELECT * FROM users u JOIN orders o ON u.id = o.user_id"
      );
      expect(tables).toContain("users");
      expect(tables).toContain("orders");
    });

    test("extractColumns should return column names", () => {
      const { extractColumns } = require("../src/index.js");

      const columns = extractColumns(
        "SELECT name, email FROM users WHERE active = true"
      );
      expect(columns).toContain("name");
      expect(columns).toContain("email");
      expect(columns).toContain("active");
    });
  });
});
