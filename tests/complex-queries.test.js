/**
 * 复杂SQL查询测试
 * 测试包含多种语法规则组合的复杂SQL语句
 */

import { parseSQL, analyzeSQL } from '../src/index.js';

describe('复杂SQL查询解析测试', () => {

    describe('CTE (Common Table Expression) 测试', () => {
        /**
         * 测试基本CTE
         */
        test('应该正确解析基本CTE', () => {
            const sql = `
                WITH user_stats AS (
                    SELECT 
                        user_id,
                        COUNT(*) as post_count,
                        AVG(views) as avg_views
                    FROM posts
                    GROUP BY user_id
                )
                SELECT u.name, us.post_count, us.avg_views
                FROM users u
                JOIN user_stats us ON u.id = us.user_id
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('SelectStatement');
            expect(result.ast.with).toBeDefined();
        });

        /**
         * 测试递归CTE
         */
        test('应该正确解析递归CTE', () => {
            const sql = `
                WITH RECURSIVE employee_hierarchy AS (
                    SELECT id, name, manager_id, 1 as level
                    FROM employees
                    WHERE manager_id IS NULL
                    
                    UNION ALL
                    
                    SELECT e.id, e.name, e.manager_id, eh.level + 1
                    FROM employees e
                    JOIN employee_hierarchy eh ON e.manager_id = eh.id
                    WHERE eh.level < 5
                )
                SELECT * FROM employee_hierarchy
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.with.recursive).toBe(true);
        });

        /**
         * 测试多个CTE
         */
        test('应该正确解析多个CTE', () => {
            const sql = `
                WITH 
                active_users AS (
                    SELECT id, name FROM users WHERE active = 1
                ),
                recent_posts AS (
                    SELECT user_id, COUNT(*) as post_count
                    FROM posts
                    WHERE created_at >= '2024-01-01'
                    GROUP BY user_id
                )
                SELECT au.name, rp.post_count
                FROM active_users au
                LEFT JOIN recent_posts rp ON au.id = rp.user_id
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.with.expressions).toHaveLength(2);
        });
    });

    describe('窗口函数测试', () => {
        /**
         * 测试基本窗口函数
         */
        test('应该正确解析窗口函数', () => {
            const sql = `
                SELECT 
                    name,
                    salary,
                    ROW_NUMBER() OVER (ORDER BY salary DESC) as rank,
                    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank,
                    LAG(salary, 1) OVER (ORDER BY salary) as prev_salary,
                    LEAD(salary, 1) OVER (ORDER BY salary) as next_salary
                FROM employees
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            // 检查是否包含窗口函数
            const windowFunctions = result.ast.columns.filter(col => 
                col.type === 'WindowFunction' || 
                (col.type === 'FunctionCall' && col.over)
            );
            expect(windowFunctions.length).toBeGreaterThan(0);
        });

        /**
         * 测试复杂窗口函数
         */
        test('应该正确解析复杂窗口函数', () => {
            const sql = `
                SELECT 
                    department,
                    name,
                    salary,
                    SUM(salary) OVER (
                        PARTITION BY department 
                        ORDER BY salary 
                        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
                    ) as rolling_sum,
                    AVG(salary) OVER (
                        PARTITION BY department 
                        ORDER BY hire_date 
                        RANGE BETWEEN INTERVAL '1' YEAR PRECEDING AND CURRENT ROW
                    ) as yearly_avg
                FROM employees
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
        });
    });

    describe('高级子查询测试', () => {
        /**
         * 测试相关子查询
         */
        test('应该正确解析相关子查询', () => {
            const sql = `
                SELECT 
                    u.name,
                    u.email,
                    (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) as post_count,
                    (SELECT MAX(created_at) FROM posts p WHERE p.user_id = u.id) as last_post_date
                FROM users u
                WHERE EXISTS (
                    SELECT 1 FROM posts p 
                    WHERE p.user_id = u.id 
                    AND p.published = 1
                )
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.columns.some(col => col.type === 'SubQuery')).toBe(true);
        });

        /**
         * 测试ANY/ALL子查询
         */
        test('应该正确解析ANY/ALL子查询', () => {
            const sql = `
                SELECT name, salary
                FROM employees
                WHERE salary > ALL (
                    SELECT salary 
                    FROM employees 
                    WHERE department = 'HR'
                )
                AND salary < ANY (
                    SELECT salary 
                    FROM employees 
                    WHERE department = 'Engineering'
                )
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
        });
    });

    describe('复杂CASE表达式测试', () => {
        /**
         * 测试嵌套CASE表达式
         */
        test('应该正确解析嵌套CASE表达式', () => {
            const sql = `
                SELECT 
                    name,
                    CASE 
                        WHEN department = 'Engineering' THEN
                            CASE 
                                WHEN salary > 100000 THEN 'Senior Engineer'
                                WHEN salary > 80000 THEN 'Engineer'
                                ELSE 'Junior Engineer'
                            END
                        WHEN department = 'Sales' THEN
                            CASE 
                                WHEN salary > 90000 THEN 'Senior Sales'
                                ELSE 'Sales Rep'
                            END
                        ELSE 'Other'
                    END as position_level
                FROM employees
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.columns[1].type).toBe('CaseExpression');
        });

        /**
         * 测试搜索型CASE表达式
         */
        test('应该正确解析搜索型CASE表达式', () => {
            const sql = `
                SELECT 
                    product_name,
                    price,
                    CASE 
                        WHEN price < 10 THEN 'Budget'
                        WHEN price BETWEEN 10 AND 50 THEN 'Standard'
                        WHEN price BETWEEN 50 AND 100 THEN 'Premium'
                        WHEN price > 100 THEN 'Luxury'
                        ELSE 'Unknown'
                    END as price_category,
                    CASE category
                        WHEN 'electronics' THEN price * 0.1
                        WHEN 'clothing' THEN price * 0.15
                        WHEN 'books' THEN price * 0.05
                        ELSE price * 0.08
                    END as tax_amount
                FROM products
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
        });
    });

    describe('复杂JOIN测试', () => {
        /**
         * 测试多表复杂JOIN
         */
        test('应该正确解析多表复杂JOIN', () => {
            const sql = `
                SELECT 
                    u.name as user_name,
                    p.title as post_title,
                    c.content as comment_content,
                    l.created_at as like_date,
                    t.name as tag_name
                FROM users u
                INNER JOIN posts p ON u.id = p.user_id
                LEFT JOIN comments c ON p.id = c.post_id AND c.approved = 1
                RIGHT JOIN likes l ON p.id = l.post_id
                FULL OUTER JOIN post_tags pt ON p.id = pt.post_id
                INNER JOIN tags t ON pt.tag_id = t.id
                CROSS JOIN (SELECT 'active' as status) s
                WHERE u.active = 1
                  AND p.published = 1
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.from.joins.length).toBeGreaterThan(4);
        });

        /**
         * 测试自连接
         */
        test('应该正确解析自连接', () => {
            const sql = `
                SELECT 
                    e1.name as employee_name,
                    e2.name as manager_name
                FROM employees e1
                LEFT JOIN employees e2 ON e1.manager_id = e2.id
                WHERE e1.active = 1
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.tables.filter(table => table === 'employees')).toHaveLength(2);
        });
    });

    describe('集合操作测试', () => {
        /**
         * 测试复杂UNION操作
         */
        test('应该正确解析复杂UNION操作', () => {
            const sql = `
                SELECT 'current' as type, id, name, email FROM users WHERE active = 1
                UNION ALL
                SELECT 'archived' as type, id, name, email FROM archived_users WHERE archived_date > '2023-01-01'
                UNION
                SELECT 'temp' as type, id, name, email FROM temp_users WHERE created_at > '2024-01-01'
                ORDER BY type, name
                LIMIT 100
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.type).toBe('UnionStatement');
        });

        /**
         * 测试INTERSECT和EXCEPT
         */
        test('应该正确解析INTERSECT和EXCEPT', () => {
            const testCases = [
                `
                    SELECT id FROM users WHERE active = 1
                    INTERSECT
                    SELECT user_id FROM orders WHERE total > 100
                `,
                `
                    SELECT id FROM all_users
                    EXCEPT
                    SELECT id FROM blocked_users
                `
            ];

            testCases.forEach(sql => {
                const result = parseSQL(sql);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('超级复杂查询测试', () => {
        /**
         * 测试包含所有语法规则的超级复杂SQL
         */
        test('应该正确解析包含所有语法规则的超级复杂SQL', () => {
            const superComplexSQL = `
                WITH RECURSIVE user_hierarchy AS (
                    SELECT 
                        u.id,
                        u.name,
                        u.manager_id,
                        u.department_id,
                        1 as level
                    FROM users u 
                    WHERE u.manager_id IS NULL
                    
                    UNION ALL
                    
                    SELECT 
                        u.id,
                        u.name,
                        u.manager_id,
                        u.department_id,
                        uh.level + 1
                    FROM users u
                    INNER JOIN user_hierarchy uh ON u.manager_id = uh.id
                    WHERE uh.level < 5
                ),
                department_stats AS (
                    SELECT 
                        d.id as dept_id,
                        d.name as dept_name,
                        COUNT(DISTINCT u.id) as employee_count,
                        AVG(u.salary) as avg_salary,
                        MAX(u.created_at) as latest_hire_date
                    FROM departments d
                    LEFT JOIN users u ON d.id = u.department_id
                    WHERE u.active = true
                    GROUP BY d.id, d.name
                    HAVING COUNT(u.id) > 0
                )
                SELECT DISTINCT
                    uh.name as employee_name,
                    uh.level as hierarchy_level,
                    ds.dept_name,
                    COUNT(p.id) OVER (PARTITION BY uh.id) as total_projects,
                    SUM(p.budget) OVER (PARTITION BY ds.dept_id) as dept_total_budget,
                    AVG(p.completion_rate) OVER (
                        PARTITION BY uh.id 
                        ORDER BY p.start_date 
                        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
                    ) as rolling_avg_completion,
                    CASE 
                        WHEN uh.level = 1 THEN '高级管理层'
                        WHEN uh.level BETWEEN 2 AND 3 THEN '中层管理'
                        WHEN uh.level > 3 THEN '基层员工'
                        ELSE '未分类'
                    END as position_level,
                    COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects,
                    SUM(CASE WHEN p.priority = 'high' THEN p.budget ELSE 0 END) as high_priority_budget,
                    (SELECT MAX(salary) FROM users WHERE department_id = ds.dept_id) as max_dept_salary,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM certifications c 
                            WHERE c.user_id = uh.id 
                            AND c.expiry_date > CURRENT_DATE
                        ) THEN '已认证'
                        ELSE '未认证'
                    END as certification_status,
                    UPPER(SUBSTRING(uh.name, 1, 1)) || LOWER(SUBSTRING(uh.name, 2)) as formatted_name,
                    EXTRACT(YEAR FROM p.start_date) as project_year,
                    ROUND(p.budget * 1.1, 2) as inflated_budget,
                    p.completion_rate * 100 as completion_percentage

                FROM user_hierarchy uh
                INNER JOIN department_stats ds ON uh.department_id = ds.dept_id
                LEFT OUTER JOIN projects p ON uh.id = p.assigned_user_id
                RIGHT JOIN project_categories pc ON p.category_id = pc.id
                FULL OUTER JOIN user_skills us ON uh.id = us.user_id

                WHERE 
                    uh.level <= 4
                    AND ds.employee_count BETWEEN 5 AND 50
                    AND (p.status IN ('active', 'completed', 'on_hold') OR p.status IS NULL)
                    AND p.start_date >= DATE('2024-01-01')
                    AND (
                        uh.name LIKE '%manager%' 
                        OR uh.name ILIKE '%lead%'
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM user_violations uv 
                        WHERE uv.user_id = uh.id 
                        AND uv.violation_date > CURRENT_DATE - INTERVAL '1 year'
                    )
                    AND p.budget <> 0
                    AND p.completion_rate IS NOT NULL
                    AND ds.avg_salary > ALL (
                        SELECT AVG(salary) * 0.8 
                        FROM users 
                        WHERE department_id != ds.dept_id
                    )

                GROUP BY 
                    uh.id, uh.name, uh.level, ds.dept_id, ds.dept_name, 
                    p.id, p.budget, p.completion_rate, p.start_date, p.status, p.priority

                HAVING 
                    COUNT(p.id) > 0
                    AND AVG(p.completion_rate) >= 0.7
                    AND SUM(p.budget) BETWEEN 10000 AND 1000000

                UNION ALL

                SELECT DISTINCT
                    'TOTAL' as employee_name,
                    0 as hierarchy_level,
                    'ALL_DEPARTMENTS' as dept_name,
                    COUNT(*) as total_projects,
                    SUM(budget) as dept_total_budget,
                    AVG(completion_rate) as rolling_avg_completion,
                    'SUMMARY' as position_level,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
                    SUM(CASE WHEN priority = 'high' THEN budget ELSE 0 END) as high_priority_budget,
                    MAX(budget) as max_dept_salary,
                    'N/A' as certification_status,
                    'SUMMARY' as formatted_name,
                    EXTRACT(YEAR FROM CURRENT_DATE) as project_year,
                    SUM(budget * 1.1) as inflated_budget,
                    AVG(completion_rate * 100) as completion_percentage
                FROM projects
                WHERE status != 'cancelled'

                ORDER BY 
                    CASE 
                        WHEN employee_name = 'TOTAL' THEN 1 
                        ELSE 0 
                    END,
                    hierarchy_level ASC,
                    dept_name DESC,
                    total_projects DESC NULLS LAST,
                    completion_percentage ASC NULLS FIRST

                LIMIT 100 OFFSET 0
            `;
            
            const result = parseSQL(superComplexSQL);
            
            expect(result.success).toBe(true);
            expect(result.ast).toBeDefined();
            
            // 验证包含的主要语法元素
            expect(result.ast.with).toBeDefined(); // CTE
            expect(result.ast.with.recursive).toBe(true); // 递归CTE
            expect(result.ast.type).toBe('UnionStatement'); // UNION操作
            
            // 验证提取的表名和列名
            expect(result.tables.length).toBeGreaterThan(5);
            expect(result.columns.length).toBeGreaterThan(10);
        });

        /**
         * 测试复杂查询的分析功能
         */
        test('应该正确分析超级复杂查询', () => {
            const complexSQL = `
                SELECT 
                    u.name,
                    COUNT(p.id) as post_count,
                    AVG(p.views) as avg_views,
                    CASE 
                        WHEN COUNT(p.id) > 10 THEN 'Active'
                        ELSE 'Inactive'
                    END as user_status
                FROM users u
                LEFT JOIN posts p ON u.id = p.user_id
                WHERE u.active = 1 
                  AND u.created_at >= '2024-01-01'
                  AND p.published = 1
                GROUP BY u.id, u.name
                HAVING COUNT(p.id) > 0
                ORDER BY post_count DESC
                LIMIT 50
            `;
            
            const analysis = analyzeSQL(complexSQL);
            
            expect(analysis.success).toBe(true);
            expect(analysis.analysis).toBeDefined();
            expect(analysis.complexity).toBeDefined();
            
            // 验证分析结果
            expect(analysis.analysis.conditions.length).toBeGreaterThan(2);
            expect(analysis.analysis.fields.length).toBeGreaterThan(3);
            expect(analysis.analysis.tables.length).toBe(2);
            expect(analysis.analysis.joins.length).toBe(1);
            expect(analysis.complexity.level).toMatch(/medium|complex/);
        });
    });

    describe('边界情况测试', () => {
        /**
         * 测试空查询
         */
        test('应该正确处理空查询', () => {
            const result = parseSQL('');
            expect(result.success).toBe(false);
        });

        /**
         * 测试只有空格的查询
         */
        test('应该正确处理只有空格的查询', () => {
            const result = parseSQL('   \n\t   ');
            expect(result.success).toBe(false);
        });

        /**
         * 测试非常长的查询
         */
        test('应该能处理非常长的查询', () => {
            // 生成一个包含大量列的查询
            const columns = Array.from({ length: 100 }, (_, i) => `col${i}`).join(', ');
            const sql = `SELECT ${columns} FROM large_table WHERE id > 0`;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
            expect(result.ast.columns.length).toBe(100);
        });

        /**
         * 测试深度嵌套的子查询
         */
        test('应该能处理深度嵌套的子查询', () => {
            const sql = `
                SELECT * FROM users WHERE id IN (
                    SELECT user_id FROM orders WHERE total > (
                        SELECT AVG(total) FROM orders WHERE created_at > (
                            SELECT MIN(created_at) FROM orders WHERE status = 'completed'
                        )
                    )
                )
            `;
            
            const result = parseSQL(sql);
            expect(result.success).toBe(true);
        });
    });
});