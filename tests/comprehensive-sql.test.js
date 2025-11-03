/**
 * 全面的SQL解析器测试
 * 测试所有支持的SQL语法规则和关键字
 */

import { parseSQL, analyzeSQL, validateSQL, extractTables, extractColumns } from '../src/index.js';

describe('SQL Parser - 全面语法规则测试', () => {
    
    describe('基本SELECT语句测试', () => {
        /**
         * 测试基本的SELECT语句解析
         */
        test('应该正确解析基本SELECT语句', () => {
            const sql = 'SELECT id, name FROM users';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('SelectStatement');
            expect(result.tables).toContain('users');
            expect(result.columns).toContain('id');
            expect(result.columns).toContain('name');
        });

        /**
         * 测试SELECT DISTINCT
         */
        test('应该正确解析SELECT DISTINCT', () => {
            const sql = 'SELECT DISTINCT department FROM employees';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.distinct).toBe(true);
        });

        /**
         * 测试SELECT *
         */
        test('应该正确解析SELECT *', () => {
            const sql = 'SELECT * FROM products';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.columns).toHaveLength(1);
            expect(result.ast.columns[0].type).toBe('Wildcard');
        });
    });

    describe('WHERE子句测试', () => {
        /**
         * 测试各种比较操作符
         */
        test('应该正确解析比较操作符', () => {
            const testCases = [
                'SELECT * FROM users WHERE age = 25',
                'SELECT * FROM users WHERE age != 25',
                'SELECT * FROM users WHERE age <> 25',
                'SELECT * FROM users WHERE age > 25',
                'SELECT * FROM users WHERE age >= 25',
                'SELECT * FROM users WHERE age < 25',
                'SELECT * FROM users WHERE age <= 25'
            ];

            testCases.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(true);
                expect(result.ast.where).toBeDefined();
            });
        });

        /**
         * 测试逻辑操作符
         */
        test('应该正确解析逻辑操作符', () => {
            const sql = 'SELECT * FROM users WHERE age > 18 AND active = true OR role = "admin"';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.where.type).toBe('BinaryExpression');
        });

        /**
         * 测试IN操作符
         */
        test('应该正确解析IN操作符', () => {
            const sql = 'SELECT * FROM users WHERE id IN (1, 2, 3, 4, 5)';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.where.operator).toBe('IN');
        });

        /**
         * 测试BETWEEN操作符
         */
        test('应该正确解析BETWEEN操作符', () => {
            const sql = 'SELECT * FROM orders WHERE created_at BETWEEN "2024-01-01" AND "2024-12-31"';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.where.operator).toBe('BETWEEN');
        });

        /**
         * 测试LIKE操作符
         */
        test('应该正确解析LIKE操作符', () => {
            const sql = 'SELECT * FROM users WHERE name LIKE "%john%"';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.where.operator).toBe('LIKE');
        });

        /**
         * 测试IS NULL和IS NOT NULL
         */
        test('应该正确解析NULL检查', () => {
            const testCases = [
                'SELECT * FROM users WHERE email IS NULL',
                'SELECT * FROM users WHERE email IS NOT NULL'
            ];

            testCases.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(true);
                expect(result.ast.where).toBeDefined();
            });
        });

        /**
         * 测试EXISTS子查询
         */
        test('应该正确解析EXISTS子查询', () => {
            const sql = 'SELECT * FROM users WHERE EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id)';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.where.operator).toBe('EXISTS');
        });
    });

    describe('JOIN操作测试', () => {
        /**
         * 测试INNER JOIN
         */
        test('应该正确解析INNER JOIN', () => {
            const sql = 'SELECT u.name, p.title FROM users u INNER JOIN posts p ON u.id = p.user_id';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.from.joins).toHaveLength(1);
            expect(result.ast.from.joins[0].joinType).toBe('INNER');
        });

        /**
         * 测试LEFT JOIN
         */
        test('应该正确解析LEFT JOIN', () => {
            const sql = 'SELECT u.name, p.title FROM users u LEFT JOIN posts p ON u.id = p.user_id';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.from.joins[0].joinType).toBe('LEFT');
        });

        /**
         * 测试RIGHT JOIN
         */
        test('应该正确解析RIGHT JOIN', () => {
            const sql = 'SELECT u.name, p.title FROM users u RIGHT JOIN posts p ON u.id = p.user_id';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.from.joins[0].joinType).toBe('RIGHT');
        });

        /**
         * 测试FULL OUTER JOIN
         */
        test('应该正确解析FULL OUTER JOIN', () => {
            const sql = 'SELECT u.name, p.title FROM users u FULL OUTER JOIN posts p ON u.id = p.user_id';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.from.joins[0].joinType).toBe('FULL OUTER');
        });

        /**
         * 测试多个JOIN
         */
        test('应该正确解析多个JOIN', () => {
            const sql = `
                SELECT u.name, p.title, c.content 
                FROM users u 
                INNER JOIN posts p ON u.id = p.user_id 
                LEFT JOIN comments c ON p.id = c.post_id
            `;
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.from.joins).toHaveLength(2);
        });
    });

    describe('聚合函数测试', () => {
        /**
         * 测试基本聚合函数
         */
        test('应该正确解析聚合函数', () => {
            const testCases = [
                'SELECT COUNT(*) FROM users',
                'SELECT COUNT(id) FROM users',
                'SELECT SUM(salary) FROM employees',
                'SELECT AVG(age) FROM users',
                'SELECT MIN(created_at) FROM orders',
                'SELECT MAX(price) FROM products'
            ];

            testCases.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(true);
                expect(result.ast.columns[0].type).toBe('FunctionCall');
            });
        });

        /**
         * 测试COUNT DISTINCT
         */
        test('应该正确解析COUNT DISTINCT', () => {
            const sql = 'SELECT COUNT(DISTINCT department) FROM employees';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.columns[0].type).toBe('FunctionCall');
            expect(result.ast.columns[0].name).toBe('COUNT');
        });
    });

    describe('GROUP BY和HAVING测试', () => {
        /**
         * 测试GROUP BY
         */
        test('应该正确解析GROUP BY', () => {
            const sql = 'SELECT department, COUNT(*) FROM employees GROUP BY department';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.groupBy).toBeDefined();
            expect(result.ast.groupBy.columns).toHaveLength(1);
        });

        /**
         * 测试HAVING
         */
        test('应该正确解析HAVING', () => {
            const sql = 'SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 5';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.having).toBeDefined();
        });
    });

    describe('ORDER BY和LIMIT测试', () => {
        /**
         * 测试ORDER BY
         */
        test('应该正确解析ORDER BY', () => {
            const sql = 'SELECT * FROM users ORDER BY name ASC, age DESC';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.orderBy).toBeDefined();
            expect(result.ast.orderBy.columns).toHaveLength(2);
        });

        /**
         * 测试LIMIT
         */
        test('应该正确解析LIMIT', () => {
            const sql = 'SELECT * FROM users LIMIT 10';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.limit).toBeDefined();
            expect(result.ast.limit.count.value).toBe(10);
        });

        /**
         * 测试LIMIT OFFSET
         */
        test('应该正确解析LIMIT OFFSET', () => {
            const sql = 'SELECT * FROM users LIMIT 10 OFFSET 20';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.limit.count.value).toBe(10);
            expect(result.ast.limit.offset.value).toBe(20);
        });
    });

    describe('CASE表达式测试', () => {
        /**
         * 测试CASE WHEN表达式
         */
        test('应该正确解析CASE WHEN表达式', () => {
            const sql = `
                SELECT 
                    name,
                    CASE 
                        WHEN age >= 18 THEN 'Adult'
                        WHEN age >= 13 THEN 'Teen'
                        ELSE 'Child'
                    END as age_group
                FROM users
            `;
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.columns[1].type).toBe('CaseExpression');
        });
    });

    describe('子查询测试', () => {
        /**
         * 测试WHERE子查询
         */
        test('应该正确解析WHERE子查询', () => {
            const sql = 'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100)';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.where.right.type).toBe('SubQuery');
        });

        /**
         * 测试FROM子查询
         */
        test('应该正确解析FROM子查询', () => {
            const sql = 'SELECT * FROM (SELECT id, name FROM users WHERE active = 1) as active_users';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.from.tables[0].type).toBe('SubQuery');
        });
    });

    describe('INSERT语句测试', () => {
        /**
         * 测试基本INSERT
         */
        test('应该正确解析INSERT语句', () => {
            const sql = 'INSERT INTO users (name, email, age) VALUES ("John Doe", "john@example.com", 25)';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('InsertStatement');
            expect(result.ast.table.name).toBe('users');
        });

        /**
         * 测试多行INSERT
         */
        test('应该正确解析多行INSERT', () => {
            const sql = `
                INSERT INTO users (name, email, age) 
                VALUES 
                    ("John Doe", "john@example.com", 25),
                    ("Jane Smith", "jane@example.com", 30)
            `;
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.values).toHaveLength(2);
        });
    });

    describe('UPDATE语句测试', () => {
        /**
         * 测试UPDATE语句
         */
        test('应该正确解析UPDATE语句', () => {
            const sql = 'UPDATE users SET name = "John Smith", age = 26 WHERE id = 1';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('UpdateStatement');
            expect(result.ast.table.name).toBe('users');
        });
    });

    describe('DELETE语句测试', () => {
        /**
         * 测试DELETE语句
         */
        test('应该正确解析DELETE语句', () => {
            const sql = 'DELETE FROM users WHERE age < 18';
            const result = parseSQL(sql);
            
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('DeleteStatement');
            expect(result.ast.from.name).toBe('users');
        });
    });

    describe('UNION操作测试', () => {
        /**
         * 测试UNION（注意：当前解析器可能将UNION解析为SelectStatement）
         */
        test('应该正确解析UNION', () => {
            const sql = `
                SELECT id, name FROM users 
                UNION 
                SELECT id, name FROM customers
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('UnionStatement');
            expect(result.ast.unionType).toBe('UNION');
            expect(result.ast.all).toBe(false);
            expect(result.ast.left.type).toBe('SelectStatement');
            expect(result.ast.right.type).toBe('SelectStatement');
        });

        /**
         * 测试UNION ALL（注意：当前解析器可能将UNION解析为SelectStatement）
         */
        test('应该正确解析UNION ALL', () => {
            const sql = `
                SELECT id FROM users 
                UNION ALL 
                SELECT id FROM orders
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('UnionStatement');
            expect(result.ast.unionType).toBe('UNION ALL');
            expect(result.ast.all).toBe(true);
            expect(result.ast.left.type).toBe('SelectStatement');
            expect(result.ast.right.type).toBe('SelectStatement');
        });
    });

    describe('复杂SQL语句测试', () => {
        /**
         * 测试包含多种语法规则的复杂SQL
         */
        test('应该正确解析包含多种语法规则的复杂SQL', () => {
            const complexSQL = `
                SELECT DISTINCT
                    u.name as user_name,
                    COUNT(p.id) as post_count,
                    AVG(p.views) as avg_views,
                    CASE 
                        WHEN COUNT(p.id) > 10 THEN 'Active'
                        WHEN COUNT(p.id) BETWEEN 1 AND 10 THEN 'Moderate'
                        ELSE 'Inactive'
                    END as user_status,
                    UPPER(u.email) as email_upper,
                    EXTRACT(YEAR FROM u.created_at) as join_year
                FROM users u
                LEFT JOIN posts p ON u.id = p.user_id AND p.published = 1
                INNER JOIN user_profiles up ON u.id = up.user_id
                WHERE u.active = 1 
                  AND u.created_at >= '2024-01-01'
                  AND (u.email LIKE '%@gmail.com' OR u.email LIKE '%@yahoo.com')
                  AND u.age BETWEEN 18 AND 65
                  AND u.name IS NOT NULL
                  AND EXISTS (
                      SELECT 1 FROM user_settings us 
                      WHERE us.user_id = u.id 
                      AND us.notifications_enabled = 1
                  )
                GROUP BY u.id, u.name, u.email, u.created_at
                HAVING COUNT(p.id) > 0 AND AVG(p.views) > 100
                ORDER BY post_count DESC, avg_views ASC
                LIMIT 50 OFFSET 10
            `;
            
            const result = parseSQL(complexSQL);
            
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('SelectStatement');
            expect(result.ast.distinct).toBe(true);
            expect(result.ast.columns.length).toBeGreaterThan(5);
            expect(result.ast.from.tables.length).toBe(1); // 主表只有一个
            expect(result.ast.from.joins.length).toBeGreaterThan(1); // 有多个JOIN
            expect(result.ast.where).toBeDefined();
            expect(result.ast.groupBy).toBeDefined();
            expect(result.ast.having).toBeDefined();
            expect(result.ast.orderBy).toBeDefined();
            expect(result.ast.limit).toBeDefined();
        });
    });

    describe('查询分析功能测试', () => {
        /**
         * 测试analyzeSQL函数
         */
        test('应该正确分析SQL查询结构', () => {
            const sql = `
                SELECT u.name, COUNT(p.id) as post_count
                FROM users u
                LEFT JOIN posts p ON u.id = p.user_id
                WHERE u.active = 1 AND u.age BETWEEN 18 AND 65
                GROUP BY u.id, u.name
                ORDER BY post_count DESC
                LIMIT 10
            `;
            
            const analysis = analyzeSQL(sql);
            
            expect(analysis.success).toBe(true);
            expect(analysis.analysis.conditions).toHaveLength(2);
            expect(analysis.analysis.fields).toHaveLength(2);
            expect(analysis.analysis.tables).toHaveLength(2);
            expect(analysis.analysis.joins).toHaveLength(1);
            expect(analysis.complexity.level).toBeDefined();
        });
    });

    describe('错误处理测试', () => {
        /**
         * 测试语法错误处理
         */
        test('应该正确处理语法错误', () => {
            const invalidSQLs = [
                'SELECT * FROM',  // 缺少表名
                'SELECT name, FROM users',  // 语法错误
                'INSERT INTO users VALUES',  // 缺少值
                'UPDATE users SET WHERE id = 1',  // 缺少SET值
                'DELETE FROM users WHERE'  // 缺少WHERE条件
            ];

            invalidSQLs.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(false);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0].code).toBeDefined();
                expect(result.errors[0].message).toBeDefined();
            });
        });
    });

    describe('实用工具函数测试', () => {
        /**
         * 测试extractTables函数
         */
        test('应该正确提取表名', () => {
            const sql = `
                SELECT u.name, p.title, c.content 
                FROM users u 
                JOIN posts p ON u.id = p.user_id 
                LEFT JOIN comments c ON p.id = c.post_id
            `;
            
            const tables = extractTables(sql);
            expect(tables).toContain('users');
            expect(tables).toContain('posts');
            expect(tables).toContain('comments');
        });

        /**
         * 测试extractColumns函数
         */
        test('应该正确提取列名', () => {
            const sql = 'SELECT id, name, email, age FROM users WHERE active = 1';
            
            const columns = extractColumns(sql);
            expect(columns).toContain('id');
            expect(columns).toContain('name');
            expect(columns).toContain('email');
            expect(columns).toContain('age');
        });

        /**
         * 测试validateSQL函数
         */
        test('应该正确验证SQL语法', () => {
            const validSQL = 'SELECT * FROM users WHERE age > 18';
            const invalidSQL = 'SELECT * FROM WHERE age > 18';
            
            const validResult = validateSQL(validSQL);
            const invalidResult = validateSQL(invalidSQL);
            
            expect(validResult.valid).toBe(true);
            expect(invalidResult.valid).toBe(false);
        });
    });

    describe('性能测试', () => {
        /**
         * 测试大型SQL语句的解析性能
         */
        test('应该能够高效解析大型SQL语句', () => {
            const largeSQL = `
                SELECT 
                    u.id, u.name, u.email, u.created_at,
                    p.id as post_id, p.title, p.content, p.views,
                    c.id as comment_id, c.content as comment_content,
                    COUNT(l.id) as like_count,
                    AVG(r.rating) as avg_rating
                FROM users u
                LEFT JOIN posts p ON u.id = p.user_id
                LEFT JOIN comments c ON p.id = c.post_id
                LEFT JOIN likes l ON p.id = l.post_id
                LEFT JOIN ratings r ON p.id = r.post_id
                WHERE u.active = 1
                  AND p.published = 1
                  AND p.created_at >= '2024-01-01'
                  AND (u.role = 'admin' OR u.role = 'editor')
                GROUP BY u.id, u.name, u.email, u.created_at, p.id, p.title, p.content, p.views, c.id, c.content
                HAVING COUNT(l.id) > 0
                ORDER BY p.views DESC, avg_rating DESC
                LIMIT 100 OFFSET 0
            `;
            
            const startTime = performance.now();
            const result = parseSQL(largeSQL);
            const endTime = performance.now();
            
            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
        });
    });
});