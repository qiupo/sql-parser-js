/**
 * CommonJS 使用示例
 * 演示如何在传统的 Node.js CommonJS 环境中使用 SQL 解析器
 */

console.log('=== SQL 解析器 CommonJS 使用示例 ===\n');

// 示例函数：演示基本功能
function demonstrateBasicParsing(parseSQL) {
    console.log('📋 1. 基本解析功能演示');
    
    const testCases = [
        {
            name: 'SELECT 查询',
            sql: 'SELECT id, name FROM users WHERE active = true'
        },
        {
            name: 'INSERT 语句',
            sql: "INSERT INTO products (name, price) VALUES ('iPhone', 999.99)"
        },
        {
            name: 'UPDATE 语句',
            sql: "UPDATE users SET last_login = NOW() WHERE id = 123"
        },
        {
            name: 'DELETE 语句',
            sql: "DELETE FROM logs WHERE created_at < '2023-01-01'"
        }
    ];
    
    testCases.forEach(testCase => {
        try {
            const result = parseSQL(testCase.sql);
            console.log(`  ✅ ${testCase.name}: 解析成功 (类型: ${result.ast.type})`);
        } catch (error) {
            console.log(`  ❌ ${testCase.name}: 解析失败 - ${error.message}`);
        }
    });
    
    console.log('');
}

// 示例函数：演示复杂查询
function demonstrateComplexQueries(parseSQL) {
    console.log('🔍 2. 复杂查询解析演示');
    
    const complexQueries = [
        {
            name: '多表 JOIN',
            sql: `SELECT u.name, p.title, c.content 
                  FROM users u 
                  JOIN posts p ON u.id = p.user_id 
                  LEFT JOIN comments c ON p.id = c.post_id 
                  WHERE u.active = true`
        },
        {
            name: 'CASE 表达式',
            sql: `SELECT name, 
                  CASE 
                      WHEN age >= 18 THEN 'Adult' 
                      ELSE 'Minor' 
                  END as category 
                  FROM users`
        },
        {
            name: '聚合函数',
            sql: `SELECT department, COUNT(*) as employee_count, AVG(salary) as avg_salary 
                  FROM employees 
                  GROUP BY department 
                  HAVING COUNT(*) > 5`
        }
    ];
    
    complexQueries.forEach(query => {
        try {
            const result = parseSQL(query.sql);
            console.log(`  ✅ ${query.name}: 解析成功`);
            
            // 显示一些解析结果的详细信息
            if (result.ast.type === 'SELECT') {
                console.log(`     - 选择列数: ${result.ast.columns.length}`);
                if (result.ast.from.joins) {
                    console.log(`     - JOIN 数量: ${result.ast.from.joins.length}`);
                }
                if (result.ast.where) {
                    console.log(`     - 包含 WHERE 条件: 是`);
                }
            }
        } catch (error) {
            console.log(`  ❌ ${query.name}: 解析失败 - ${error.message}`);
        }
    });
    
    console.log('');
}

// 示例函数：演示实用工具
function demonstrateUtilities(validateSQL, extractTables, extractColumns) {
    console.log('🛠️ 3. 实用工具演示');
    
    const testSQL = `
        SELECT u.name, u.email, p.title, c.content
        FROM users u
        JOIN posts p ON u.id = p.user_id
        LEFT JOIN comments c ON p.id = c.post_id
        WHERE u.active = true AND p.published = true
        ORDER BY p.created_at DESC
    `;
    
    // SQL 验证
    console.log('  📝 SQL 验证:');
    const validation = validateSQL(testSQL);
    console.log(`     - 有效性: ${validation.isValid ? '✅ 有效' : '❌ 无效'}`);
    console.log(`     - 错误数量: ${validation.errors.length}`);
    
    // 提取表名
    console.log('  📋 提取表名:');
    const tables = extractTables(testSQL);
    console.log(`     - 发现的表: ${tables.join(', ')}`);
    
    // 提取列名
    console.log('  📊 提取列名:');
    const columns = extractColumns(testSQL);
    console.log(`     - 发现的列: ${columns.join(', ')}`);
    
    console.log('');
}

// 示例函数：演示错误处理
function demonstrateErrorHandling(parseSQL) {
    console.log('⚠️ 4. 错误处理演示');
    
    const errorCases = [
        {
            name: '语法错误',
            sql: 'SELECT * FROM WHERE age > 18' // 缺少表名
        },
        {
            name: '未闭合的引号',
            sql: "SELECT * FROM users WHERE name = 'John"
        },
        {
            name: '无效的操作符',
            sql: 'SELECT * FROM users WHERE age >> 18'
        }
    ];
    
    errorCases.forEach(errorCase => {
        try {
            parseSQL(errorCase.sql);
            console.log(`  ⚠️ ${errorCase.name}: 意外成功 (应该失败)`);
        } catch (error) {
            console.log(`  ✅ ${errorCase.name}: 正确捕获错误`);
            console.log(`     - 错误类型: ${error.type || 'PARSE_ERROR'}`);
            console.log(`     - 错误信息: ${error.message}`);
            console.log(`     - 错误位置: 第 ${error.line || '?'} 行, 第 ${error.column || '?'} 列`);
        }
    });
    
    console.log('');
}

// 示例函数：性能测试
function demonstratePerformance(parseSQL) {
    console.log('⚡ 5. 性能测试演示');
    
    const testSQL = `
        SELECT 
            u.id, u.name, u.email, u.created_at,
            p.title, p.content, p.published_at,
            COUNT(c.id) as comment_count,
            AVG(r.rating) as avg_rating
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN ratings r ON p.id = r.post_id
        WHERE u.active = true 
            AND p.published = true
            AND p.created_at >= '2023-01-01'
        GROUP BY u.id, p.id
        HAVING COUNT(c.id) > 0
        ORDER BY p.published_at DESC, avg_rating DESC
        LIMIT 50
    `;
    
    const iterations = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
        try {
            parseSQL(testSQL);
        } catch (error) {
            console.log(`  ❌ 第 ${i + 1} 次解析失败: ${error.message}`);
            return;
        }
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`  📊 性能统计:`);
    console.log(`     - 总解析次数: ${iterations}`);
    console.log(`     - 总耗时: ${totalTime}ms`);
    console.log(`     - 平均耗时: ${avgTime.toFixed(2)}ms`);
    console.log(`     - 每秒解析数: ${Math.round(1000 / avgTime)}`);
    
    console.log('');
}

// 主函数
async function main() {
    try {
        // 使用动态 import 引入 SQL 解析器 (CommonJS 格式)
         const { parseSQL, validateSQL, extractTables, extractColumns } = await import('../dist/sql-parser.cjs.cjs');
        
        // 将解析器函数传递给示例函数
        demonstrateBasicParsing(parseSQL);
        demonstrateComplexQueries(parseSQL);
        demonstrateUtilities(validateSQL, extractTables, extractColumns);
        demonstrateErrorHandling(parseSQL);
        demonstratePerformance(parseSQL);
        
        console.log('🎉 所有示例演示完成!');
        console.log('\n💡 提示: 你可以修改这些示例来测试自己的 SQL 语句');
        
    } catch (error) {
        console.error('❌ 示例运行出错:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
    main();
}

// 导出示例函数，供其他模块使用
module.exports = {
    demonstrateBasicParsing,
    demonstrateComplexQueries,
    demonstrateUtilities,
    demonstrateErrorHandling,
    demonstratePerformance
};