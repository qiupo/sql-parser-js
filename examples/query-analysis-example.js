/**
 * SQL查询分析示例
 * 演示如何使用analyzeSQL函数提取结构化的查询信息
 */

import { analyzeSQL } from '../dist/sql-parser.es.js';

console.log('=== SQL查询分析示例 ===\n');

// 示例1: 基本SELECT查询
console.log('📋 1. 基本SELECT查询分析');
const basicQuery = `
    SELECT goods_name, liveroom_id, live_date 
    FROM goods_stat_daily 
    WHERE goods_name LIKE '%goods_name%' 
      AND liveroom_id = 'liveroom_id' 
      AND live_date BETWEEN '2024-01-01' AND '2024-12-31'
`;

const basicAnalysis = analyzeSQL(basicQuery);
if (basicAnalysis.success) {
    console.log('✅ 查询分析成功!');
    console.log('📊 查询条件:');
    basicAnalysis.analysis.conditions.forEach((condition, index) => {
        console.log(`   ${index + 1}. ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)} (类型: ${condition.type})`);
    });
    
    console.log('📋 输出字段:');
    basicAnalysis.analysis.fields.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field.name} (类型: ${field.type}${field.alias ? ', 别名: ' + field.alias : ''})`);
    });
    
    console.log('🏢 涉及表:');
    basicAnalysis.analysis.tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.name}${table.alias ? ' (别名: ' + table.alias + ')' : ''}`);
    });
    
    console.log(`🔍 查询复杂度: ${basicAnalysis.complexity.level} (得分: ${basicAnalysis.complexity.score})`);
    if (basicAnalysis.complexity.factors.length > 0) {
        console.log(`   复杂度因素: ${basicAnalysis.complexity.factors.join(', ')}`);
    }
} else {
    console.log('❌ 查询分析失败:', basicAnalysis.error);
}

console.log('\n' + '='.repeat(60) + '\n');

// 示例2: 复杂查询 (JOIN + 聚合函数)
console.log('📋 2. 复杂查询分析 (JOIN + 聚合函数)');
const complexQuery = `
    SELECT 
        u.name,
        u.email,
        COUNT(p.id) as post_count,
        AVG(p.views) as avg_views,
        CASE 
            WHEN COUNT(p.id) > 10 THEN '活跃用户'
            WHEN COUNT(p.id) > 5 THEN '普通用户'
            ELSE '新用户'
        END as user_level
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    WHERE u.active = 1 
      AND u.created_at >= '2024-01-01'
      AND p.published = 1
    GROUP BY u.id, u.name, u.email
    ORDER BY post_count DESC, avg_views DESC
    LIMIT 50
`;

const complexAnalysis = analyzeSQL(complexQuery);
if (complexAnalysis.success) {
    console.log('✅ 复杂查询分析成功!');
    
    console.log('📊 查询条件:');
    complexAnalysis.analysis.conditions.forEach((condition, index) => {
        console.log(`   ${index + 1}. ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)} (类型: ${condition.type})`);
    });
    
    console.log('📋 输出字段:');
    complexAnalysis.analysis.fields.forEach((field, index) => {
        let fieldDesc = `${field.name}`;
        if (field.alias) fieldDesc += ` (别名: ${field.alias})`;
        if (field.type === 'function') fieldDesc += ` [函数: ${field.expression}]`;
        if (field.type === 'case') fieldDesc += ` [CASE表达式]`;
        if (field.aggregation) fieldDesc += ` [聚合函数]`;
        console.log(`   ${index + 1}. ${fieldDesc}`);
    });
    
    console.log('🔗 JOIN信息:');
    complexAnalysis.analysis.joins.forEach((join, index) => {
        console.log(`   ${index + 1}. ${join.type} ${join.table}${join.alias ? ' (' + join.alias + ')' : ''}`);
        if (join.condition) {
            console.log(`      条件: ${join.condition.left} ${join.condition.operator} ${join.condition.right}`);
        }
    });
    
    console.log('📊 分组字段:');
    complexAnalysis.analysis.groupBy.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field}`);
    });
    
    console.log('🔄 排序字段:');
    complexAnalysis.analysis.orderBy.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.field} ${order.direction}`);
    });
    
    console.log(`📏 限制条件: ${complexAnalysis.analysis.limit ? complexAnalysis.analysis.limit.count : '无'}`);
    
    console.log(`🔍 查询复杂度: ${complexAnalysis.complexity.level} (得分: ${complexAnalysis.complexity.score})`);
    console.log(`   复杂度因素: ${complexAnalysis.complexity.factors.join(', ')}`);
} else {
    console.log('❌ 复杂查询分析失败:', complexAnalysis.error);
}

console.log('\n' + '='.repeat(60) + '\n');

// 示例3: 生成查询配置 (类似图片中的界面)
console.log('📋 3. 生成查询配置界面数据');

/**
 * 将分析结果转换为查询配置界面数据
 * @param {Object} analysis - 查询分析结果
 * @returns {Object} 界面配置数据
 */
function generateQueryConfig(analysis) {
    if (!analysis.success) {
        return { error: analysis.error };
    }
    
    return {
        // 查询条件配置
        conditions: analysis.analysis.conditions.map(condition => ({
            field: condition.field,
            fieldType: getFieldType(condition.field),
            operator: condition.operator,
            operatorText: getOperatorText(condition.operator),
            value: condition.value,
            valueType: condition.type
        })),
        
        // 输出字段配置
        outputFields: analysis.analysis.fields.map(field => ({
            field: field.name,
            fieldAlias: field.alias || field.name,
            fieldType: getFieldDataType(field),
            isAggregation: field.aggregation || false,
            expression: field.expression,
            // 模拟字段配置选项
            options: {
                visible: true,
                sortable: true,
                filterable: true,
                groupable: field.aggregation ? false : true
            }
        })),
        
        // 表信息
        tables: analysis.analysis.tables,
        
        // 查询元信息
        metadata: {
            queryType: analysis.query.type,
            complexity: analysis.complexity.level,
            hasJoins: analysis.analysis.joins.length > 0,
            hasGroupBy: analysis.analysis.groupBy.length > 0,
            hasOrderBy: analysis.analysis.orderBy.length > 0,
            hasLimit: analysis.analysis.limit !== null
        }
    };
}

/**
 * 获取字段类型 (模拟)
 */
function getFieldType(fieldName) {
    // 根据字段名推测类型 (实际应用中应该从数据库schema获取)
    if (fieldName.includes('id')) return 'ID';
    if (fieldName.includes('name')) return '文本';
    if (fieldName.includes('date') || fieldName.includes('time')) return '日期时间';
    if (fieldName.includes('count') || fieldName.includes('num')) return '数值';
    return '文本';
}

/**
 * 获取操作符文本
 */
function getOperatorText(operator) {
    const operatorMap = {
        '=': '等于',
        '!=': '不等于',
        '<>': '不等于',
        '>': '大于',
        '<': '小于',
        '>=': '大于等于',
        '<=': '小于等于',
        'LIKE': '包含',
        'IN': '在列表中',
        'BETWEEN': '在范围内'
    };
    return operatorMap[operator] || operator;
}

/**
 * 获取字段数据类型
 */
function getFieldDataType(field) {
    if (field.aggregation) return '数值';
    if (field.type === 'function') return '计算字段';
    if (field.type === 'case') return '条件字段';
    return '文本';
}

// 使用基本查询生成配置
const queryConfig = generateQueryConfig(basicAnalysis);
console.log('🎛️ 查询条件配置:');
queryConfig.conditions.forEach((condition, index) => {
    console.log(`   ${index + 1}. 字段: ${condition.field} (${condition.fieldType})`);
    console.log(`      操作符: ${condition.operatorText} (${condition.operator})`);
    console.log(`      值: ${JSON.stringify(condition.value)} (${condition.valueType})`);
    console.log('');
});

console.log('🎛️ 输出字段配置:');
queryConfig.outputFields.forEach((field, index) => {
    console.log(`   ${index + 1}. 字段: ${field.field} -> ${field.fieldAlias}`);
    console.log(`      类型: ${field.fieldType}${field.isAggregation ? ' (聚合)' : ''}`);
    console.log(`      选项: 可见=${field.options.visible}, 可排序=${field.options.sortable}, 可筛选=${field.options.filterable}`);
    console.log('');
});

console.log('📊 查询元信息:');
console.log(`   查询类型: ${queryConfig.metadata.queryType}`);
console.log(`   复杂度: ${queryConfig.metadata.complexity}`);
console.log(`   包含JOIN: ${queryConfig.metadata.hasJoins ? '是' : '否'}`);
console.log(`   包含分组: ${queryConfig.metadata.hasGroupBy ? '是' : '否'}`);
console.log(`   包含排序: ${queryConfig.metadata.hasOrderBy ? '是' : '否'}`);
console.log(`   包含限制: ${queryConfig.metadata.hasLimit ? '是' : '否'}`);

console.log('\n🎉 查询分析示例完成!');
console.log('\n💡 提示: 这些结构化数据可以用于生成类似图片中的查询配置界面');