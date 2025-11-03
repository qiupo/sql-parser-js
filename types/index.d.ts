/**
 * TypeScript Type Definitions for SQL Parser
 * 
 * Provides type definitions for the SQL parser library
 */

// Token Types
export type TokenType = 
    | 'KEYWORD'
    | 'IDENTIFIER'
    | 'STRING'
    | 'NUMBER'
    | 'BOOLEAN'
    | 'NULL'
    | 'OPERATOR'
    | 'PUNCTUATION'
    | 'COMMENT'
    | 'WHITESPACE'
    | 'EOF';

// Token Interface
export interface Token {
    type: TokenType;
    value: any;
    line: number;
    column: number;
    start: number;
    end: number;
    
    is(type: TokenType): boolean;
    toString(): string;
    toJSON(): object;
}

// AST Node Types
export type ASTNodeType = 
    | 'SelectStatement'
    | 'InsertStatement'
    | 'UpdateStatement'
    | 'DeleteStatement'
    | 'BinaryExpression'
    | 'UnaryExpression'
    | 'FunctionCall'
    | 'CaseExpression'
    | 'WhenClause'
    | 'Identifier'
    | 'Literal'
    | 'FromClause'
    | 'WhereClause'
    | 'JoinClause'
    | 'GroupByClause'
    | 'HavingClause'
    | 'OrderByClause'
    | 'LimitClause';

// Base AST Node
export interface ASTNode {
    type: ASTNodeType;
    [key: string]: any;
}

// Statement Nodes
export interface SelectStatement extends ASTNode {
    type: 'SelectStatement';
    distinct?: boolean;
    columns: (Identifier | FunctionCall | BinaryExpression | Literal)[];
    from?: FromClause;
    where?: WhereClause;
    groupBy?: GroupByClause;
    having?: HavingClause;
    orderBy?: OrderByClause;
    limit?: LimitClause;
}

export interface InsertStatement extends ASTNode {
    type: 'InsertStatement';
    table: Identifier;
    columns: string[];
    values: Literal[][];
}

export interface UpdateStatement extends ASTNode {
    type: 'UpdateStatement';
    table: Identifier;
    set: Array<{
        column: string;
        value: Literal | BinaryExpression;
    }>;
    where?: WhereClause;
}

export interface DeleteStatement extends ASTNode {
    type: 'DeleteStatement';
    from: Identifier;
    where?: WhereClause;
}

// Expression Nodes
export interface BinaryExpression extends ASTNode {
    type: 'BinaryExpression';
    operator: string;
    left: ASTNode;
    right: ASTNode;
}

export interface UnaryExpression extends ASTNode {
    type: 'UnaryExpression';
    operator: string;
    operand: ASTNode;
}

export interface FunctionCall extends ASTNode {
    type: 'FunctionCall';
    name: string;
    arguments: ASTNode[];
}

export interface CaseExpression extends ASTNode {
    type: 'CaseExpression';
    expression?: ASTNode;
    whenClauses: WhenClause[];
    elseClause?: ASTNode;
}

export interface WhenClause extends ASTNode {
    type: 'WhenClause';
    condition: ASTNode;
    result: ASTNode;
}

// Basic Nodes
export interface Identifier extends ASTNode {
    type: 'Identifier';
    name: string;
    table?: string;
    alias?: string;
}

export interface Literal extends ASTNode {
    type: 'Literal';
    value: any;
    dataType: 'string' | 'number' | 'boolean' | 'null';
}

// Clause Nodes
export interface FromClause extends ASTNode {
    type: 'FromClause';
    tables: (Identifier | JoinClause)[];
}

export interface WhereClause extends ASTNode {
    type: 'WhereClause';
    condition: BinaryExpression | UnaryExpression;
}

export interface JoinClause extends ASTNode {
    type: 'JoinClause';
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';
    table: Identifier;
    condition?: BinaryExpression;
}

export interface GroupByClause extends ASTNode {
    type: 'GroupByClause';
    columns: Identifier[];
}

export interface HavingClause extends ASTNode {
    type: 'HavingClause';
    condition: BinaryExpression | UnaryExpression;
}

export interface OrderByClause extends ASTNode {
    type: 'OrderByClause';
    columns: Array<{
        column: Identifier;
        direction: 'ASC' | 'DESC';
    }>;
}

export interface LimitClause extends ASTNode {
    type: 'LimitClause';
    count: Literal;
    offset?: Literal;
}

// Error Types
export interface SQLError extends Error {
    code: string;
    line: number;
    column: number;
    context?: string;
}

export interface SQLErrorConstructor {
    new(message: string, code: string, line: number, column: number, context?: string): SQLError;
    syntaxError(message: string, line: number, column: number, context?: string): SQLError;
    lexicalError(message: string, line: number, column: number, context?: string): SQLError;
    unexpectedToken(token: Token, expected?: string): SQLError;
    unsupportedFeature(feature: string, line: number, column: number): SQLError;
}

// Parse Result
export interface ParseResult {
    success: boolean;
    ast?: ASTNode;
    errors: SQLError[];
    tokens?: Token[];
}

// Validation Result
export interface ValidationResult {
    valid: boolean;
    errors: SQLError[];
}

// Lexer Options
export interface LexerOptions {
    includeComments?: boolean;
    includeWhitespace?: boolean;
    caseSensitive?: boolean;
}

// Parser Options
export interface ParserOptions {
    allowPartialParsing?: boolean;
    maxErrors?: number;
    dialect?: 'standard' | 'mysql' | 'postgresql' | 'sqlite';
}

// Main Classes
export declare class Lexer {
    constructor(input: string, options?: LexerOptions);
    tokenize(): Token[];
}

export declare class Parser {
    constructor(tokens: Token[], options?: ParserOptions);
    parse(): ASTNode;
}

export declare const SQLError: SQLErrorConstructor;

// Main API Functions
export declare function parseSQL(sql: string, options?: ParserOptions): ParseResult;
export declare function validateSQL(sql: string, options?: ParserOptions): ValidationResult;
export declare function extractTables(sql: string): string[];
export declare function extractColumns(sql: string): string[];

// Utility Functions
export declare function createSelectNode(options: Partial<SelectStatement>): SelectStatement;
export declare function createInsertNode(options: Partial<InsertStatement>): InsertStatement;
export declare function createUpdateNode(options: Partial<UpdateStatement>): UpdateStatement;
export declare function createDeleteNode(options: Partial<DeleteStatement>): DeleteStatement;
export declare function createBinaryExpression(operator: string, left: ASTNode, right: ASTNode): BinaryExpression;
export declare function createUnaryExpression(operator: string, operand: ASTNode): UnaryExpression;
export declare function createFunctionCall(name: string, args: ASTNode[]): FunctionCall;
export declare function createIdentifier(name: string, table?: string, alias?: string): Identifier;
export declare function createLiteral(value: any, dataType?: string): Literal;

// Constants
export declare const TokenType: {
    readonly KEYWORD: 'KEYWORD';
    readonly IDENTIFIER: 'IDENTIFIER';
    readonly STRING: 'STRING';
    readonly NUMBER: 'NUMBER';
    readonly BOOLEAN: 'BOOLEAN';
    readonly NULL: 'NULL';
    readonly OPERATOR: 'OPERATOR';
    readonly PUNCTUATION: 'PUNCTUATION';
    readonly COMMENT: 'COMMENT';
    readonly WHITESPACE: 'WHITESPACE';
    readonly EOF: 'EOF';
};

export declare const KEYWORDS: Record<string, string>;

// Default export
declare const SQLParser: {
    parseSQL: typeof parseSQL;
    validateSQL: typeof validateSQL;
    extractTables: typeof extractTables;
    extractColumns: typeof extractColumns;
    Lexer: typeof Lexer;
    Parser: typeof Parser;
    SQLError: typeof SQLError;
    TokenType: typeof TokenType;
    KEYWORDS: typeof KEYWORDS;
};

export default SQLParser;