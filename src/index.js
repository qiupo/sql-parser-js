/**
 * SQL Parser Library - Main Entry Point
 *
 * A powerful SQL parser that converts SQL statements into Abstract Syntax Trees (AST)
 * Supports SELECT, INSERT, UPDATE, DELETE statements with comprehensive error handling
 */

import { Lexer } from "./lexer/lexer.js";
import { Parser } from "./parser/parser.js";
import { SQLError } from "./errors/sql-error.js";
import {
  analyzeSelectQuery,
  analyzeQueryComplexity,
} from "./analyzer/query-analyzer.js";

/**
 * Extract tables from AST (internal helper)
 * @param {Object} ast - The AST object
 * @returns {Array<string>} Array of table names (includes duplicates for self-joins)
 */
function extractTablesFromAST(ast) {
  if (!ast) {
    return [];
  }
  
  const tables = [];

  const traverseAST = (node) => {
    if (node && typeof node === "object") {
      // Handle TableReference nodes - extract the actual table name for each reference
      if (node.type === "TableReference" && node.name) {
        tables.push(node.name);
      }

      // Recursively traverse all properties
      Object.values(node).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach(traverseAST);
        } else if (typeof value === "object") {
          traverseAST(value);
        }
      });
    }
  };

  traverseAST(ast);
  return tables;
}

/**
 * Extract columns from AST (internal helper)
 * @param {Object} ast - The AST object
 * @returns {Array<string>} Array of column names
 */
function extractColumnsFromAST(ast) {
  if (!ast) {
    return [];
  }
  
  const columns = new Set();

  const traverseAST = (node) => {
    if (node && typeof node === "object") {
      // Handle ColumnReference nodes - extract column names
      if (node.type === "ColumnReference" && node.name) {
        columns.add(node.name);
      } else if (node.type === "Identifier" && node.name) {
        // Handle Identifier nodes that represent columns
        // Only add if it's likely a column (not a table or function)
        const parent = node.parent;
        if (!parent || (parent.type !== "TableReference" && parent.type !== "FunctionCall")) {
          columns.add(node.name);
        }
      }

      // Recursively traverse all properties
      Object.values(node).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach(traverseAST);
        } else if (typeof value === "object") {
          traverseAST(value);
        }
      });
    }
  };

  traverseAST(ast);
  return Array.from(columns);
}

/**
 * Main SQL parsing function
 * @param {string} sqlString - The SQL statement to parse
 * @param {Object} options - Parsing options
 * @param {boolean} options.strict - Enable strict mode (default: false)
 * @param {boolean} options.includeComments - Include comments in AST (default: false)
 * @param {string} options.dialect - SQL dialect (default: 'standard')
 * @returns {Object} Parsed AST object
 * @throws {SQLError} When parsing fails
 */
export function parseSQL(sqlString, options = {}) {
  if (typeof sqlString !== "string") {
    throw new SQLError("Input must be a string", "INVALID_INPUT", 0, 0);
  }

  const defaultOptions = {
    strict: false,
    includeComments: false,
    dialect: "standard",
  };

  const config = { ...defaultOptions, ...options };

  try {
    // Lexical analysis
    const lexer = new Lexer(sqlString, config);
    const tokens = lexer.tokenize();

    // Syntax analysis
    const parser = new Parser(tokens, config);
    const ast = parser.parse();

    // Extract tables and columns for convenience
    const tables = extractTablesFromAST(ast);
    const columns = extractColumnsFromAST(ast);

    return {
      success: true,
      ast,
      tables,
      columns,
      tokens: config.includeTokens ? tokens : undefined,
      errors: [],
    };
  } catch (error) {
    if (error instanceof SQLError) {
      return {
        success: false,
        ast: null,
        tables: [],
        columns: [],
        errors: [error.toJSON()],
      };
    }

    // Unexpected error
    return {
      success: false,
      ast: null,
      tables: [],
      columns: [],
      errors: [
        {
          code: "UNEXPECTED_ERROR",
          message: error.message,
          line: 0,
          column: 0,
        },
      ],
    };
  }
}

/**
 * Validate SQL syntax without full parsing
 * @param {string} sqlString - The SQL statement to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateSQL(sqlString, options = {}) {
  try {
    const result = parseSQL(sqlString, options);
    return {
      valid: result.success,
      errors: result.errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          code: "VALIDATION_ERROR",
          message: error.message,
          line: 0,
          column: 0,
        },
      ],
    };
  }
}

/**
 * Extract table names from SQL statement
 * @param {string} sqlString - The SQL statement
 * @returns {Array<string>} Array of table names
 */
export function extractTables(sqlString) {
  try {
    const result = parseSQL(sqlString);
    if (!result.success) {
      return [];
    }

    const tables = new Set();

    const traverseAST = (node) => {
      if (node && typeof node === "object") {
        // Handle TableReference nodes - only extract the actual table name, not alias
        if (node.type === "TableReference" && node.name) {
          tables.add(node.name);
        }

        // Recursively traverse all properties
        Object.values(node).forEach((value) => {
          if (Array.isArray(value)) {
            value.forEach(traverseAST);
          } else if (typeof value === "object") {
            traverseAST(value);
          }
        });
      }
    };

    traverseAST(result.ast);
    return Array.from(tables);
  } catch (error) {
    return [];
  }
}

/**
 * Extract column names from SQL statement
 * @param {string} sqlString - The SQL statement
 * @returns {Array<string>} Array of column names
 */
export function extractColumns(sqlString) {
  try {
    const result = parseSQL(sqlString);
    if (!result.success) {
      return [];
    }

    const columns = new Set();

    const traverseAST = (node) => {
      if (node && typeof node === "object") {
        // Handle ColumnReference nodes
        if (node.type === "ColumnReference" && node.name) {
          columns.add(node.name);
        }
        // Handle Identifier nodes (which can be columns)
        if (node.type === "Identifier" && node.name) {
          columns.add(node.name);
        }
        // Handle column property in various nodes
        if (node.column && typeof node.column === "string") {
          columns.add(node.column);
        }
        if (node.column && node.column.name) {
          columns.add(node.column.name);
        }
        // Handle columns array
        if (node.columns && Array.isArray(node.columns)) {
          node.columns.forEach((col) => {
            if (typeof col === "string") {
              columns.add(col);
            } else if (col && col.name) {
              columns.add(col.name);
            }
          });
        }

        Object.values(node).forEach((value) => {
          if (Array.isArray(value)) {
            value.forEach(traverseAST);
          } else if (typeof value === "object") {
            traverseAST(value);
          }
        });
      }
    };

    traverseAST(result.ast);
    return Array.from(columns);
  } catch (error) {
    return [];
  }
}

/**
 * 分析SQL查询，提取结构化信息
 * @param {string} sql - SQL查询语句
 * @param {Object} options - 解析选项
 * @returns {Object} 结构化的查询分析结果
 */
export function analyzeSQL(sql, options = {}) {
  try {
    // 首先解析SQL语句
    const parseResult = parseSQL(sql, options);
    
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.errors[0]?.message || "Parse failed",
        query: {
          type: "unknown",
          sql: sql.trim(),
        },
      };
    }

    const ast = parseResult.ast;

    // 如果是SELECT查询，进行详细分析
    if (ast.type === "SelectStatement") {
      const analysis = analyzeSelectQuery(ast);
      const complexity = analyzeQueryComplexity(analysis);

      return {
        success: true,
        query: {
          type: ast.type,
          sql: sql.trim(),
        },
        analysis,
        complexity,
        ast: parseResult,
      };
    } else {
      // 对于非SELECT查询，返回基本信息
      return {
        success: true,
        query: {
          type: ast.type,
          sql: sql.trim(),
        },
        analysis: {
          conditions: [],
          fields: [],
          tables: extractTables(ast),
          joins: [],
          orderBy: [],
          groupBy: [],
          limit: null,
        },
        complexity: {
          level: "simple",
          score: 0,
          factors: [],
        },
        ast: parseResult,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query: {
        type: "unknown",
        sql: sql.trim(),
      },
    };
  }
}

// Export classes for advanced usage
export { Lexer } from "./lexer/lexer.js";
export { Parser } from "./parser/parser.js";
export { SQLError } from "./errors/sql-error.js";

// Default export for convenience
export default {
  parseSQL,
  validateSQL,
  extractTables,
  extractColumns,
  analyzeSQL,
  Lexer,
  Parser,
  SQLError,
};
