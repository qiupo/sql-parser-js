/**
 * Token Types for SQL Lexer
 * 
 * Defines all possible token types that can be recognized by the lexer
 */

export const TokenType = {
    // Literals
    IDENTIFIER: 'IDENTIFIER',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    NULL: 'NULL',

    // Keywords - DDL
    CREATE: 'CREATE',
    DROP: 'DROP',
    ALTER: 'ALTER',
    TABLE: 'TABLE',
    INDEX: 'INDEX',
    VIEW: 'VIEW',
    DATABASE: 'DATABASE',
    SCHEMA: 'SCHEMA',

    // Keywords - DML
    SELECT: 'SELECT',
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    FROM: 'FROM',
    WHERE: 'WHERE',
    INTO: 'INTO',
    VALUES: 'VALUES',
    SET: 'SET',

    // Keywords - Query clauses
    JOIN: 'JOIN',
    INNER: 'INNER',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    FULL: 'FULL',
    OUTER: 'OUTER',
    CROSS: 'CROSS',
    ON: 'ON',
    USING: 'USING',
    GROUP: 'GROUP',
    BY: 'BY',
    HAVING: 'HAVING',
    ORDER: 'ORDER',
    ASC: 'ASC',
    DESC: 'DESC',
    LIMIT: 'LIMIT',
    OFFSET: 'OFFSET',
    UNION: 'UNION',
    INTERSECT: 'INTERSECT',
    EXCEPT: 'EXCEPT',
    ALL: 'ALL',
    ANY: 'ANY',
    DISTINCT: 'DISTINCT',

    // Keywords - CTE and Window Functions
    WITH: 'WITH',
    RECURSIVE: 'RECURSIVE',
    OVER: 'OVER',
    PARTITION: 'PARTITION',
    WINDOW: 'WINDOW',
    ROWS: 'ROWS',
    RANGE: 'RANGE',
    UNBOUNDED: 'UNBOUNDED',
    PRECEDING: 'PRECEDING',
    FOLLOWING: 'FOLLOWING',
    CURRENT: 'CURRENT',
    ROW: 'ROW',

    // Keywords - Window Functions
    ROW_NUMBER: 'ROW_NUMBER',
    RANK: 'RANK',
    DENSE_RANK: 'DENSE_RANK',
    LEAD: 'LEAD',
    LAG: 'LAG',
    FIRST_VALUE: 'FIRST_VALUE',
    LAST_VALUE: 'LAST_VALUE',
    NTH_VALUE: 'NTH_VALUE',

    // Keywords - Data types
    INT: 'INT',
    INTEGER: 'INTEGER',
    VARCHAR: 'VARCHAR',
    CHAR: 'CHAR',
    TEXT: 'TEXT',
    DECIMAL: 'DECIMAL',
    FLOAT: 'FLOAT',
    DOUBLE: 'DOUBLE',
    DATE: 'DATE',
    TIME: 'TIME',
    TIMESTAMP: 'TIMESTAMP',
    BOOLEAN_TYPE: 'BOOLEAN_TYPE',
    INTERVAL: 'INTERVAL',
    YEAR: 'YEAR',
    MONTH: 'MONTH',
    DAY: 'DAY',
    HOUR: 'HOUR',
    MINUTE: 'MINUTE',
    SECOND: 'SECOND',

    // Keywords - Constraints
    PRIMARY: 'PRIMARY',
    FOREIGN: 'FOREIGN',
    KEY: 'KEY',
    UNIQUE: 'UNIQUE',
    NOT: 'NOT',
    CONSTRAINT: 'CONSTRAINT',
    CHECK: 'CHECK',
    DEFAULT: 'DEFAULT',
    AUTO_INCREMENT: 'AUTO_INCREMENT',

    // Keywords - Logical operators
    AND: 'AND',
    OR: 'OR',
    IN: 'IN',
    EXISTS: 'EXISTS',
    BETWEEN: 'BETWEEN',
    LIKE: 'LIKE',
    ILIKE: 'ILIKE',
    IS: 'IS',
    AS: 'AS',

    // Keywords - Functions
    COUNT: 'COUNT',
    SUM: 'SUM',
    AVG: 'AVG',
    MIN: 'MIN',
    MAX: 'MAX',
    CASE: 'CASE',
    WHEN: 'WHEN',
    THEN: 'THEN',
    ELSE: 'ELSE',
    END: 'END',

    // Operators
    EQUALS: 'EQUALS',                    // =
    NOT_EQUALS: 'NOT_EQUALS',            // != or <>
    LESS_THAN: 'LESS_THAN',              // <
    LESS_THAN_EQUALS: 'LESS_THAN_EQUALS', // <=
    GREATER_THAN: 'GREATER_THAN',        // >
    GREATER_THAN_EQUALS: 'GREATER_THAN_EQUALS', // >=
    PLUS: 'PLUS',                        // +
    MINUS: 'MINUS',                      // -
    MULTIPLY: 'MULTIPLY',                // *
    DIVIDE: 'DIVIDE',                    // /
    MODULO: 'MODULO',                    // %
    CONCAT: 'CONCAT',                    // ||

    // Punctuation
    SEMICOLON: 'SEMICOLON',              // ;
    COMMA: 'COMMA',                      // ,
    DOT: 'DOT',                          // .
    LEFT_PAREN: 'LEFT_PAREN',            // (
    RIGHT_PAREN: 'RIGHT_PAREN',          // )
    LEFT_BRACKET: 'LEFT_BRACKET',        // [
    RIGHT_BRACKET: 'RIGHT_BRACKET',      // ]

    // Special
    WHITESPACE: 'WHITESPACE',
    COMMENT: 'COMMENT',
    NEWLINE: 'NEWLINE',
    EOF: 'EOF',
    UNKNOWN: 'UNKNOWN'
};

/**
 * SQL Keywords mapping
 */
export const KEYWORDS = {
    // DDL Keywords
    'CREATE': TokenType.CREATE,
    'DROP': TokenType.DROP,
    'ALTER': TokenType.ALTER,
    'TABLE': TokenType.TABLE,
    'INDEX': TokenType.INDEX,
    'VIEW': TokenType.VIEW,
    'DATABASE': TokenType.DATABASE,
    'SCHEMA': TokenType.SCHEMA,

    // DML Keywords
    'SELECT': TokenType.SELECT,
    'INSERT': TokenType.INSERT,
    'UPDATE': TokenType.UPDATE,
    'DELETE': TokenType.DELETE,
    'FROM': TokenType.FROM,
    'WHERE': TokenType.WHERE,
    'INTO': TokenType.INTO,
    'VALUES': TokenType.VALUES,
    'SET': TokenType.SET,

    // Query clauses
    'JOIN': TokenType.JOIN,
    'INNER': TokenType.INNER,
    'LEFT': TokenType.LEFT,
    'RIGHT': TokenType.RIGHT,
    'FULL': TokenType.FULL,
    'OUTER': TokenType.OUTER,
    'CROSS': TokenType.CROSS,
    'ON': TokenType.ON,
    'USING': TokenType.USING,
    'GROUP': TokenType.GROUP,
    'BY': TokenType.BY,
    'HAVING': TokenType.HAVING,
    'ORDER': TokenType.ORDER,
    'ASC': TokenType.ASC,
    'DESC': TokenType.DESC,
    'LIMIT': TokenType.LIMIT,
    'OFFSET': TokenType.OFFSET,
    'UNION': TokenType.UNION,
    'INTERSECT': TokenType.INTERSECT,
    'EXCEPT': TokenType.EXCEPT,
    'ALL': TokenType.ALL,
    'ANY': TokenType.ANY,
    'DISTINCT': TokenType.DISTINCT,

    // CTE and Window Functions
    'WITH': TokenType.WITH,
    'RECURSIVE': TokenType.RECURSIVE,
    'OVER': TokenType.OVER,
    'PARTITION': TokenType.PARTITION,
    'WINDOW': TokenType.WINDOW,
    'ROWS': TokenType.ROWS,
    'RANGE': TokenType.RANGE,
    'UNBOUNDED': TokenType.UNBOUNDED,
    'PRECEDING': TokenType.PRECEDING,
    'FOLLOWING': TokenType.FOLLOWING,
    'CURRENT': TokenType.CURRENT,
    'ROW': TokenType.ROW,

    // Window Functions
    'ROW_NUMBER': TokenType.ROW_NUMBER,
    'RANK': TokenType.RANK,
    'DENSE_RANK': TokenType.DENSE_RANK,
    'LEAD': TokenType.LEAD,
    'LAG': TokenType.LAG,
    'FIRST_VALUE': TokenType.FIRST_VALUE,
    'LAST_VALUE': TokenType.LAST_VALUE,
    'NTH_VALUE': TokenType.NTH_VALUE,

    // Data types
    'INT': TokenType.INT,
    'INTEGER': TokenType.INTEGER,
    'VARCHAR': TokenType.VARCHAR,
    'CHAR': TokenType.CHAR,
    'TEXT': TokenType.TEXT,
    'DECIMAL': TokenType.DECIMAL,
    'FLOAT': TokenType.FLOAT,
    'DOUBLE': TokenType.DOUBLE,
    'DATE': TokenType.DATE,
    'TIME': TokenType.TIME,
    'TIMESTAMP': TokenType.TIMESTAMP,
    'BOOLEAN': TokenType.BOOLEAN_TYPE,
    'INTERVAL': TokenType.INTERVAL,
    'YEAR': TokenType.YEAR,
    'MONTH': TokenType.MONTH,
    'DAY': TokenType.DAY,
    'HOUR': TokenType.HOUR,
    'MINUTE': TokenType.MINUTE,
    'SECOND': TokenType.SECOND,

    // Constraints
    'PRIMARY': TokenType.PRIMARY,
    'FOREIGN': TokenType.FOREIGN,
    'KEY': TokenType.KEY,
    'UNIQUE': TokenType.UNIQUE,
    'NOT': TokenType.NOT,
    'CONSTRAINT': TokenType.CONSTRAINT,
    'CHECK': TokenType.CHECK,
    'DEFAULT': TokenType.DEFAULT,
    'AUTO_INCREMENT': TokenType.AUTO_INCREMENT,

    // Logical operators
    'AND': TokenType.AND,
    'OR': TokenType.OR,
    'IN': TokenType.IN,
    'EXISTS': TokenType.EXISTS,
    'BETWEEN': TokenType.BETWEEN,
    'LIKE': TokenType.LIKE,
    'ILIKE': TokenType.ILIKE,
    'IS': TokenType.IS,
    'AS': TokenType.AS,

    // Functions
    'COUNT': TokenType.COUNT,
    'SUM': TokenType.SUM,
    'AVG': TokenType.AVG,
    'MIN': TokenType.MIN,
    'MAX': TokenType.MAX,
    'CASE': TokenType.CASE,
    'WHEN': TokenType.WHEN,
    'THEN': TokenType.THEN,
    'ELSE': TokenType.ELSE,
    'END': TokenType.END,

    // Literals
    'TRUE': TokenType.BOOLEAN,
    'FALSE': TokenType.BOOLEAN,
    'NULL': TokenType.NULL
};

/**
 * Token class representing a single lexical unit
 */
export class Token {
    /**
     * Create a new token
     * @param {string} type - Token type from TokenType enum
     * @param {string} value - Token value/text
     * @param {number} line - Line number (1-based)
     * @param {number} column - Column number (1-based)
     * @param {number} start - Start position in source
     * @param {number} end - End position in source
     */
    constructor(type, value, line = 1, column = 1, start = 0, end = 0) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
        this.start = start;
        this.end = end;
    }

    /**
     * Check if token is of given type
     * @param {string} type - Token type to check
     * @returns {boolean} True if token matches type
     */
    is(type) {
        return this.type === type;
    }

    /**
     * Check if token is one of given types
     * @param {...string} types - Token types to check
     * @returns {boolean} True if token matches any type
     */
    isOneOf(...types) {
        return types.includes(this.type);
    }

    /**
     * Check if token is a keyword
     * @returns {boolean} True if token is a keyword
     */
    isKeyword() {
        return Object.values(KEYWORDS).includes(this.type);
    }

    /**
     * Check if token is an operator
     * @returns {boolean} True if token is an operator
     */
    isOperator() {
        return [
            TokenType.EQUALS, TokenType.NOT_EQUALS,
            TokenType.LESS_THAN, TokenType.LESS_THAN_EQUALS,
            TokenType.GREATER_THAN, TokenType.GREATER_THAN_EQUALS,
            TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY,
            TokenType.DIVIDE, TokenType.MODULO, TokenType.CONCAT
        ].includes(this.type);
    }

    /**
     * Check if token is a literal value
     * @returns {boolean} True if token is a literal
     */
    isLiteral() {
        return [
            TokenType.STRING, TokenType.NUMBER,
            TokenType.BOOLEAN, TokenType.NULL
        ].includes(this.type);
    }

    /**
     * Convert token to string representation
     * @returns {string} String representation
     */
    toString() {
        return `Token(${this.type}, "${this.value}", ${this.line}:${this.column})`;
    }

    /**
     * Convert token to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            type: this.type,
            value: this.value,
            line: this.line,
            column: this.column,
            start: this.start,
            end: this.end
        };
    }
}