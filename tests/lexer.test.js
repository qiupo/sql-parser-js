/**
 * Lexer Unit Tests
 *
 * Tests for the SQL lexer functionality including token recognition,
 * keyword identification, and error handling
 */

import { Lexer } from "../src/lexer/lexer.js";
import { TokenType } from "../src/lexer/token-types.js";
import { SQLError } from "../src/errors/sql-error.js";

describe("Lexer", () => {
  describe("Basic Tokenization", () => {
    test("should tokenize simple SELECT statement", () => {
      const lexer = new Lexer("SELECT * FROM users");
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(5); // SELECT, *, FROM, users, EOF
      expect(tokens[0].type).toBe(TokenType.SELECT);
      expect(tokens[1].type).toBe(TokenType.MULTIPLY);
      expect(tokens[2].type).toBe(TokenType.FROM);
      expect(tokens[3].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[4].type).toBe(TokenType.EOF);
    });

    test("should handle case insensitive keywords", () => {
      const lexer = new Lexer("select from where");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.SELECT);
      expect(tokens[1].type).toBe(TokenType.FROM);
      expect(tokens[2].type).toBe(TokenType.WHERE);
    });

    test("should tokenize identifiers", () => {
      const lexer = new Lexer("user_name table123 _private");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].value).toBe("user_name");
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].value).toBe("table123");
      expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2].value).toBe("_private");
    });
  });

  describe("String Literals", () => {
    test("should tokenize single quoted strings", () => {
      const lexer = new Lexer("'Hello World'");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe("Hello World");
    });

    test("should tokenize double quoted identifiers", () => {
      const lexer = new Lexer('"Hello World"');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].value).toBe("Hello World");
    });

    test("should handle escaped characters in strings", () => {
      const lexer = new Lexer("'Hello\\nWorld\\t'");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe("Hello\nWorld\t");
    });

    test("should throw error for unterminated string", () => {
      const lexer = new Lexer("'unterminated");

      expect(() => lexer.tokenize()).toThrow(SQLError);
    });
  });

  describe("Numeric Literals", () => {
    test("should tokenize integers", () => {
      const lexer = new Lexer("123 0 999");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe("123");
      expect(tokens[1].type).toBe(TokenType.NUMBER);
      expect(tokens[1].value).toBe("0");
      expect(tokens[2].type).toBe(TokenType.NUMBER);
      expect(tokens[2].value).toBe("999");
    });

    test("should tokenize decimal numbers", () => {
      const lexer = new Lexer("123.45 0.5 .75");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe("123.45");
      expect(tokens[1].type).toBe(TokenType.NUMBER);
      expect(tokens[1].value).toBe("0.5");
      // .75 should be tokenized as DOT followed by NUMBER
      expect(tokens[2].type).toBe(TokenType.DOT);
      expect(tokens[3].type).toBe(TokenType.NUMBER);
    });

    test("should tokenize scientific notation", () => {
      const lexer = new Lexer("1.23e10 5E-3 2e+5");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].value).toBe("1.23e10");
      expect(tokens[1].type).toBe(TokenType.NUMBER);
      expect(tokens[1].value).toBe("5E-3");
      expect(tokens[2].type).toBe(TokenType.NUMBER);
      expect(tokens[2].value).toBe("2e+5");
    });
  });

  describe("Operators", () => {
    test("should tokenize comparison operators", () => {
      const lexer = new Lexer("= != <> < <= > >=");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.EQUALS);
      expect(tokens[1].type).toBe(TokenType.NOT_EQUALS);
      expect(tokens[2].type).toBe(TokenType.NOT_EQUALS);
      expect(tokens[3].type).toBe(TokenType.LESS_THAN);
      expect(tokens[4].type).toBe(TokenType.LESS_THAN_EQUALS);
      expect(tokens[5].type).toBe(TokenType.GREATER_THAN);
      expect(tokens[6].type).toBe(TokenType.GREATER_THAN_EQUALS);
    });

    test("should tokenize arithmetic operators", () => {
      const lexer = new Lexer("+ - * / %");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.PLUS);
      expect(tokens[1].type).toBe(TokenType.MINUS);
      expect(tokens[2].type).toBe(TokenType.MULTIPLY);
      expect(tokens[3].type).toBe(TokenType.DIVIDE);
      expect(tokens[4].type).toBe(TokenType.MODULO);
    });

    test("should tokenize concatenation operator", () => {
      const lexer = new Lexer("||");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.CONCAT);
      expect(tokens[0].value).toBe("||");
    });
  });

  describe("Punctuation", () => {
    test("should tokenize punctuation marks", () => {
      const lexer = new Lexer(";,.()[]");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.SEMICOLON);
      expect(tokens[1].type).toBe(TokenType.COMMA);
      expect(tokens[2].type).toBe(TokenType.DOT);
      expect(tokens[3].type).toBe(TokenType.LEFT_PAREN);
      expect(tokens[4].type).toBe(TokenType.RIGHT_PAREN);
      expect(tokens[5].type).toBe(TokenType.LEFT_BRACKET);
      expect(tokens[6].type).toBe(TokenType.RIGHT_BRACKET);
    });
  });

  describe("Comments", () => {
    test("should handle single line comments with --", () => {
      const lexer = new Lexer("SELECT * -- this is a comment\nFROM users", {
        includeComments: true,
      });
      const tokens = lexer.tokenize();

      const commentToken = tokens.find((t) => t.type === TokenType.COMMENT);
      expect(commentToken).toBeDefined();
      expect(commentToken.value).toBe("this is a comment");
    });

    test("should handle single line comments with #", () => {
      const lexer = new Lexer("SELECT * # this is a comment\nFROM users", {
        includeComments: true,
      });
      const tokens = lexer.tokenize();

      const commentToken = tokens.find((t) => t.type === TokenType.COMMENT);
      expect(commentToken).toBeDefined();
      expect(commentToken.value).toBe("this is a comment");
    });

    test("should handle multi-line comments", () => {
      const lexer = new Lexer(
        "SELECT * /* this is a\nmulti-line comment */ FROM users",
        {
          includeComments: true,
        }
      );
      const tokens = lexer.tokenize();

      const commentToken = tokens.find((t) => t.type === TokenType.COMMENT);
      expect(commentToken).toBeDefined();
      expect(commentToken.value).toBe("this is a\nmulti-line comment");
    });

    test("should skip comments by default", () => {
      const lexer = new Lexer("SELECT * -- comment\nFROM users");
      const tokens = lexer.tokenize();

      const commentTokens = tokens.filter((t) => t.type === TokenType.COMMENT);
      expect(commentTokens).toHaveLength(0);
    });
  });

  describe("Quoted Identifiers", () => {
    test("should handle backtick quoted identifiers", () => {
      const lexer = new Lexer("`user name` `table-with-dashes`");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].value).toBe("user name");
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].value).toBe("table-with-dashes");
    });

    test("should throw error for unterminated quoted identifier", () => {
      const lexer = new Lexer("`unterminated");

      expect(() => lexer.tokenize()).toThrow(SQLError);
    });
  });

  describe("Position Tracking", () => {
    test("should track line and column positions", () => {
      const lexer = new Lexer("SELECT\n  *\n  FROM users");
      const tokens = lexer.tokenize();

      expect(tokens[0].line).toBe(1);
      expect(tokens[0].column).toBe(1);
      expect(tokens[1].line).toBe(2);
      expect(tokens[1].column).toBe(3);
      expect(tokens[2].line).toBe(3);
      expect(tokens[2].column).toBe(3);
    });

    test("should track start and end positions", () => {
      const lexer = new Lexer("SELECT users");
      const tokens = lexer.tokenize();

      expect(tokens[0].start).toBe(0);
      expect(tokens[0].end).toBe(6);
      expect(tokens[1].start).toBe(7);
      expect(tokens[1].end).toBe(12);
    });
  });

  describe("Whitespace Handling", () => {
    test("should skip whitespace by default", () => {
      const lexer = new Lexer("SELECT   *    FROM\t\tusers");
      const tokens = lexer.tokenize();

      const whitespaceTokens = tokens.filter(
        (t) => t.type === TokenType.WHITESPACE
      );
      expect(whitespaceTokens).toHaveLength(0);
    });

    test("should include whitespace when requested", () => {
      const lexer = new Lexer("SELECT * FROM users", {
        includeWhitespace: true,
      });
      const tokens = lexer.tokenize();

      const whitespaceTokens = tokens.filter(
        (t) => t.type === TokenType.WHITESPACE
      );
      expect(whitespaceTokens.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    test("should throw error for unexpected characters", () => {
      const lexer = new Lexer("SELECT @ FROM users");

      expect(() => lexer.tokenize()).toThrow(SQLError);
    });

    test("should provide detailed error information", () => {
      const lexer = new Lexer("SELECT @");

      try {
        lexer.tokenize();
        throw new Error("Expected error to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(SQLError);
        expect(error.code).toBe("LEXICAL_ERROR");
        expect(error.line).toBe(1);
        expect(error.column).toBe(8);
      }
    });
  });

  describe("Complex SQL Statements", () => {
    test("should tokenize complex SELECT statement", () => {
      const sql = `
                SELECT u.name, u.email, COUNT(o.id) as order_count
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                WHERE u.active = true AND u.created_at > '2023-01-01'
                GROUP BY u.id, u.name, u.email
                HAVING COUNT(o.id) > 0
                ORDER BY order_count DESC
                LIMIT 10 OFFSET 20
            `;

      const lexer = new Lexer(sql);
      const tokens = lexer.tokenize();

      // Should not throw and should produce reasonable number of tokens
      expect(tokens.length).toBeGreaterThan(30);
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
    });

    test("should tokenize INSERT statement", () => {
      const sql =
        "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')";

      const lexer = new Lexer(sql);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.INSERT);
      expect(tokens[1].type).toBe(TokenType.INTO);
      expect(tokens.find((t) => t.type === TokenType.VALUES)).toBeDefined();
    });

    test("should tokenize UPDATE statement", () => {
      const sql = "UPDATE users SET name = 'Jane' WHERE id = 1";

      const lexer = new Lexer(sql);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.UPDATE);
      expect(tokens.find((t) => t.type === TokenType.SET)).toBeDefined();
      expect(tokens.find((t) => t.type === TokenType.WHERE)).toBeDefined();
    });

    test("should tokenize DELETE statement", () => {
      const sql = "DELETE FROM users WHERE active = false";

      const lexer = new Lexer(sql);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.DELETE);
      expect(tokens[1].type).toBe(TokenType.FROM);
      expect(tokens.find((t) => t.type === TokenType.WHERE)).toBeDefined();
    });
  });
});
