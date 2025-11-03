/**
 * Node.js 使用示例
 * 演示如何在 Node.js 环境中使用 SQL 解析器
 */

// 导入 SQL 解析器 (使用 ES 模块)
import { parseSQL, validateSQL, extractTables, extractColumns } from '../dist/sql-parser.es.js';

console.log('=== SQL 解析器 Node.js 使用示例 ===\n');

// 示例 1: 基本 SELECT 语句解析
console.log('1. 基本 SELECT 语句解析:');
const basicSQL = 'SELECT id, name, email FROM users WHERE age > 18';
try {
    const result = parseSQL(basicSQL);
    console.log('✅ 解析成功!');
    console.log('AST 类型:', result.ast.type);
    console.log('选择的列:', result.ast.columns.map(col => col.name || col.expression));
    console.log('表名:', result.ast.from.table);
    console.log('');
} catch (error) {
    console.error('❌ 解析失败:', error.message);
}

// 示例 2: 复杂查询解析 (包含 JOIN 和 CASE 表达式)
console.log('2. 复杂查询解析 (JOIN + CASE):');
const complexSQL = `
    SELECT 
        u.name,
        u.email,
        CASE 
            WHEN u.age >= 18 THEN 'Adult'
            WHEN u.age >= 13 THEN 'Teen'
            ELSE 'Child'
        END as age_group,
        p.title
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    WHERE u.active = true
    ORDER BY u.name
    LIMIT 10
`;

try {
    const result = parseSQL(complexSQL);
    console.log('✅ 复杂查询解析成功!');
    console.log('查询类型:', result.ast.type);
    console.log('包含 JOIN:', result.ast.from.joins ? '是' : '否');
    console.log('包含 WHERE:', result.ast.where ? '是' : '否');
    console.log('包含 ORDER BY:', result.ast.orderBy ? '是' : '否');
    console.log('包含 LIMIT:', result.ast.limit ? '是' : '否');
    console.log('');
} catch (error) {
    console.error('❌ 解析失败:', error.message);
}

// 示例 3: INSERT 语句解析
console.log('3. INSERT 语句解析:');
const insertSQL = "INSERT INTO users (name, email, age) VALUES ('John Doe', 'john@example.com', 25)";
try {
    const result = parseSQL(insertSQL);
    console.log('✅ INSERT 解析成功!');
    console.log('表名:', result.ast.table);
    console.log('插入列:', result.ast.columns);
    console.log('值数量:', result.ast.values.length);
    console.log('');
} catch (error) {
    console.error('❌ 解析失败:', error.message);
}

// 示例 4: SQL 验证
console.log('4. SQL 验证:');
const validSQL = 'SELECT * FROM products WHERE price > 100';
const invalidSQL = 'SELECT * FROM WHERE price > 100'; // 缺少表名

console.log('验证有效 SQL:', validateSQL(validSQL).isValid ? '✅ 有效' : '❌ 无效');
console.log('验证无效 SQL:', validateSQL(invalidSQL).isValid ? '✅ 有效' : '❌ 无效');
console.log('');

// 示例 5: 提取表名
console.log('5. 提取表名:');
const multiTableSQL = `
    SELECT u.name, p.title, c.content 
    FROM users u 
    JOIN posts p ON u.id = p.user_id 
    LEFT JOIN comments c ON p.id = c.post_id
`;
const tables = extractTables(multiTableSQL);
console.log('提取到的表名:', tables);
console.log('');

// 示例 6: 提取列名
console.log('6. 提取列名:');
const columns = extractColumns(multiTableSQL);
console.log('提取到的列名:', columns);
console.log('');

// 示例 7: 错误处理
console.log('7. 错误处理示例:');
const errorSQL = 'SELECT * FROM users WHERE age > AND name = "John"'; // 语法错误
try {
    parseSQL(errorSQL);
} catch (error) {
    console.log('❌ 捕获到语法错误:');
    console.log('  错误类型:', error.type);
    console.log('  错误信息:', error.message);
    console.log('  错误位置: 第', error.line, '行, 第', error.column, '列');
}

console.log('\n=== 示例完成 ===');