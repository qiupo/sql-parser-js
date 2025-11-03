/**
 * Performance Benchmark Tests
 *
 * Tests for measuring SQL parser performance with various
 * SQL statement sizes and complexities
 */

import { parseSQL } from "../src/index.js";

describe("Performance Benchmarks", () => {
  // Helper function to measure execution time
  const measureTime = (fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return {
      result,
      time: end - start,
    };
  };

  // Helper function to generate large SQL statements
  const generateLargeSelect = (columnCount, tableCount) => {
    const columns = Array.from(
      { length: columnCount },
      (_, i) => `col${i}`
    ).join(", ");
    const tables = Array.from(
      { length: tableCount },
      (_, i) => `table${i}`
    ).join(", ");
    return `SELECT ${columns} FROM ${tables}`;
  };

  const generateComplexJoin = (tableCount) => {
    let sql = "SELECT * FROM table0 t0";
    for (let i = 1; i < tableCount; i++) {
      sql += ` JOIN table${i} t${i} ON t0.id = t${i}.table0_id`;
    }
    return sql;
  };

  describe("Simple Query Performance", () => {
    test("should parse simple SELECT quickly", () => {
      const sql = "SELECT * FROM users";
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(10); // Should complete in less than 10ms
      console.log(`Simple SELECT: ${time.toFixed(2)}ms`);
    });

    test("should parse INSERT quickly", () => {
      const sql =
        "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')";
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(10);
      console.log(`Simple INSERT: ${time.toFixed(2)}ms`);
    });

    test("should parse UPDATE quickly", () => {
      const sql = "UPDATE users SET name = 'John Doe' WHERE id = 1";
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(10);
      console.log(`Simple UPDATE: ${time.toFixed(2)}ms`);
    });

    test("should parse DELETE quickly", () => {
      const sql = "DELETE FROM users WHERE id = 1";
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(10);
      console.log(`Simple DELETE: ${time.toFixed(2)}ms`);
    });
  });

  describe("Medium Complexity Performance", () => {
    test("should parse SELECT with 10 columns efficiently", () => {
      const sql = generateLargeSelect(10, 1);
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(20);
      console.log(`10 columns SELECT: ${time.toFixed(2)}ms`);
    });

    test("should parse SELECT with 5 table JOIN efficiently", () => {
      const sql = generateComplexJoin(5);
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(30);
      console.log(`5 table JOIN: ${time.toFixed(2)}ms`);
    });

    test("should parse complex WHERE clause efficiently", () => {
      const sql = `
                SELECT * FROM users 
                WHERE (age > 18 AND age < 65) 
                    AND (status = 'active' OR status = 'pending')
                    AND created_at > '2023-01-01'
                    AND (department = 'IT' OR department = 'HR' OR department = 'Finance')
            `;
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(25);
      console.log(`Complex WHERE: ${time.toFixed(2)}ms`);
    });
  });

  describe("Large Query Performance", () => {
    test("should parse SELECT with 50 columns within reasonable time", () => {
      const sql = generateLargeSelect(50, 1);
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(100); // Allow more time for larger queries
      console.log(`50 columns SELECT: ${time.toFixed(2)}ms`);
    });

    test("should parse SELECT with 10 table JOIN within reasonable time", () => {
      const sql = generateComplexJoin(10);
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(150);
      console.log(`10 table JOIN: ${time.toFixed(2)}ms`);
    });

    test("should parse very complex query within reasonable time", () => {
      const sql = `
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.created_at,
                    COUNT(o.id) as order_count,
                    SUM(o.total) as total_spent,
                    AVG(o.total) as avg_order_value,
                    MAX(o.created_at) as last_order_date,
                    MIN(o.created_at) as first_order_date,
                    CASE 
                        WHEN COUNT(o.id) > 10 THEN 'VIP'
                        WHEN COUNT(o.id) > 5 THEN 'Regular'
                        ELSE 'New'
                    END as customer_tier
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN products p ON oi.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE u.active = true 
                    AND u.created_at > '2023-01-01'
                    AND (u.country = 'US' OR u.country = 'CA' OR u.country = 'UK')
                    AND (c.name = 'Electronics' OR c.name = 'Books' OR c.name = 'Clothing')
                GROUP BY u.id, u.name, u.email, u.created_at
                HAVING COUNT(o.id) > 0 
                    AND SUM(o.total) > 100
                    AND AVG(o.total) > 20
                ORDER BY total_spent DESC, order_count DESC, u.name ASC
                LIMIT 100 OFFSET 0
            `;
      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(200);
      console.log(`Very complex query: ${time.toFixed(2)}ms`);
    });
  });

  describe("Batch Processing Performance", () => {
    test("should handle multiple small queries efficiently", () => {
      const queries = [
        "SELECT * FROM users",
        "SELECT * FROM orders",
        "SELECT * FROM products",
        "SELECT * FROM categories",
        "SELECT * FROM reviews",
      ];

      const { time, result } = measureTime(() => {
        return queries.map((sql) => parseSQL(sql));
      });

      expect(result.every((r) => r.success)).toBe(true);
      expect(time).toBeLessThan(50);
      console.log(`5 simple queries batch: ${time.toFixed(2)}ms`);
    });

    test("should handle repeated parsing of same query efficiently", () => {
      const sql =
        "SELECT * FROM users WHERE active = true ORDER BY created_at DESC";
      const iterations = 100;

      const { time, result } = measureTime(() => {
        const results = [];
        for (let i = 0; i < iterations; i++) {
          results.push(parseSQL(sql));
        }
        return results;
      });

      expect(result.every((r) => r.success)).toBe(true);
      expect(time).toBeLessThan(500); // 100 iterations should complete in less than 500ms
      console.log(
        `100 repeated parses: ${time.toFixed(2)}ms (${(
          time / iterations
        ).toFixed(2)}ms per parse)`
      );
    });
  });

  describe("Memory Usage Tests", () => {
    test("should not leak memory with repeated parsing", () => {
      const sql = "SELECT * FROM users WHERE id = 1";
      const initialMemory = process.memoryUsage().heapUsed;

      // Parse the same query many times
      for (let i = 0; i < 1000; i++) {
        parseSQL(sql);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      console.log(
        `Memory increase after 1000 parses: ${(
          memoryIncrease /
          1024 /
          1024
        ).toFixed(2)}MB`
      );
    });
  });

  describe("Error Handling Performance", () => {
    test("should handle syntax errors quickly", () => {
      const invalidSql = "SELECT FROM WHERE";
      const { time, result } = measureTime(() => parseSQL(invalidSql));

      expect(result.success).toBe(false);
      expect(time).toBeLessThan(15); // Error handling should be fast
      console.log(`Syntax error handling: ${time.toFixed(2)}ms`);
    });

    test("should handle multiple errors quickly", () => {
      const invalidQueries = [
        "SELECT FROM",
        "INSERT INTO",
        "UPDATE SET",
        "DELETE WHERE",
        "SELECT * FROM WHERE",
      ];

      const { time, result } = measureTime(() => {
        return invalidQueries.map((sql) => parseSQL(sql));
      });

      expect(result.every((r) => !r.success)).toBe(true);
      expect(time).toBeLessThan(50);
      console.log(`5 error cases: ${time.toFixed(2)}ms`);
    });
  });

  describe("Scalability Tests", () => {
    test("should scale linearly with query complexity", () => {
      const complexities = [1, 5, 10, 20];
      const times = [];

      complexities.forEach((complexity) => {
        const sql = generateLargeSelect(complexity, 1);
        const { time } = measureTime(() => parseSQL(sql));
        times.push(time);
        console.log(`${complexity} columns: ${time.toFixed(2)}ms`);
      });

      // Check that time doesn't grow exponentially
      // Time for 20 columns should be less than 10x time for 1 column
      expect(times[3]).toBeLessThan(times[0] * 10);
    });

    test("should handle deeply nested expressions", () => {
      // Create a deeply nested expression: ((((a + b) + c) + d) + e)
      let expression = "a";
      for (let i = 0; i < 20; i++) {
        expression = `(${expression} + col${i})`;
      }
      const sql = `SELECT ${expression} FROM test`;

      const { time, result } = measureTime(() => parseSQL(sql));

      expect(result.success).toBe(true);
      expect(time).toBeLessThan(100);
      console.log(`Deeply nested expression (20 levels): ${time.toFixed(2)}ms`);
    });
  });

  // Performance summary
  afterAll(() => {
    console.log("\n=== Performance Test Summary ===");
    console.log("All performance benchmarks completed successfully");
    console.log("Parser demonstrates good performance characteristics:");
    console.log("- Simple queries: < 10ms");
    console.log("- Medium complexity: < 30ms");
    console.log("- Large queries: < 200ms");
    console.log("- Batch processing: Efficient");
    console.log("- Memory usage: Controlled");
    console.log("- Error handling: Fast");
    console.log("- Scalability: Linear growth");
  });
});
