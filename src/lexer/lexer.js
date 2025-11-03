/**
 * SQL Lexer (Tokenizer)
 *
 * Converts SQL source code into a sequence of tokens for parsing
 * Handles keywords, identifiers, operators, literals, and comments
 */

import { Token, TokenType, KEYWORDS } from "./token-types.js";
import { SQLError } from "../errors/sql-error.js";

export class Lexer {
  /**
   * Create a new lexer instance
   * @param {string} input - SQL source code to tokenize
   * @param {Object} options - Lexer options
   */
  constructor(input, options = {}) {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.options = {
      includeWhitespace: false,
      includeComments: false,
      ...options,
    };
  }

  /**
   * Get current character
   * @returns {string|null} Current character or null if at end
   */
  current() {
    if (this.position >= this.input.length) {
      return null;
    }
    return this.input[this.position];
  }

  /**
   * Peek at next character without advancing position
   * @param {number} offset - Offset from current position (default: 1)
   * @returns {string|null} Character at offset or null
   */
  peek(offset = 1) {
    const pos = this.position + offset;
    if (pos >= this.input.length) {
      return null;
    }
    return this.input[pos];
  }

  /**
   * Advance to next character
   * @returns {string|null} Next character or null
   */
  advance() {
    if (this.position >= this.input.length) {
      return null;
    }

    const char = this.input[this.position];
    this.position++;

    if (char === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    return char;
  }

  /**
   * Skip whitespace characters
   */
  skipWhitespace() {
    while (
      this.current() &&
      /\s/.test(this.current()) &&
      this.current() !== "\n"
    ) {
      this.advance();
    }
  }

  /**
   * Read identifier or keyword
   * @returns {Token} Identifier or keyword token
   */
  readIdentifier() {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";

    // First character must be letter or underscore
    if (!/[a-zA-Z_]/.test(this.current())) {
      throw SQLError.lexicalError(
        `Invalid identifier start character: ${this.current()}`,
        this.line,
        this.column
      );
    }

    // Read identifier characters
    while (this.current() && /[a-zA-Z0-9_]/.test(this.current())) {
      value += this.advance();
    }

    // Check if it's a keyword
    const upperValue = value.toUpperCase();
    const tokenType = KEYWORDS[upperValue] || TokenType.IDENTIFIER;

    return new Token(
      tokenType,
      value,
      startLine,
      startColumn,
      start,
      this.position
    );
  }

  /**
   * Read quoted identifier (backticks or double quotes)
   * @param {string} quote - Quote character
   * @returns {Token} Identifier token
   */
  readQuotedIdentifier(quote) {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";

    // Skip opening quote
    this.advance();

    while (this.current() && this.current() !== quote) {
      if (this.current() === "\\") {
        // Handle escape sequences
        this.advance();
        if (this.current()) {
          value += this.advance();
        }
      } else {
        value += this.advance();
      }
    }

    if (!this.current()) {
      throw SQLError.lexicalError(
        `Unterminated quoted identifier`,
        startLine,
        startColumn
      );
    }

    // Skip closing quote
    this.advance();

    return new Token(
      TokenType.IDENTIFIER,
      value,
      startLine,
      startColumn,
      start,
      this.position
    );
  }

  /**
   * Read string literal
   * @param {string} quote - Quote character (' or ")
   * @returns {Token} String token
   */
  readString(quote) {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";

    // Skip opening quote
    this.advance();

    while (this.current() && this.current() !== quote) {
      if (this.current() === "\\") {
        // Handle escape sequences
        this.advance();
        const escaped = this.current();
        if (escaped) {
          switch (escaped) {
            case "n":
              value += "\n";
              break;
            case "t":
              value += "\t";
              break;
            case "r":
              value += "\r";
              break;
            case "\\":
              value += "\\";
              break;
            case "'":
              value += "'";
              break;
            case '"':
              value += '"';
              break;
            default:
              value += escaped;
              break;
          }
          this.advance();
        }
      } else {
        value += this.advance();
      }
    }

    if (!this.current()) {
      throw SQLError.unterminatedString(startLine, startColumn);
    }

    // Skip closing quote
    this.advance();

    return new Token(
      TokenType.STRING,
      value,
      startLine,
      startColumn,
      start,
      this.position
    );
  }

  /**
   * Read numeric literal
   * @returns {Token} Number token
   */
  readNumber() {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";

    // Read integer part
    while (this.current() && /\d/.test(this.current())) {
      value += this.advance();
    }

    // Check for decimal point
    if (this.current() === "." && /\d/.test(this.peek())) {
      value += this.advance(); // Add decimal point

      // Read fractional part
      while (this.current() && /\d/.test(this.current())) {
        value += this.advance();
      }
    }

    // Check for scientific notation
    if (this.current() && /[eE]/.test(this.current())) {
      value += this.advance();

      if (this.current() && /[+-]/.test(this.current())) {
        value += this.advance();
      }

      if (!this.current() || !/\d/.test(this.current())) {
        throw SQLError.lexicalError(
          `Invalid number format`,
          startLine,
          startColumn
        );
      }

      while (this.current() && /\d/.test(this.current())) {
        value += this.advance();
      }
    }

    return new Token(
      TokenType.NUMBER,
      value,
      startLine,
      startColumn,
      start,
      this.position
    );
  }

  /**
   * Read single-line comment
   * @returns {Token|null} Comment token or null if not including comments
   */
  readSingleLineComment() {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";

    // Skip -- or #
    if (this.current() === "-") {
      this.advance(); // first -
      this.advance(); // second -
    } else {
      this.advance(); // #
    }

    // Read until end of line
    while (this.current() && this.current() !== "\n") {
      value += this.advance();
    }

    if (this.options.includeComments) {
      return new Token(
        TokenType.COMMENT,
        value.trim(),
        startLine,
        startColumn,
        start,
        this.position
      );
    }

    return null;
  }

  /**
   * Read multi-line comment
   * @returns {Token|null} Comment token or null if not including comments
   */
  readMultiLineComment() {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    let value = "";

    // Skip /*
    this.advance();
    this.advance();

    while (this.current()) {
      if (this.current() === "*" && this.peek() === "/") {
        // End of comment
        this.advance(); // *
        this.advance(); // /
        break;
      }
      value += this.advance();
    }

    if (this.options.includeComments) {
      return new Token(
        TokenType.COMMENT,
        value.trim(), // 去掉前后空格
        startLine,
        startColumn,
        start,
        this.position
      );
    }

    return null;
  }

  /**
   * Read operator token
   * @returns {Token} Operator token
   */
  readOperator() {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    const char = this.current();
    let value = char;
    let tokenType;

    this.advance();

    switch (char) {
      case "=":
        tokenType = TokenType.EQUALS;
        break;
      case "<":
        if (this.current() === "=") {
          value += this.advance();
          tokenType = TokenType.LESS_THAN_EQUALS;
        } else if (this.current() === ">") {
          value += this.advance();
          tokenType = TokenType.NOT_EQUALS;
        } else {
          tokenType = TokenType.LESS_THAN;
        }
        break;
      case ">":
        if (this.current() === "=") {
          value += this.advance();
          tokenType = TokenType.GREATER_THAN_EQUALS;
        } else {
          tokenType = TokenType.GREATER_THAN;
        }
        break;
      case "!":
        if (this.current() === "=") {
          value += this.advance();
          tokenType = TokenType.NOT_EQUALS;
        } else {
          throw SQLError.lexicalError(
            `Unexpected character: ${char}`,
            startLine,
            startColumn
          );
        }
        break;
      case "+":
        tokenType = TokenType.PLUS;
        break;
      case "-":
        tokenType = TokenType.MINUS;
        break;
      case "*":
        tokenType = TokenType.MULTIPLY;
        break;
      case "/":
        tokenType = TokenType.DIVIDE;
        break;
      case "%":
        tokenType = TokenType.MODULO;
        break;
      case "|":
        if (this.current() === "|") {
          value += this.advance();
          tokenType = TokenType.CONCAT;
        } else {
          throw SQLError.lexicalError(
            `Unexpected character: ${char}`,
            startLine,
            startColumn
          );
        }
        break;
      default:
        throw SQLError.lexicalError(
          `Unknown operator: ${char}`,
          startLine,
          startColumn
        );
    }

    return new Token(
      tokenType,
      value,
      startLine,
      startColumn,
      start,
      this.position
    );
  }

  /**
   * Read punctuation token
   * @returns {Token} Punctuation token
   */
  readPunctuation() {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    const char = this.advance();
    let tokenType;

    switch (char) {
      case ";":
        tokenType = TokenType.SEMICOLON;
        break;
      case ",":
        tokenType = TokenType.COMMA;
        break;
      case ".":
        tokenType = TokenType.DOT;
        break;
      case "(":
        tokenType = TokenType.LEFT_PAREN;
        break;
      case ")":
        tokenType = TokenType.RIGHT_PAREN;
        break;
      case "[":
        tokenType = TokenType.LEFT_BRACKET;
        break;
      case "]":
        tokenType = TokenType.RIGHT_BRACKET;
        break;
      default:
        throw SQLError.lexicalError(
          `Unknown punctuation: ${char}`,
          startLine,
          startColumn
        );
    }

    return new Token(
      tokenType,
      char,
      startLine,
      startColumn,
      start,
      this.position
    );
  }

  /**
   * Tokenize the input string
   * @returns {Array<Token>} Array of tokens
   */
  tokenize() {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (this.position < this.input.length) {
      const char = this.current();

      // Skip whitespace
      if (/\s/.test(char) && char !== "\n") {
        if (this.options.includeWhitespace) {
          const start = this.position;
          const startLine = this.line;
          const startColumn = this.column;
          this.skipWhitespace();

          this.tokens.push(
            new Token(
              TokenType.WHITESPACE,
              this.input.slice(start, this.position),
              startLine,
              startColumn,
              start,
              this.position
            )
          );
        } else {
          this.skipWhitespace();
        }
        continue;
      }

      // Handle newlines
      if (char === "\n") {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;
        this.advance();

        if (this.options.includeWhitespace) {
          this.tokens.push(
            new Token(
              TokenType.NEWLINE,
              "\n",
              startLine,
              startColumn,
              start,
              this.position
            )
          );
        }
        continue;
      }

      // Comments
      if (char === "-" && this.peek() === "-") {
        const token = this.readSingleLineComment();
        if (token) {
          this.tokens.push(token);
        }
        continue;
      }

      if (char === "#") {
        const token = this.readSingleLineComment();
        if (token) {
          this.tokens.push(token);
        }
        continue;
      }

      if (char === "/" && this.peek() === "*") {
        const token = this.readMultiLineComment();
        if (token) {
          this.tokens.push(token);
        }
        continue;
      }

      // String literals (single quotes only)
      if (char === "'") {
        this.tokens.push(this.readString(char));
        continue;
      }

      // Quoted identifiers (double quotes and backticks)
      if (char === '"' || char === "`") {
        this.tokens.push(this.readQuotedIdentifier(char));
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        this.tokens.push(this.readIdentifier());
        continue;
      }

      // Operators
      if ("=<>!+-*/%|".includes(char)) {
        this.tokens.push(this.readOperator());
        continue;
      }

      // Punctuation
      if (";,.()[]".includes(char)) {
        this.tokens.push(this.readPunctuation());
        continue;
      }

      // Unknown character
      throw SQLError.lexicalError(
        `Unexpected character: ${char}`,
        this.line,
        this.column
      );
    }

    // Add EOF token
    this.tokens.push(
      new Token(
        TokenType.EOF,
        "",
        this.line,
        this.column,
        this.position,
        this.position
      )
    );

    return this.tokens;
  }

  /**
   * Get all tokens as JSON
   * @returns {Array<Object>} Array of token objects
   */
  getTokensAsJSON() {
    return this.tokens.map((token) => token.toJSON());
  }
}
