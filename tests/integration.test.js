/**
 * Integration Tests
 * 
 * End-to-end tests for the complete SQL parser system,
 * testing the integration between lexer, parser, and API
 */

import { parseSQL, validateSQL, extractTables, extractColumns } from '../src/index.js';
import { Lexer } from '../src/lexer/lexer.js';
import { Parser } from '../src/parser/parser.js';

describe('Integration Tests', () => {
    describe('Complete Parsing Pipeline', () => {
        test('should handle complete SELECT parsing pipeline', () => {
            const sql = `
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    COUNT(o.id) as order_count
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                WHERE u.active = true
                GROUP BY u.id, u.name, u.email
                ORDER BY order_count DESC
                LIMIT 10
            `;
            
            // Test lexer output
            const lexer = new Lexer(sql);
            const tokens = lexer.tokenize();
            expect(tokens.length).toBeGreaterThan(0);
            expect(tokens[0].type).toBe('SELECT');
            expect(tokens[0].value.toLowerCase()).toBe('select');
            
            // Test parser output
            const parser = new Parser(tokens);
            const ast = parser.parse();
            expect(ast.type).toBe('SelectStatement');
            
            // Test complete API
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast).toEqual(ast);
        });

        test('should handle INSERT parsing pipeline', () => {
            const sql = "INSERT INTO users (name, email, active) VALUES ('John Doe', 'john@example.com', true)";
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('InsertStatement');
            expect(result.ast.table.name).toBe('users');
            expect(result.ast.columns).toEqual(['name', 'email', 'active']);
        });

        test('should handle UPDATE parsing pipeline', () => {
            const sql = "UPDATE users SET name = 'Jane Doe', email = 'jane@example.com' WHERE id = 1 AND active = true";
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('UpdateStatement');
            expect(result.ast.set).toHaveLength(2);
        });

        test('should handle DELETE parsing pipeline', () => {
            const sql = 'DELETE FROM users WHERE created_at < \'2023-01-01\' AND active = false';
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('DeleteStatement');
            expect(result.ast.where).toBeDefined();
        });
    });

    describe('API Integration', () => {
        test('parseSQL should return consistent results', () => {
            const sql = 'SELECT name, email FROM users WHERE active = true';
            
            const result1 = parseSQL(sql);
            const result2 = parseSQL(sql);
            
            expect(result1.success).toBe(result2.success);
            expect(result1.ast).toEqual(result2.ast);
        });

        test('validateSQL should work with parseSQL results', () => {
            const validSql = 'SELECT * FROM users';
            const invalidSql = 'SELECT FROM users';
            
            const parseResult1 = parseSQL(validSql);
            const validateResult1 = validateSQL(validSql);
            expect(parseResult1.success).toBe(validateResult1.valid);
            
            const parseResult2 = parseSQL(invalidSql);
            const validateResult2 = validateSQL(invalidSql);
            expect(parseResult2.success).toBe(validateResult2.valid);
        });

        test('extractTables should work with complex queries', () => {
            const sql = `
                SELECT u.name, o.total, p.title
                FROM users u
                JOIN orders o ON u.id = o.user_id
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                WHERE u.active = true
            `;
            
            const tables = extractTables(sql);
            expect(tables).toContain('users');
            expect(tables).toContain('orders');
            expect(tables).toContain('order_items');
            expect(tables).toContain('products');
            expect(tables).toHaveLength(4);
        });

        test('extractColumns should work with complex queries', () => {
            const sql = `
                SELECT 
                    u.name,
                    u.email,
                    o.total,
                    p.title
                FROM users u
                JOIN orders o ON u.id = o.user_id
                JOIN products p ON o.product_id = p.id
                WHERE u.active = true AND o.status = 'completed'
                ORDER BY o.created_at DESC
            `;
            
            const columns = extractColumns(sql);
            expect(columns).toContain('name');
            expect(columns).toContain('email');
            expect(columns).toContain('total');
            expect(columns).toContain('title');
            expect(columns).toContain('id');
            expect(columns).toContain('user_id');
            expect(columns).toContain('product_id');
            expect(columns).toContain('active');
            expect(columns).toContain('status');
            expect(columns).toContain('created_at');
        });
    });

    describe('Error Handling Integration', () => {
        test('should provide consistent error information across components', () => {
            const invalidSql = 'SELECT * FROM WHERE id = 1';
            
            const parseResult = parseSQL(invalidSql);
            const validateResult = validateSQL(invalidSql);
            
            expect(parseResult.success).toBe(false);
            expect(validateResult.valid).toBe(false);
            expect(parseResult.errors).toHaveLength(validateResult.errors.length);
        });

        test('should handle lexer errors gracefully', () => {
            const sqlWithInvalidChar = "SELECT * FROM users WHERE name = 'unterminated string";
            
            const result = parseSQL(sqlWithInvalidChar);
            expect(result.success).toBe(false);
            expect(result.errors[0].code).toBe('UNTERMINATED_STRING');
        });

        test('should handle parser errors gracefully', () => {
            const sqlWithSyntaxError = 'SELECT * FROM users WHERE AND active = true';
            
            const result = parseSQL(sqlWithSyntaxError);
            expect(result.success).toBe(false);
            expect(result.errors[0].code).toBe('UNEXPECTED_TOKEN');
        });

        test('should provide helpful error messages', () => {
            const testCases = [
                {
                    sql: 'SELECT FROM users',
                    expectedError: 'UNEXPECTED_TOKEN'
                },
                {
                    sql: 'INSERT INTO',
                    expectedError: 'UNEXPECTED_END'
                },
                {
                    sql: 'UPDATE SET name = "John"',
                    expectedError: 'UNEXPECTED_TOKEN'
                }
            ];
            
            testCases.forEach(({ sql, expectedError }) => {
                const result = parseSQL(sql);
                expect(result.success).toBe(false);
                expect(result.errors[0].code).toBe(expectedError);
                expect(result.errors[0].message).toBeDefined();
                expect(result.errors[0].line).toBeDefined();
                expect(result.errors[0].column).toBeDefined();
            });
        });
    });

    describe('Real-world SQL Examples', () => {
        test('should handle typical e-commerce queries', () => {
            const queries = [
                // Product catalog
                'SELECT * FROM products WHERE category_id = 1 AND price BETWEEN 10 AND 100 ORDER BY price ASC',
                
                // User orders
                `SELECT 
                    u.name,
                    COUNT(o.id) as order_count,
                    SUM(o.total) as total_spent
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id
                GROUP BY u.id, u.name
                HAVING total_spent > 500`,
                
                // Inventory management
                'UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 123',
                
                // Customer registration
                "INSERT INTO users (name, email, password_hash, created_at) VALUES ('John Doe', 'john@example.com', 'hash123', NOW())"
            ];
            
            queries.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(true);
            });
        });

        test('should handle typical CRM queries', () => {
            const queries = [
                // Lead tracking
                `SELECT 
                    l.id,
                    l.company_name,
                    l.contact_email,
                    l.status,
                    u.name as assigned_to
                FROM leads l
                LEFT JOIN users u ON l.assigned_user_id = u.id
                WHERE l.status IN ('new', 'contacted', 'qualified')
                ORDER BY l.created_at DESC`,
                
                // Sales pipeline
                `SELECT 
                    stage,
                    COUNT(*) as deal_count,
                    SUM(value) as total_value
                FROM deals
                WHERE created_at >= '2023-01-01'
                GROUP BY stage
                ORDER BY total_value DESC`,
                
                // Contact updates
                "UPDATE contacts SET last_contacted = NOW(), notes = 'Follow-up call completed' WHERE id = 456"
            ];
            
            queries.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(true);
            });
        });

        test('should handle analytics queries', () => {
            const queries = [
                // Daily active users
                `SELECT 
                    DATE(login_time) as date,
                    COUNT(DISTINCT user_id) as daily_active_users
                FROM user_sessions
                WHERE login_time >= '2023-01-01'
                GROUP BY DATE(login_time)
                ORDER BY date DESC`,
                
                // Revenue analysis
                `SELECT 
                    YEAR(order_date) as year,
                    MONTH(order_date) as month,
                    SUM(total) as monthly_revenue,
                    COUNT(*) as order_count,
                    AVG(total) as avg_order_value
                FROM orders
                WHERE status = 'completed'
                GROUP BY YEAR(order_date), MONTH(order_date)
                ORDER BY year DESC, month DESC`,
                
                // User behavior
                `SELECT 
                    u.id,
                    u.email,
                    COUNT(DISTINCT s.id) as session_count,
                    SUM(s.duration) as total_time,
                    MAX(s.created_at) as last_session
                FROM users u
                JOIN sessions s ON u.id = s.user_id
                WHERE s.created_at >= '2023-01-01'
                GROUP BY u.id, u.email
                HAVING session_count > 10
                ORDER BY total_time DESC
                LIMIT 100`
            ];
            
            queries.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('Edge Cases and Compatibility', () => {
        test('should handle various SQL formatting styles', () => {
            const variations = [
                // All uppercase
                'SELECT * FROM USERS WHERE ACTIVE = TRUE',
                
                // All lowercase
                'select * from users where active = true',
                
                // Mixed case
                'Select * From Users Where Active = True',
                
                // Compact formatting
                'SELECT*FROM users WHERE active=true',
                
                // Verbose formatting with extra spaces
                'SELECT   *   FROM   users   WHERE   active   =   true',
                
                // Multi-line formatting
                `SELECT *
                FROM users
                WHERE active = true`
            ];
            
            variations.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(true);
                expect(result.ast.type).toBe('SelectStatement');
            });
        });

        test('should handle comments in various positions', () => {
            const sqlWithComments = `
                -- This is a user query
                SELECT 
                    u.name, /* user name */
                    u.email -- user email
                FROM users u /* users table */
                WHERE u.active = true -- only active users
                /* End of query */
            `;
            
            const result = parseSQL(sqlWithComments);
            expect(result.success).toBe(true);
        });

        test('should handle quoted identifiers', () => {
            const sql = 'SELECT "user name", `email address` FROM "user table" WHERE "is active" = true';
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
        });

        test('should handle various literal formats', () => {
            const sql = `
                SELECT 
                    'string literal',
                    "double quoted string",
                    123,
                    45.67,
                    1.23e10,
                    true,
                    false,
                    NULL
                FROM dual
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.columns).toHaveLength(8);
        });
    });

    describe('Performance Integration', () => {
        test('should maintain performance across multiple parsing operations', () => {
            const queries = [
                'SELECT * FROM users',
                'SELECT name, email FROM users WHERE active = true',
                'SELECT COUNT(*) FROM orders WHERE created_at > \'2023-01-01\'',
                'UPDATE users SET last_login = NOW() WHERE id = 1',
                'INSERT INTO logs (message, level) VALUES (\'Test\', \'INFO\')'
            ];
            
            const start = performance.now();
            
            queries.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(true);
            });
            
            const end = performance.now();
            const totalTime = end - start;
            
            expect(totalTime).toBeLessThan(50); // All queries should complete quickly
        });
    });
});