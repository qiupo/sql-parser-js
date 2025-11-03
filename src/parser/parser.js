/**
 * SQL Parser
 *
 * Converts a sequence of tokens into an Abstract Syntax Tree (AST)
 * Supports SELECT, INSERT, UPDATE, DELETE statements with comprehensive SQL syntax
 */

import { TokenType } from "../lexer/token-types.js";
import { SQLError } from "../errors/sql-error.js";
import { AST } from "../ast/ast-nodes.js";

export class Parser {
  /**
   * Check if a token can be used as an alias
   * @param {Token} token - Token to check
   * @returns {boolean} True if the token can be used as an alias
   */
  canBeAlias(token) {
    if (token.is(TokenType.IDENTIFIER)) {
      return true;
    }

    // Allow certain keywords as aliases
    const aliasKeywords = [
      TokenType.DATE,
      TokenType.TIME,
      TokenType.TIMESTAMP,
      TokenType.YEAR,
      TokenType.MONTH,
      TokenType.DAY,
      TokenType.HOUR,
      TokenType.MINUTE,
      TokenType.SECOND,
      TokenType.COUNT,
      TokenType.SUM,
      TokenType.AVG,
      TokenType.MIN,
      TokenType.MAX,
      // Window function keywords can also be used as aliases
      TokenType.ROW_NUMBER,
      TokenType.RANK,
      TokenType.DENSE_RANK,
      TokenType.LEAD,
      TokenType.LAG,
      TokenType.FIRST_VALUE,
      TokenType.LAST_VALUE,
      TokenType.NTH_VALUE,
    ];
    return aliasKeywords.includes(token.type);
  }

  /**
   * Check if a token is a keyword that can be used as a function name
   * @param {Token} token - Token to check
   * @returns {boolean} True if the token can be used as a function name
   */
  isFunctionKeyword(token) {
    const functionKeywords = [
      TokenType.DATE,
      TokenType.TIME,
      TokenType.TIMESTAMP,
      TokenType.COUNT,
      TokenType.SUM,
      TokenType.AVG,
      TokenType.MIN,
      TokenType.MAX,
      TokenType.YEAR,
      TokenType.MONTH,
      TokenType.DAY,
      // Window functions
      TokenType.ROW_NUMBER,
      TokenType.RANK,
      TokenType.DENSE_RANK,
      TokenType.LEAD,
      TokenType.LAG,
      TokenType.FIRST_VALUE,
      TokenType.LAST_VALUE,
      TokenType.NTH_VALUE,
    ];
    return functionKeywords.includes(token.type);
  }

  /**
   * Create a new parser instance
   * @param {Array<Token>} tokens - Array of tokens from lexer
   * @param {Object} options - Parser options
   */
  constructor(tokens, options = {}) {
    this.tokens = tokens.filter(
      (token) =>
        !token.isOneOf(
          TokenType.WHITESPACE,
          TokenType.NEWLINE,
          TokenType.COMMENT
        )
    );
    this.position = 0;
    this.options = {
      strict: false,
      allowPartialParsing: true,
      ...options,
    };
  }

  /**
   * Get current token
   * @returns {Token|null} Current token or null if at end
   */
  current() {
    if (this.position >= this.tokens.length) {
      return null;
    }
    return this.tokens[this.position];
  }

  /**
   * Peek at next token without advancing
   * @param {number} offset - Offset from current position
   * @returns {Token|null} Token at offset or null
   */
  peek(offset = 1) {
    const pos = this.position + offset;
    if (pos >= this.tokens.length) {
      return null;
    }
    return this.tokens[pos];
  }

  /**
   * Advance to next token
   * @returns {Token|null} Next token or null
   */
  advance() {
    if (this.position < this.tokens.length) {
      this.position++;
    }
    return this.current();
  }

  /**
   * Check if current token matches expected type
   * @param {string} tokenType - Expected token type
   * @returns {boolean} True if matches
   */
  match(tokenType) {
    const token = this.current();
    return token && token.is(tokenType);
  }

  /**
   * Check if current token matches any of the expected types
   * @param {...string} tokenTypes - Expected token types
   * @returns {boolean} True if matches any type
   */
  matchAny(...tokenTypes) {
    const token = this.current();
    return token && token.isOneOf(...tokenTypes);
  }

  /**
   * Consume token if it matches expected type
   * @param {string} tokenType - Expected token type
   * @returns {Token|null} Consumed token or null
   */
  consume(tokenType) {
    if (this.match(tokenType)) {
      const token = this.current();
      this.advance();
      return token;
    }
    return null;
  }

  /**
   * Expect and consume token of given type, throw error if not found
   * @param {string} tokenType - Expected token type
   * @param {string} message - Error message if not found
   * @returns {Token} Consumed token
   */
  expect(tokenType, _message = null) {
    const token = this.current();

    if (!token || token.is(TokenType.EOF)) {
      throw SQLError.unexpectedEnd(
        this.tokens[this.tokens.length - 1]?.line || 1,
        this.tokens[this.tokens.length - 1]?.column || 1
      );
    }

    if (!token.is(tokenType)) {
      throw SQLError.unexpectedToken(
        tokenType,
        token.type,
        token.line,
        token.column
      );
    }

    this.advance();
    return token;
  }

  /**
   * Parse the token stream into an AST
   * @returns {ASTNode} Root AST node
   */
  parse() {
    // Check for empty input (only EOF token)
    if (
      !this.current() ||
      (this.current().is(TokenType.EOF) && this.position === 0)
    ) {
      throw new SQLError("Empty input", "EMPTY_INPUT", 1, 1);
    }

    const statement = this.parseStatement();

    // Check for trailing tokens (except EOF)
    if (this.current() && !this.current().is(TokenType.EOF)) {
      if (this.options.strict) {
        throw SQLError.unexpectedToken(
          "end of statement",
          this.current().type,
          this.current().line,
          this.current().column
        );
      }
    }

    return statement;
  }

  /**
   * Parse a SQL statement
   * @returns {ASTNode} Statement AST node
   */
  parseStatement() {
    const token = this.current();

    if (!token) {
      throw SQLError.unexpectedEnd(1, 1);
    }

    switch (token.type) {
      case TokenType.WITH:
        return this.parseWithStatement();
      case TokenType.SELECT:
        return this.parseUnionStatement();
      case TokenType.INSERT:
        return this.parseInsertStatement();
      case TokenType.UPDATE:
        return this.parseUpdateStatement();
      case TokenType.DELETE:
        return this.parseDeleteStatement();
      default:
        throw SQLError.unexpectedToken(
          "WITH, SELECT, INSERT, UPDATE, or DELETE",
          token.type,
          token.line,
          token.column
        );
    }
  }

  /**
   * Parse UNION statement (handles SELECT with optional UNION clauses)
   * @returns {UnionStatement|SelectStatement} UNION or SELECT AST node
   */
  parseUnionStatement() {
     const left = this.parseSelectStatement();

     // Check for UNION
     if (this.match(TokenType.UNION)) {
       this.advance(); // consume UNION
       
       const all = this.consume(TokenType.ALL) !== null;
       const right = this.parseUnionStatementWithoutOrderLimit(); // Recursive for multiple UNIONs

       // Parse optional ORDER BY and LIMIT for the entire UNION
       let orderByClause = null;
       if (this.match(TokenType.ORDER)) {
         orderByClause = this.parseOrderByClause();
       }

       let limitClause = null;
       if (this.match(TokenType.LIMIT)) {
         limitClause = this.parseLimitClause();
       }

       return AST.union({
         left,
         right,
         unionType: all ? 'UNION ALL' : 'UNION',
         all,
         orderBy: orderByClause,
         limit: limitClause
       });
     }

     // Handle ORDER BY and LIMIT for non-UNION SELECT statements
     let orderByClause = null;
     if (this.match(TokenType.ORDER)) {
       orderByClause = this.parseOrderByClause();
     }

     let limitClause = null;
     if (this.match(TokenType.LIMIT)) {
       limitClause = this.parseLimitClause();
     }

     // If we have ORDER BY or LIMIT, update the SELECT statement
     if (orderByClause || limitClause) {
       left.orderBy = orderByClause;
       left.limit = limitClause;
     }

     return left;
    }

  /**
   * Parse UNION statement without ORDER BY and LIMIT clauses (for recursive parsing)
   * @returns {UnionStatement|SelectStatement} UNION or SELECT AST node
   */
  parseUnionStatementWithoutOrderLimit() {
     const left = this.parseSelectStatementWithoutOrderLimit();

     // Check for UNION
     if (this.match(TokenType.UNION)) {
       this.advance(); // consume UNION
       
       const all = this.consume(TokenType.ALL) !== null;
       const right = this.parseUnionStatementWithoutOrderLimit(); // Recursive for multiple UNIONs

       return AST.union({
         left,
         right,
         unionType: all ? 'UNION ALL' : 'UNION',
         all
       });
     }

     return left;
    }

  /**
   * Parse SELECT statement without ORDER BY and LIMIT clauses
   * @returns {SelectStatement} SELECT AST node
   */
  parseSelectStatementWithoutOrderLimit() {
    this.expect(TokenType.SELECT);

    const distinct = this.consume(TokenType.DISTINCT) !== null;
    const columns = this.parseSelectColumns();

    let fromClause = null;
    if (this.match(TokenType.FROM)) {
      fromClause = this.parseFromClause();
    }

    let whereClause = null;
    if (this.match(TokenType.WHERE)) {
      whereClause = this.parseWhereClause();
    }

    let groupByClause = null;
    if (this.match(TokenType.GROUP)) {
      groupByClause = this.parseGroupByClause();
    }

    let havingClause = null;
    if (this.match(TokenType.HAVING)) {
      havingClause = this.parseHavingClause();
    }

    return AST.select({
      distinct,
      columns,
      from: fromClause,
      where: whereClause,
      groupBy: groupByClause,
      having: havingClause
    });
  }

  /**
   * Parse WITH statement (Common Table Expressions)
   * @returns {SelectStatement|UnionStatement} Statement with WITH clause
   */
  parseWithStatement() {
    this.expect(TokenType.WITH);
    
    const recursive = this.consume(TokenType.RECURSIVE) !== null;
    const expressions = [];

    // Parse CTE expressions
    do {
      const name = this.expect(TokenType.IDENTIFIER).value;
      
      let columns = null;
      if (this.match(TokenType.LEFT_PAREN)) {
        this.advance(); // consume (
        columns = [];
        do {
          columns.push(this.expect(TokenType.IDENTIFIER).value);
        } while (this.consume(TokenType.COMMA));
        this.expect(TokenType.RIGHT_PAREN);
      }

      this.expect(TokenType.AS);
      this.expect(TokenType.LEFT_PAREN);
      const query = this.parseUnionStatement();
      this.expect(TokenType.RIGHT_PAREN);

      expressions.push(AST.cte(name, columns, query));
    } while (this.consume(TokenType.COMMA));

    // Parse the main SELECT statement
    const mainQuery = this.parseUnionStatement();
    
    // Attach WITH clause to the appropriate part of the query
    const withClause = AST.with({ recursive, expressions });
    
    // Always attach WITH clause directly to the main query
    mainQuery.with = withClause;
    
    return mainQuery;
  }

  /**
   * Parse SELECT statement
   * @returns {SelectStatement} SELECT AST node
   */
  parseSelectStatement() {
    this.expect(TokenType.SELECT);

    const distinct = this.consume(TokenType.DISTINCT) !== null;
    const columns = this.parseSelectColumns();

    // FROM clause is optional for SELECT statements (e.g., SELECT 'value' as alias)
    let fromClause = null;
    if (this.match(TokenType.FROM)) {
      fromClause = this.parseFromClause();
    }

    let whereClause = null;
    if (this.match(TokenType.WHERE)) {
      whereClause = this.parseWhereClause();
    }

    let groupByClause = null;
    if (this.match(TokenType.GROUP)) {
      groupByClause = this.parseGroupByClause();
    }

    let havingClause = null;
    if (this.match(TokenType.HAVING)) {
      havingClause = this.parseHavingClause();
    }

    // ORDER BY and LIMIT are handled in parseUnionStatement for UNION compatibility
    return AST.select({
      distinct,
      columns,
      from: fromClause,
      where: whereClause,
      groupBy: groupByClause,
      having: havingClause,
      orderBy: null,
      limit: null,
    });
  }

  /**
   * Parse SELECT columns
   * @returns {Array} Array of column expressions
   */
  parseSelectColumns() {
    const columns = [];

    do {
      if (this.match(TokenType.MULTIPLY)) {
        this.advance();
        columns.push(AST.wildcard());
      } else {
        const expr = this.parseExpression();
        let alias = null;

        if (this.match(TokenType.AS)) {
          this.advance();
          if (this.canBeAlias(this.current())) {
            alias = this.current().value;
            this.advance();
          } else {
            throw SQLError.unexpectedToken(
              "alias identifier",
              this.current().type,
              this.current().line,
              this.current().column
            );
          }
        } else if (this.canBeAlias(this.current())) {
          // Implicit alias
          alias = this.current().value;
          this.advance();
        }

        if (alias) {
          expr.alias = alias;
        }

        columns.push(expr);
      }
    } while (this.consume(TokenType.COMMA));

    return columns;
  }

  /**
   * Parse FROM clause
   * @returns {FromClause} FROM clause AST node
   */
  parseFromClause() {
    this.expect(TokenType.FROM);
    const tables = [];
    const joins = [];

    do {
      const table = this.parseTableReference();
      tables.push(table);

      // Handle JOINs
      while (
        this.matchAny(
          TokenType.JOIN,
          TokenType.INNER,
          TokenType.LEFT,
          TokenType.RIGHT,
          TokenType.FULL,
          TokenType.CROSS
        )
      ) {
        const join = this.parseJoinClause();
        joins.push(join); // Add JOIN to joins array
      }
    } while (this.consume(TokenType.COMMA));

    return AST.from(tables, joins); // Pass both tables and joins arrays
  }

  /**
   * Parse table reference
   * @returns {TableReference} Table reference AST node
   */
  /**
   * Parse table reference (table name or subquery)
   * @returns {TableReference|SubQuery} Table reference or subquery AST node
   */
  parseTableReference() {
    // Check for subquery in FROM clause
    if (this.match(TokenType.LEFT_PAREN)) {
      this.advance();
      
      if (this.match(TokenType.SELECT)) {
        const query = this.parseSelectStatement();
        this.expect(TokenType.RIGHT_PAREN);
        
        // Check for alias after subquery
        let alias = null;
        if (this.match(TokenType.AS)) {
          this.advance();
          alias = this.expect(TokenType.IDENTIFIER).value;
        } else if (this.match(TokenType.IDENTIFIER) && this.canBeAlias(this.current())) {
          alias = this.current().value;
          this.advance();
        }
        
        return AST.subquery(query, alias);
      } else {
        // Not a subquery, backtrack
        this.position--;
      }
    }
    
    // Regular table reference
    const name = this.expect(TokenType.IDENTIFIER).value;
    let alias = null;

    if (this.match(TokenType.AS)) {
      this.advance();
      alias = this.expect(TokenType.IDENTIFIER).value;
    } else if (this.match(TokenType.IDENTIFIER) && this.canBeAlias(this.current())) {
      alias = this.current().value;
      this.advance();
    }

    return AST.table(name, alias);
  }

  /**
   * Parse JOIN clause
   * @returns {JoinClause} JOIN clause AST node
   */
  parseJoinClause() {
    let joinType = "INNER";

    if (this.match(TokenType.LEFT)) {
      this.advance();
      joinType = "LEFT";
      if (this.match(TokenType.OUTER)) {
        this.advance();
        joinType = "LEFT OUTER";
      }
    } else if (this.match(TokenType.RIGHT)) {
      this.advance();
      joinType = "RIGHT";
      if (this.match(TokenType.OUTER)) {
        this.advance();
        joinType = "RIGHT OUTER";
      }
    } else if (this.match(TokenType.FULL)) {
      this.advance();
      joinType = "FULL";
      if (this.match(TokenType.OUTER)) {
        this.advance();
        joinType = "FULL OUTER";
      }
    } else if (this.match(TokenType.CROSS)) {
      this.advance();
      joinType = "CROSS";
    } else if (this.match(TokenType.INNER)) {
      this.advance();
      joinType = "INNER";
    }

    this.expect(TokenType.JOIN);
    const table = this.parseTableReference();
    
    // CROSS JOIN doesn't require ON condition
    let condition = null;
    if (joinType !== "CROSS") {
      this.expect(TokenType.ON);
      condition = this.parseExpression();
    }

    return AST.join(joinType, table, condition);
  }

  /**
   * Parse WHERE clause
   * @returns {WhereClause} WHERE clause AST node
   */
  parseWhereClause() {
    this.expect(TokenType.WHERE);
    const condition = this.parseExpression();
    return condition; // 直接返回条件表达式，保持向后兼容性
  }

  /**
   * Parse GROUP BY clause
   * @returns {GroupByClause} GROUP BY clause AST node
   */
  parseGroupByClause() {
    this.expect(TokenType.GROUP);
    this.expect(TokenType.BY);

    const columns = [];
    do {
      columns.push(this.parseExpression());
    } while (this.consume(TokenType.COMMA));

    return AST.groupBy(columns);
  }

  /**
   * Parse HAVING clause
   * @returns {HavingClause} HAVING clause AST node
   */
  parseHavingClause() {
    this.expect(TokenType.HAVING);
    const condition = this.parseExpression();
    return AST.having(condition);
  }

  /**
   * Parse ORDER BY clause
   * @returns {OrderByClause} ORDER BY clause AST node
   */
  parseOrderByClause() {
    this.expect(TokenType.ORDER);
    this.expect(TokenType.BY);

    const columns = [];
    do {
      const column = this.parseExpression();
      let direction = "ASC";

      if (this.matchAny(TokenType.ASC, TokenType.DESC)) {
        direction = this.current().value.toUpperCase();
        this.advance();
      }

      columns.push(AST.orderByColumn(column, direction));
    } while (this.consume(TokenType.COMMA));

    return AST.orderBy(columns);
  }

  /**
   * Parse LIMIT clause
   * @returns {LimitClause} LIMIT clause AST node
   */
  parseLimitClause() {
    this.expect(TokenType.LIMIT);
    const count = this.parseExpression();

    let offset = null;
    if (this.match(TokenType.OFFSET)) {
      this.advance();
      offset = this.parseExpression();
    }

    return AST.limit(count, offset);
  }

  /**
   * Parse INSERT statement
   * @returns {InsertStatement} INSERT AST node
   */
  parseInsertStatement() {
    this.expect(TokenType.INSERT);
    this.expect(TokenType.INTO);

    const table = this.parseTableReference();

    const columns = [];
    if (this.match(TokenType.LEFT_PAREN)) {
      this.advance();
      do {
        columns.push(this.expect(TokenType.IDENTIFIER).value);
      } while (this.consume(TokenType.COMMA));
      this.expect(TokenType.RIGHT_PAREN);
    }

    this.expect(TokenType.VALUES);
    const values = [];

    do {
      this.expect(TokenType.LEFT_PAREN);
      const valueList = [];
      do {
        valueList.push(this.parseExpression());
      } while (this.consume(TokenType.COMMA));
      this.expect(TokenType.RIGHT_PAREN);
      values.push(AST.valuesList(valueList));
    } while (this.consume(TokenType.COMMA));

    return AST.insert({
      table,
      columns,
      values,
    });
  }

  /**
   * Parse UPDATE statement
   * @returns {UpdateStatement} UPDATE AST node
   */
  parseUpdateStatement() {
    this.expect(TokenType.UPDATE);
    const table = this.parseTableReference();
    this.expect(TokenType.SET);

    const assignments = [];
    do {
      const column = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.EQUALS);
      const value = this.parseExpression();
      assignments.push(AST.assignment(column, value));
    } while (this.consume(TokenType.COMMA));

    let whereClause = null;
    if (this.match(TokenType.WHERE)) {
      whereClause = this.parseWhereClause();
    }

    return AST.update({
      table,
      set: assignments,
      where: whereClause,
    });
  }

  /**
   * Parse DELETE statement
   * @returns {DeleteStatement} DELETE AST node
   */
  parseDeleteStatement() {
    this.expect(TokenType.DELETE);
    this.expect(TokenType.FROM);

    const table = this.parseTableReference();

    let whereClause = null;
    if (this.match(TokenType.WHERE)) {
      whereClause = this.parseWhereClause();
    }

    return AST.delete({
      from: table,
      where: whereClause,
    });
  }

  /**
   * Parse expression with operator precedence
   * @returns {ASTNode} Expression AST node
   */
  parseExpression() {
    return this.parseOrExpression();
  }

  /**
   * Parse OR expression (lowest precedence)
   * @returns {ASTNode} Expression AST node
   */
  parseOrExpression() {
    let left = this.parseAndExpression();

    while (this.match(TokenType.OR)) {
      const operator = this.current().value;
      this.advance();
      const right = this.parseAndExpression();
      left = AST.binary(left, operator, right);
    }

    return left;
  }

  /**
   * Parse AND expression
   * @returns {ASTNode} Expression AST node
   */
  parseAndExpression() {
    let left = this.parseEqualityExpression();

    while (this.match(TokenType.AND)) {
      const operator = this.current().value;
      this.advance();
      const right = this.parseEqualityExpression();
      left = AST.binary(left, operator, right);
    }

    return left;
  }

  /**
   * Parse equality expression (=, !=, <>)
   * @returns {ASTNode} Expression AST node
   */
  parseEqualityExpression() {
    let left = this.parseRelationalExpression();

    while (this.matchAny(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const operator = this.current().value;
      this.advance();
      const right = this.parseRelationalExpression();
      left = AST.binary(left, operator, right);
    }

    return left;
  }

  /**
   * Parse relational expression (<, >, <=, >=)
   * @returns {ASTNode} Expression AST node
   */
  parseRelationalExpression() {
    let left = this.parseAdditiveExpression();

    while (
      this.matchAny(
        TokenType.LESS_THAN,
        TokenType.GREATER_THAN,
        TokenType.LESS_THAN_EQUALS,
        TokenType.GREATER_THAN_EQUALS,
        TokenType.LIKE,
        TokenType.ILIKE,
        TokenType.IN,
        TokenType.BETWEEN,
        TokenType.IS
      )
    ) {
      const operator = this.current().value;
      this.advance();

      // Handle IN operator specially - it expects a list of values or a subquery
      if (operator === "IN") {
        this.expect(TokenType.LEFT_PAREN);
        
        // Check if this is a subquery
        if (this.match(TokenType.SELECT)) {
          const query = this.parseSelectStatement();
          this.expect(TokenType.RIGHT_PAREN);
          left = AST.binary(left, operator, AST.subquery(query));
        } else {
          // Handle list of values
          const values = [];

          if (!this.match(TokenType.RIGHT_PAREN)) {
            values.push(this.parseExpression());

            while (this.match(TokenType.COMMA)) {
              this.advance();
              values.push(this.parseExpression());
            }
          }

          this.expect(TokenType.RIGHT_PAREN);
          left = AST.binary(left, operator, AST.valuesList(values));
        }
      } else if (operator === "BETWEEN") {
        // Handle BETWEEN operator - it expects two values separated by AND
        const startValue = this.parseAdditiveExpression();
        this.expect(TokenType.AND);
        const endValue = this.parseAdditiveExpression();
        left = AST.binary(left, operator, AST.betweenRange(startValue, endValue));
      } else if (operator === "IS") {
        // Handle IS NULL and IS NOT NULL
        let isOperator = "IS";
        if (this.match(TokenType.NOT)) {
          this.advance();
          isOperator = "IS NOT";
        }
        
        if (this.match(TokenType.NULL)) {
          this.advance();
          left = AST.binary(left, isOperator, AST.literal(null, 'NULL'));
        } else {
          throw new SQLError(`Expected NULL after ${isOperator}`, 
            this.current()?.line || 1, 
            this.current()?.column || 1);
        }
      } else {
        // Check for ANY/ALL after comparison operators
        if (this.matchAny(TokenType.ANY, TokenType.ALL)) {
          const quantifier = this.current().value;
          this.advance();
          
          this.expect(TokenType.LEFT_PAREN);
          
          // Parse subquery for ANY/ALL
          if (this.match(TokenType.SELECT)) {
            const query = this.parseSelectStatement();
            this.expect(TokenType.RIGHT_PAREN);
            const right = AST.subquery(query);
            left = AST.binary(left, `${operator} ${quantifier}`, right);
          } else {
            throw new SQLError(`Expected SELECT after ${quantifier}`, 
              this.current()?.line || 1, 
              this.current()?.column || 1);
          }
        } else {
          const right = this.parseAdditiveExpression();
          left = AST.binary(left, operator, right);
        }
      }
    }

    return left;
  }

  /**
   * Parse additive expression (+, -)
   * @returns {ASTNode} Expression AST node
   */
  parseAdditiveExpression() {
    let left = this.parseMultiplicativeExpression();

    while (this.matchAny(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.current().value;
      this.advance();
      const right = this.parseMultiplicativeExpression();
      left = AST.binary(left, operator, right);
    }

    return left;
  }

  /**
   * Parse multiplicative expression (*, /, %, ||)
   * @returns {ASTNode} Expression AST node
   */
  parseMultiplicativeExpression() {
    let left = this.parseUnaryExpression();

    while (
      this.matchAny(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO, TokenType.CONCAT)
    ) {
      const operator = this.current().value;
      this.advance();
      const right = this.parseUnaryExpression();
      left = AST.binary(left, operator, right);
    }

    return left;
  }

  /**
   * Parse unary expression (NOT, -, +)
   * @returns {ASTNode} Expression AST node
   */
  parseUnaryExpression() {
    if (this.matchAny(TokenType.NOT, TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.current().value;
      this.advance();
      const operand = this.parseUnaryExpression();
      return AST.unary(operator, operand);
    }

    // 处理EXISTS子查询
    if (this.match(TokenType.EXISTS)) {
      this.advance();
      this.expect(TokenType.LEFT_PAREN);
      const subquery = this.parseSelectStatement();
      this.expect(TokenType.RIGHT_PAREN);
      return AST.unary('EXISTS', subquery);
    }

    return this.parsePrimaryExpression();
  }

  /**
   * Parse primary expression (literals, identifiers, function calls, parentheses)
   * @returns {ASTNode} Expression AST node
   */
  parsePrimaryExpression() {
    const token = this.current();

    if (!token) {
      throw SQLError.unexpectedEnd(
        this.tokens[this.tokens.length - 1]?.line || 1,
        this.tokens[this.tokens.length - 1]?.column || 1
      );
    }

    // Parenthesized expression or subquery
    if (token.is(TokenType.LEFT_PAREN)) {
      this.advance();
      
      // Check if this is a subquery (starts with SELECT)
      if (this.match(TokenType.SELECT)) {
        const query = this.parseSelectStatement();
        this.expect(TokenType.RIGHT_PAREN);
        return AST.subquery(query);
      }
      
      // Regular parenthesized expression
      const expr = this.parseExpression();
      this.expect(TokenType.RIGHT_PAREN);
      return expr;
    }

    // INTERVAL expression
    if (token.is(TokenType.INTERVAL)) {
      this.advance();
      const value = this.parseExpression(); // Parse the interval value (e.g., '1')
      
      // Parse the unit (YEAR, MONTH, DAY, etc.)
      let unit = 'DAY'; // default unit
      if (this.matchAny(TokenType.YEAR, TokenType.MONTH, TokenType.DAY, 
                        TokenType.HOUR, TokenType.MINUTE, TokenType.SECOND)) {
        unit = this.current().value.toUpperCase();
        this.advance();
      } else if (this.match(TokenType.IDENTIFIER)) {
        // Handle cases where unit might be an identifier (like 'year', 'month', etc.)
        const unitValue = this.current().value.toUpperCase();
        if (['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND'].includes(unitValue)) {
          unit = unitValue;
          this.advance();
        }
      }
      
      return AST.interval(value, unit);
    }

    // Literals
    if (token.is(TokenType.STRING)) {
      this.advance();
      return AST.literal(token.value, "string");
    }

    if (token.is(TokenType.NUMBER)) {
      this.advance();
      const value = token.value.includes(".")
        ? parseFloat(token.value)
        : parseInt(token.value, 10);
      return AST.literal(value, "number");
    }

    if (token.is(TokenType.BOOLEAN)) {
      this.advance();
      return AST.literal(token.value.toLowerCase() === "true", "boolean");
    }

    if (token.is(TokenType.NULL)) {
      this.advance();
      return AST.literal(null, "null");
    }

    // CASE expression
    if (token.is(TokenType.CASE)) {
      return this.parseCaseExpression();
    }

    // Function call or identifier (including keywords that can be function names)
    if (token.is(TokenType.IDENTIFIER) || this.isFunctionKeyword(token)) {
      const name = token.value;
      this.advance();

      // Check for function call
      if (this.match(TokenType.LEFT_PAREN)) {
        this.advance();
        
        // Special handling for EXTRACT function: EXTRACT(field FROM source)
        if (name.toUpperCase() === 'EXTRACT') {
          // EXTRACT field can be a keyword like YEAR, MONTH, DAY, etc.
          const fieldToken = this.current();
          let field;
          
          if (fieldToken.is(TokenType.IDENTIFIER) || 
              fieldToken.is(TokenType.YEAR) || 
              fieldToken.is(TokenType.MONTH) || 
              fieldToken.is(TokenType.DAY) ||
              fieldToken.is(TokenType.HOUR) ||
              fieldToken.is(TokenType.MINUTE) ||
              fieldToken.is(TokenType.SECOND)) {
            field = fieldToken.value;
            this.advance();
          } else {
            throw SQLError.unexpectedToken("date/time field", fieldToken.type, fieldToken.line, fieldToken.column);
          }
          
          this.expect(TokenType.FROM);
          const source = this.parseExpression();
          this.expect(TokenType.RIGHT_PAREN);
          
          // Create a special EXTRACT function call
          const func = AST.function(name, [AST.literal(field, "string"), source]);
          func.isExtract = true;
          return func;
        }
        
        const args = [];
        let distinct = false;

        if (!this.match(TokenType.RIGHT_PAREN)) {
          // Check for DISTINCT keyword in aggregate functions
          if (this.match(TokenType.DISTINCT)) {
            distinct = true;
            this.advance();
          }

          do {
            // Handle special case of * in function calls (e.g., COUNT(*))
            if (this.match(TokenType.MULTIPLY)) {
              this.advance();
              args.push(AST.literal("*", "STAR"));
            } else {
              args.push(this.parseExpression());
            }
          } while (this.consume(TokenType.COMMA));
        }

        this.expect(TokenType.RIGHT_PAREN);
        const func = AST.function(name, args);
        if (distinct) {
          func.distinct = true;
        }
        
        // Check for OVER clause (window functions)
        if (this.match(TokenType.OVER)) {
          this.advance();
          const overClause = this.parseOverClause();
          return AST.windowFunction({ function: func, over: overClause });
        }
        
        return func;
      }

      // Column reference
      let table = null;
      if (this.match(TokenType.DOT)) {
        this.advance();
        table = name;
        const columnName = this.expect(TokenType.IDENTIFIER).value;
        return AST.column(columnName, table);
      }

      return AST.column(name);
    }

    throw SQLError.unexpectedToken(
      "expression",
      token.type,
      token.line,
      token.column
    );
  }

  /**
   * 解析CASE表达式
   * CASE
   *   WHEN condition1 THEN result1
   *   WHEN condition2 THEN result2
   *   ...
   *   [ELSE result]
   * END
   */
  parseCaseExpression() {
    this.expect(TokenType.CASE);

    let expression = null;
    const whenClauses = [];
    let elseClause = null;

    // 检查是否是简单CASE表达式 (CASE expression WHEN value THEN result)
    // 还是搜索型CASE表达式 (CASE WHEN condition THEN result)
    if (!this.match(TokenType.WHEN)) {
      // 简单CASE表达式：CASE expression WHEN value THEN result
      expression = this.parseExpression();
    }

    // 解析WHEN子句
    while (this.match(TokenType.WHEN)) {
      this.advance();
      const condition = this.parseExpression();
      this.expect(TokenType.THEN);
      const result = this.parseExpression();
      whenClauses.push(AST.when(condition, result));
    }

    // 解析可选的ELSE子句
    if (this.match(TokenType.ELSE)) {
      this.advance();
      elseClause = this.parseExpression();
    }

    this.expect(TokenType.END);

    return AST.case({
      expression,
      whenClauses,
      elseClause,
    });
  }

  /**
   * 解析OVER子句
   * OVER (
   *   [PARTITION BY column1, column2, ...]
   *   [ORDER BY column1 [ASC|DESC], column2 [ASC|DESC], ...]
   *   [ROWS|RANGE frame_specification]
   * )
   */
  parseOverClause() {
    this.expect(TokenType.LEFT_PAREN);

    let partitionBy = null;
    let orderBy = null;
    let frame = null;

    // 解析PARTITION BY子句
    if (this.match(TokenType.PARTITION)) {
      this.advance();
      this.expect(TokenType.BY);
      partitionBy = [];
      do {
        partitionBy.push(this.parseExpression());
      } while (this.consume(TokenType.COMMA));
    }

    // 解析ORDER BY子句
    if (this.match(TokenType.ORDER)) {
      this.advance();
      this.expect(TokenType.BY);
      orderBy = [];
      do {
        const column = this.parseExpression();
        let direction = 'ASC';
        if (this.matchAny(TokenType.ASC, TokenType.DESC)) {
          direction = this.current().value.toUpperCase();
          this.advance();
        }
        orderBy.push(AST.orderByColumn(column, direction));
      } while (this.consume(TokenType.COMMA));
    }

    // 解析窗口框架（ROWS/RANGE）
    if (this.matchAny(TokenType.ROWS, TokenType.RANGE)) {
      frame = this.parseWindowFrame();
    }

    this.expect(TokenType.RIGHT_PAREN);

    return AST.over({
       partitionBy,
       orderBy,
       frame
     });
   }

   /**
    * 解析窗口框架
    * ROWS|RANGE BETWEEN start AND end
    * ROWS|RANGE start
    * 
    * start/end 可以是:
    * - UNBOUNDED PRECEDING
    * - UNBOUNDED FOLLOWING  
    * - CURRENT ROW
    * - n PRECEDING
    * - n FOLLOWING
    */
   parseWindowFrame() {
     const frameType = this.current().value.toUpperCase(); // 'ROWS' or 'RANGE'
     this.advance();

     let start = null;
     let end = null;

     if (this.match(TokenType.BETWEEN)) {
       this.advance();
       start = this.parseFrameBound();
       this.expect(TokenType.AND);
       end = this.parseFrameBound();
     } else {
       start = this.parseFrameBound();
     }

     return AST.windowFrame({
       type: frameType,
       start,
       end
     });
   }

   /**
    * 解析框架边界
    * UNBOUNDED PRECEDING|FOLLOWING
    * CURRENT ROW
    * n PRECEDING|FOLLOWING
    * INTERVAL 'value' unit PRECEDING|FOLLOWING
    */
   parseFrameBound() {
     if (this.match(TokenType.UNBOUNDED)) {
       this.advance();
       const direction = this.matchAny(TokenType.PRECEDING, TokenType.FOLLOWING) 
         ? this.current().value.toUpperCase() 
         : 'PRECEDING';
       this.advance();
       return { type: 'UNBOUNDED', direction };
     }

     if (this.match(TokenType.CURRENT)) {
       this.advance();
       this.expect(TokenType.ROW);
       return { type: 'CURRENT_ROW' };
     }

     // INTERVAL 表达式
     if (this.match(TokenType.INTERVAL)) {
       this.advance();
       const intervalValue = this.parseExpression(); // 解析 '1' 或数字
       const unit = this.matchAny(TokenType.YEAR, TokenType.MONTH, TokenType.DAY, 
                                  TokenType.HOUR, TokenType.MINUTE, TokenType.SECOND)
         ? this.current().value.toUpperCase()
         : 'DAY';
       this.advance();
       
       const direction = this.matchAny(TokenType.PRECEDING, TokenType.FOLLOWING)
         ? this.current().value.toUpperCase()
         : 'PRECEDING';
       this.advance();
       
       return { 
         type: 'INTERVAL', 
         value: intervalValue, 
         unit, 
         direction 
       };
     }

     // 数字 + PRECEDING/FOLLOWING
     const value = this.parseExpression();
     const direction = this.matchAny(TokenType.PRECEDING, TokenType.FOLLOWING)
       ? this.current().value.toUpperCase()
       : 'PRECEDING';
     this.advance();
     
     return { type: 'OFFSET', value, direction };
   }
 }
