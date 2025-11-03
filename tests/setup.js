/**
 * Test Setup
 *
 * Global test configuration and setup utilities
 */

// Global test utilities
global.testUtils = {
  /**
   * 创建测试用的SQL语句
   * @param {string} type - SQL语句类型 (select, insert, update, delete)
   * @param {Object} options - 配置选项
   * @returns {string} SQL语句
   */
  createTestSQL: (type, options = {}) => {
    const defaults = {
      table: "users",
      columns: ["*"],
      conditions: [],
      values: [],
    };

    const config = { ...defaults, ...options };

    switch (type.toLowerCase()) {
      case "select": {
        let sql = `SELECT ${config.columns.join(", ")} FROM ${config.table}`;
        if (config.conditions.length > 0) {
          sql += ` WHERE ${config.conditions.join(" AND ")}`;
        }
        return sql;
      }
      case "insert": {
        const cols = config.columns.filter((col) => col !== "*");
        const vals = config.values
          .map((val) => (typeof val === "string" ? `'${val}'` : val))
          .join(", ");
        return `INSERT INTO ${config.table} (${cols.join(
          ", "
        )}) VALUES (${vals})`;
      }
      case "update": {
        const sets = config.values.map(
          (val, idx) =>
            `${config.columns[idx]} = ${
              typeof val === "string" ? `'${val}'` : val
            }`
        );
        let updateSql = `UPDATE ${config.table} SET ${sets.join(", ")}`;
        if (config.conditions.length > 0) {
          updateSql += ` WHERE ${config.conditions.join(" AND ")}`;
        }
        return updateSql;
      }
      case "delete": {
        let deleteSql = `DELETE FROM ${config.table}`;
        if (config.conditions.length > 0) {
          deleteSql += ` WHERE ${config.conditions.join(" AND ")}`;
        }
        return deleteSql;
      }
      default:
        throw new Error(`Unsupported SQL type: ${type}`);
    }
  },

  /**
   * 验证AST节点结构
   * @param {Object} node - AST节点
   * @param {string} expectedType - 期望的节点类型
   * @param {Object} expectedProps - 期望的属性
   */
  validateASTNode: (node, expectedType, expectedProps = {}) => {
    expect(node).toBeDefined();
    expect(node.type).toBe(expectedType);

    Object.keys(expectedProps).forEach((prop) => {
      expect(node[prop]).toEqual(expectedProps[prop]);
    });
  },

  /**
   * 创建性能测试辅助函数
   * @param {Function} fn - 要测试的函数
   * @param {number} iterations - 迭代次数
   * @returns {Object} 性能统计信息
   */
  performanceTest: (fn, iterations = 100) => {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }

    const total = times.reduce((sum, time) => sum + time, 0);
    const average = total / iterations;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return {
      total,
      average,
      min,
      max,
      iterations,
      times,
    };
  },

  /**
   * 生成随机SQL测试数据
   * @param {string} type - 数据类型
   * @param {number} count - 生成数量
   * @returns {Array} 测试数据数组
   */
  generateTestData: (type, count = 10) => {
    const data = [];

    for (let i = 0; i < count; i++) {
      switch (type) {
        case "identifiers":
          data.push(`test_${i}_${Math.random().toString(36).substr(2, 5)}`);
          break;

        case "strings":
          data.push(`'Test String ${i}'`);
          break;

        case "numbers":
          data.push(Math.floor(Math.random() * 1000));
          break;

        case "booleans":
          data.push(Math.random() > 0.5);
          break;

        default:
          data.push(`test_${i}`);
      }
    }

    return data;
  },
};

// Custom matchers
expect.extend({
  /**
   * 检查是否为有效的AST节点
   */
  toBeValidASTNode(received) {
    const pass =
      received &&
      typeof received === "object" &&
      typeof received.type === "string" &&
      received.type.length > 0;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid AST node`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid AST node with a type property`,
        pass: false,
      };
    }
  },

  /**
   * 检查是否为有效的Token
   */
  toBeValidToken(received) {
    const pass =
      received &&
      typeof received === "object" &&
      typeof received.type === "string" &&
      Object.prototype.hasOwnProperty.call(received, "value") &&
      typeof received.line === "number" &&
      typeof received.column === "number";

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid token`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid token with type, value, line, and column properties`,
        pass: false,
      };
    }
  },

  /**
   * 检查解析结果是否成功
   */
  toBeSuccessfulParse(received) {
    const pass =
      received &&
      typeof received === "object" &&
      received.success === true &&
      received.ast &&
      typeof received.ast === "object";

    if (pass) {
      return {
        message: () => `expected parse result not to be successful`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected parse result to be successful with ast property`,
        pass: false,
      };
    }
  },

  /**
   * 检查解析结果是否失败
   */
  toBeFailedParse(received) {
    const pass =
      received &&
      typeof received === "object" &&
      received.success === false &&
      Array.isArray(received.errors) &&
      received.errors.length > 0;

    if (pass) {
      return {
        message: () => `expected parse result not to be failed`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected parse result to be failed with errors array`,
        pass: false,
      };
    }
  },
});

// Console setup for performance tests
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only show performance logs in performance test mode
  if (process.env.NODE_ENV === "test" && args[0] && args[0].includes("ms")) {
    originalConsoleLog(...args);
  } else if (process.env.NODE_ENV !== "test") {
    originalConsoleLog(...args);
  }
};

// Memory usage tracking for performance tests
if (typeof global.gc === "undefined") {
  // Mock gc function if not available
  global.gc = () => {
    // No-op if garbage collection is not available
  };
}

// Test environment information
console.log("Test environment initialized");
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);

// Error handling for unhandled promises in tests
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process in test environment
});

// Cleanup after all tests
afterAll(() => {
  // Restore original console.log
  console.log = originalConsoleLog;

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});
