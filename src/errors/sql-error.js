/**
 * SQL Error Class
 * 
 * Provides detailed error information for SQL parsing failures
 * Includes error codes, messages, and position information
 */

export class SQLError extends Error {
    /**
     * Create a new SQL error
     * @param {string} message - Error message
     * @param {string} code - Error code
     * @param {number} line - Line number where error occurred
     * @param {number} column - Column number where error occurred
     * @param {Object} context - Additional context information
     */
    constructor(message, code = 'SYNTAX_ERROR', line = 0, column = 0, context = {}) {
        super(message);
        this.name = 'SQLError';
        this.code = code;
        this.line = line;
        this.column = column;
        this.context = context;
        
        // Maintain proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SQLError);
        }
    }

    /**
     * Convert error to JSON format
     * @returns {Object} JSON representation of the error
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            line: this.line,
            column: this.column,
            context: this.context
        };
    }

    /**
     * Get formatted error message with position
     * @returns {string} Formatted error message
     */
    getFormattedMessage() {
        if (this.line > 0 && this.column > 0) {
            return `${this.message} at line ${this.line}, column ${this.column}`;
        }
        return this.message;
    }

    /**
     * Create a syntax error
     * @param {string} message - Error message
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @param {Object} context - Additional context
     * @returns {SQLError} New syntax error
     */
    static syntaxError(message, line, column, context = {}) {
        return new SQLError(message, 'SYNTAX_ERROR', line, column, context);
    }

    /**
     * Create a lexical error
     * @param {string} message - Error message
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @param {Object} context - Additional context
     * @returns {SQLError} New lexical error
     */
    static lexicalError(message, line, column, context = {}) {
        return new SQLError(message, 'LEXICAL_ERROR', line, column, context);
    }

    /**
     * Create an unterminated string error
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @returns {SQLError} New unterminated string error
     */
    static unterminatedString(line, column) {
        return new SQLError('Unterminated string literal', 'UNTERMINATED_STRING', line, column);
    }

    /**
     * Create an unexpected token error
     * @param {string} expected - Expected token
     * @param {string} actual - Actual token
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @returns {SQLError} New unexpected token error
     */
    static unexpectedToken(expected, actual, line, column) {
        const message = `Expected ${expected}, but got ${actual}`;
        return new SQLError(message, 'UNEXPECTED_TOKEN', line, column, {
            expected,
            actual
        });
    }

    /**
     * Create an unexpected end of input error
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @returns {SQLError} New unexpected end error
     */
    static unexpectedEnd(line, column) {
        return new SQLError(
            'Unexpected end of input',
            'UNEXPECTED_END',
            line,
            column
        );
    }

    /**
     * Create an invalid identifier error
     * @param {string} identifier - Invalid identifier
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @returns {SQLError} New invalid identifier error
     */
    static invalidIdentifier(identifier, line, column) {
        return new SQLError(
            `Invalid identifier: ${identifier}`,
            'INVALID_IDENTIFIER',
            line,
            column,
            { identifier }
        );
    }

    /**
     * Create an unsupported feature error
     * @param {string} feature - Unsupported feature
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @returns {SQLError} New unsupported feature error
     */
    static unsupportedFeature(feature, line, column) {
        return new SQLError(
            `Unsupported feature: ${feature}`,
            'UNSUPPORTED_FEATURE',
            line,
            column,
            { feature }
        );
    }
}