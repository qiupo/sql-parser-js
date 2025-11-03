/**
 * Abstract Syntax Tree (AST) Node Definitions
 * 
 * Defines all AST node types for representing parsed SQL statements
 */

/**
 * Base AST Node class
 */
export class ASTNode {
    /**
     * Create a new AST node
     * @param {string} type - Node type
     * @param {Object} properties - Node properties
     */
    constructor(type, properties = {}) {
        this.type = type;
        Object.assign(this, properties);
    }

    /**
     * Convert node to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return { ...this };
    }

    /**
     * Accept a visitor for traversal
     * @param {Object} visitor - Visitor object with visit methods
     */
    accept(visitor) {
        const methodName = `visit${this.type}`;
        if (visitor[methodName]) {
            return visitor[methodName](this);
        }
        return visitor.visitDefault ? visitor.visitDefault(this) : null;
    }
}

/**
 * SQL Statement nodes
 */
export class SelectStatement extends ASTNode {
    constructor(properties = {}) {
        super('SelectStatement', {
            columns: [],
            from: null,
            where: null,
            groupBy: null,
            having: null,
            orderBy: null,
            limit: null,
            offset: null,
            distinct: false,
            ...properties
        });
    }
}

export class InsertStatement extends ASTNode {
    constructor(properties = {}) {
        super('InsertStatement', {
            table: null,
            columns: [],
            values: [],
            ...properties
        });
    }
}

export class UpdateStatement extends ASTNode {
    constructor(properties = {}) {
        super('UpdateStatement', {
            table: null,
            set: [],
            where: null,
            ...properties
        });
    }
}

export class DeleteStatement extends ASTNode {
    constructor(properties = {}) {
        super('DeleteStatement', {
            from: null,
            where: null,
            ...properties
        });
    }
}

/**
 * UNION Statement node
 */
export class UnionStatement extends ASTNode {
    constructor(properties = {}) {
        super('UnionStatement', {
            left: null,      // Left SELECT statement
            right: null,     // Right SELECT statement
            unionType: 'UNION', // 'UNION' or 'UNION ALL'
            all: false,      // true for UNION ALL
            orderBy: null,
            limit: null,
            offset: null,
            ...properties
        });
    }
}

/**
 * WITH (CTE) Statement node
 */
export class WithClause extends ASTNode {
    constructor(properties = {}) {
        super('WithClause', {
            recursive: false,
            expressions: [],  // Array of CTE expressions
            ...properties
        });
    }
}

/**
 * Common Table Expression node
 */
export class CTEExpression extends ASTNode {
    constructor(name, columns, query) {
        super('CTEExpression', {
            name,           // CTE name
            columns,        // Optional column list
            query           // SELECT statement
        });
    }
}

/**
 * Window Function node
 */
export class WindowFunction extends ASTNode {
    constructor(properties = {}) {
        super('WindowFunction', {
            function: null,     // Function call (ROW_NUMBER, RANK, etc.)
            over: null,         // OVER clause
            ...properties
        });
    }
}

/**
 * OVER clause for window functions
 */
export class OverClause extends ASTNode {
    constructor(properties = {}) {
        super('OverClause', {
            partitionBy: null,  // PARTITION BY columns
            orderBy: null,      // ORDER BY columns
            frame: null,        // Window frame (ROWS/RANGE)
            ...properties
        });
    }
}

/**
 * Window Frame node
 */
export class WindowFrame extends ASTNode {
    constructor(properties = {}) {
        super('WindowFrame', {
            type: 'ROWS',       // 'ROWS' or 'RANGE'
            start: null,        // Frame start
            end: null,          // Frame end
            ...properties
        });
    }
}

/**
 * Expression nodes
 */
export class BinaryExpression extends ASTNode {
    constructor(left, operator, right) {
        super('BinaryExpression', {
            left,
            operator,
            right
        });
    }
}

export class UnaryExpression extends ASTNode {
    constructor(operator, operand) {
        super('UnaryExpression', {
            operator,
            operand
        });
    }
}

export class FunctionCall extends ASTNode {
    constructor(name, args = []) {
        super('FunctionCall', {
            name,
            arguments: args
        });
    }
}

export class CaseExpression extends ASTNode {
    constructor(properties = {}) {
        super('CaseExpression', {
            expression: null,
            whenClauses: [],
            elseClause: null,
            ...properties
        });
    }
}

export class WhenClause extends ASTNode {
    constructor(condition, result) {
        super('WhenClause', {
            condition,
            result
        });
    }
}

/**
 * Identifier and Literal nodes
 */
export class Identifier extends ASTNode {
    constructor(name, table = null) {
        super('Identifier', {
            name,
            table
        });
    }
}

export class TableReference extends ASTNode {
    constructor(name, alias = null, schema = null) {
        super('TableReference', {
            name,
            alias,
            schema
        });
    }
}

export class ColumnReference extends ASTNode {
    constructor(name, table = null, alias = null) {
        super('ColumnReference', { name, table, alias });
    }
}

export class Wildcard extends ASTNode {
    constructor() {
        super('Wildcard', {
            name: '*'
        });
    }
}

export class Literal extends ASTNode {
    constructor(value, dataType = 'unknown') {
        super('Literal', {
            value,
            dataType
        });
    }
}

/**
 * Clause nodes
 */
export class FromClause extends ASTNode {
    constructor(tables = [], joins = []) {
        super('FromClause', {
            tables,
            joins
        });
    }
}

export class WhereClause extends ASTNode {
    constructor(condition) {
        super('WhereClause', {
            condition
        });
    }
}

export class JoinClause extends ASTNode {
    constructor(type, table, condition) {
        super('JoinClause', {
            joinType: type,
            table,
            condition
        });
    }
}

export class GroupByClause extends ASTNode {
    constructor(columns = []) {
        super('GroupByClause', {
            columns
        });
    }
}

export class HavingClause extends ASTNode {
    constructor(condition) {
        super('HavingClause', {
            condition
        });
    }
}

export class OrderByClause extends ASTNode {
    constructor(columns = []) {
        super('OrderByClause', {
            columns
        });
    }
}

export class OrderByColumn extends ASTNode {
    constructor(column, direction = 'ASC') {
        super('OrderByColumn', {
            column,
            direction
        });
    }
}

export class LimitClause extends ASTNode {
    constructor(count, offset = null) {
        super('LimitClause', {
            count,
            offset
        });
    }
}

/**
 * Assignment and Value nodes
 */
export class Assignment extends ASTNode {
    constructor(column, value) {
        super('Assignment', {
            column,
            value
        });
    }
}

export class ValuesList extends ASTNode {
    constructor(values = []) {
        super('ValuesList', {
            values
        });
    }
}

export class BetweenRange extends ASTNode {
    constructor(start, end) {
        super('BetweenRange', {
            start,
            end
        });
    }
}

/**
 * Interval node - represents an INTERVAL expression
 */
export class Interval extends ASTNode {
    constructor(value, unit) {
        super('Interval', {
            value,  // The interval value (e.g., '1', 5)
            unit    // The time unit (e.g., 'YEAR', 'MONTH', 'DAY')
        });
    }
}

/**
 * SubQuery node - represents a subquery in SQL
 */
export class SubQuery extends ASTNode {
    constructor(query, alias = null) {
        super('SubQuery', {
            query,  // The SELECT statement
            alias   // Optional alias for the subquery
        });
    }
}

/**
 * Utility functions for creating AST nodes
 */
export const AST = {
    // Statements
    select: (props) => new SelectStatement(props),
    insert: (props) => new InsertStatement(props),
    update: (props) => new UpdateStatement(props),
    delete: (props) => new DeleteStatement(props),
    union: (props) => new UnionStatement(props),

    // CTE and Window Functions
    with: (props) => new WithClause(props),
    cte: (name, columns, query) => new CTEExpression(name, columns, query),
    windowFunction: (props) => new WindowFunction(props),
    over: (props) => new OverClause(props),
    windowFrame: (props) => new WindowFrame(props),

    // Expressions
    binary: (left, op, right) => new BinaryExpression(left, op, right),
    unary: (op, operand) => new UnaryExpression(op, operand),
    function: (name, args) => new FunctionCall(name, args),
    case: (props) => new CaseExpression(props),
    when: (condition, result) => new WhenClause(condition, result),

    // Identifiers and References
    identifier: (name, table) => new Identifier(name, table),
    table: (name, alias, schema) => new TableReference(name, alias, schema),
    column: (name, table, alias) => new ColumnReference(name, table, alias),
    wildcard: () => new Wildcard(),
    literal: (value, type) => new Literal(value, type),

    // Clauses
    from: (tables, joins = []) => new FromClause(tables, joins),
    where: (condition) => new WhereClause(condition),
    join: (type, table, condition) => new JoinClause(type, table, condition),
    groupBy: (columns) => new GroupByClause(columns),
    having: (condition) => new HavingClause(condition),
    orderBy: (columns) => new OrderByClause(columns),
    orderByColumn: (column, direction) => new OrderByColumn(column, direction),
    limit: (count, offset) => new LimitClause(count, offset),

    // Other
    assignment: (column, value) => new Assignment(column, value),
    valuesList: (values) => new ValuesList(values),
    betweenRange: (start, end) => new BetweenRange(start, end),
    interval: (value, unit) => new Interval(value, unit),
    subquery: (query, alias) => new SubQuery(query, alias)
};