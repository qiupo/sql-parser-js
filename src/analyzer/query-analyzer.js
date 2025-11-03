/**
 * 提取LIMIT信息
 * @param {Object} limit - LIMIT子句
 * @returns {Object|null} 限制信息
 */
function extractLimit(limit) {
  if (!limit || !limit.count) {
    return null;
  }

  return {
    count: extractValue(limit.count),
    offset: limit.offset ? extractValue(limit.offset) : null,
  };
}

/**
 * SQL查询分析器 - 提取结构化的查询信息
 * 用于解析SQL查询并提取查询条件、字段配置等信息
 */

/**
 * 分析SELECT查询，提取结构化信息
 * @param {Object} ast - 解析后的AST
 * @returns {Object} 结构化的查询信息
 */
export function analyzeSelectQuery(ast) {
  if (ast.type !== "SelectStatement") {
    throw new Error("只支持SELECT查询的分析");
  }

  // 从 FROM 子句中提取 JOIN 信息
  const joins = ast.from && ast.from.joins ? ast.from.joins : [];

  return {
    // 查询条件
    conditions: extractConditions(ast.where),
    // 输出字段
    fields: extractFields(ast.columns),
    // 表信息
    tables: extractTableInfo(ast.from),
    // 连接信息
    joins: extractJoinInfo(joins),
    // 排序信息
    orderBy: extractOrderBy(ast.orderBy),
    // 分组信息
    groupBy: extractGroupBy(ast.groupBy),
    // 限制信息
    limit: extractLimit(ast.limit),
  };
}

/**
 * 提取WHERE条件
 * @param {Object} whereClause - WHERE子句AST
 * @returns {Array} 条件列表
 */
function extractConditions(whereClause) {
  if (!whereClause) {
    return [];
  }

  const conditions = [];

  function traverseCondition(node) {
    if (!node) {
      return;
    }

    switch (node.type) {
      case "BinaryExpression":
        if (
          [
            "=",
            "!=",
            "<>",
            ">",
            "<",
            ">=",
            "<=",
            "LIKE",
            "ILIKE",
            "IN",
            "BETWEEN",
          ].includes(node.operator)
        ) {
          conditions.push({
            field: extractFieldName(node.left),
            operator: node.operator,
            value: extractValue(node.right),
            type: getConditionType(node.operator, node.right),
          });
        } else if (["AND", "OR"].includes(node.operator)) {
          traverseCondition(node.left);
          traverseCondition(node.right);
        }
        break;
      case "UnaryExpression":
        if (node.operator === "NOT") {
          traverseCondition(node.operand);
        }
        break;
    }
  }

  // 处理WhereClause结构
  if (whereClause.type === "WhereClause" && whereClause.condition) {
    traverseCondition(whereClause.condition);
  } else {
    traverseCondition(whereClause);
  }
  
  return conditions;
}

/**
 * 提取SELECT字段信息
 * @param {Array} selectList - SELECT字段列表
 * @returns {Array} 字段配置列表
 */
function extractFields(selectList) {
  if (!selectList) {
    return [];
  }

  return selectList.map((field) => {
    const fieldInfo = {
      name: null,
      alias: field.alias,
      type: "column",
      table: null,
      expression: null,
      aggregation: null,
    };

    if (field.type === "ColumnReference") {
      fieldInfo.name = field.name;
      fieldInfo.table = field.table;
      fieldInfo.type = "column";
    } else if (field.type === "Identifier") {
      fieldInfo.name = field.name;
      fieldInfo.type = "column";
    } else if (field.type === "MemberExpression") {
      fieldInfo.table = field.object.name;
      fieldInfo.name = field.property.name;
      fieldInfo.type = "column";
    } else if (field.type === "FunctionCall") {
      fieldInfo.name = field.name;
      fieldInfo.type = "function";
      fieldInfo.aggregation = isAggregateFunction(field.name);
      fieldInfo.expression = formatFunctionCall(field);
    } else if (field.type === "CaseExpression") {
      fieldInfo.name = field.alias || "case_expression";
      fieldInfo.type = "case";
      fieldInfo.expression = "CASE表达式";
    } else {
      fieldInfo.name = field.alias || "expression";
      fieldInfo.type = "expression";
      fieldInfo.expression = "复杂表达式";
    }

    return fieldInfo;
  });
}

/**
 * 提取表信息
 * @param {Object} fromClause - FROM子句
 * @returns {Array} 表信息列表
 */
function extractTableInfo(fromClause) {
  if (!fromClause) {
    return [];
  }

  const tables = [];

  function extractTable(node) {
    if (node.type === "TableReference") {
      tables.push({
        name: node.name,
        alias: node.alias,
        schema: node.schema,
      });
    } else if (node.type === "JoinExpression") {
      extractTable(node.left);
      extractTable(node.right);
    }
  }

  // 处理FromClause结构
  if (fromClause.type === "FromClause") {
    // 提取主表
    if (fromClause.tables) {
      fromClause.tables.forEach(extractTable);
    }
    
    // 提取JOIN中的表
    if (fromClause.joins) {
      fromClause.joins.forEach(join => {
        if (join.table) {
          extractTable(join.table);
        }
      });
    }
  } else {
    extractTable(fromClause);
  }
  
  return tables;
}

/**
 * 提取JOIN信息
 * @param {Array} joins - JOIN列表
 * @returns {Array} JOIN信息列表
 */
function extractJoinInfo(joins) {
  return joins.map((join) => ({
    type: join.type,
    table: join.table.name,
    alias: join.table.alias,
    condition: join.condition ? extractJoinCondition(join.condition) : null,
  }));
}

/**
 * 提取JOIN条件
 * @param {Object} condition - JOIN条件
 * @returns {Object} JOIN条件信息
 */
function extractJoinCondition(condition) {
  if (condition.type === "BinaryExpression") {
    return {
      left: extractFieldName(condition.left),
      operator: condition.operator,
      right: extractFieldName(condition.right),
    };
  }
  return null;
}

/**
 * 提取ORDER BY信息
 * @param {Array} orderBy - ORDER BY列表
 * @returns {Array} 排序信息列表
 */
function extractOrderBy(orderBy) {
  if (!orderBy || !orderBy.columns) {
    return [];
  }

  return orderBy.columns.map((item) => ({
    field: extractFieldName(item.column),
    direction: item.direction || "ASC",
  }));
}

/**
 * 提取GROUP BY信息
 * @param {Array} groupBy - GROUP BY列表
 * @returns {Array} 分组字段列表
 */
function extractGroupBy(groupBy) {
  if (!groupBy || !groupBy.columns) {
    return [];
  }

  return groupBy.columns.map((item) => extractFieldName(item));
}

/**
 * 提取字段名
 * @param {Object} node - AST节点
 * @returns {string} 字段名
 */
function extractFieldName(node) {
  if (!node) {
    return null;
  }

  switch (node.type) {
    case "Identifier":
      return node.name;
    case "MemberExpression":
      return `${node.object.name}.${node.property.name}`;
    case "FunctionCall":
      return formatFunctionCall(node);
    default:
      return node.name || "unknown";
  }
}

/**
 * 提取值
 * @param {Object} node - AST节点
 * @returns {any} 值
 */
/**
 * 从AST节点中提取值，支持各种SQL表达式类型
 * @param {Object} node - AST节点
 * @returns {*} 提取的值
 */
function extractValue(node) {
  if (!node) {
    return null;
  }

  switch (node.type) {
    case "Literal":
      return node.value;
      
    case "Identifier":
      return node.name;
      
    case "ColumnReference":
      return node.table ? `${node.table}.${node.name}` : node.name;
      
    case "TableReference":
      return node.name;
      
    case "MemberExpression":
      return `${extractValue(node.object)}.${extractValue(node.property)}`;
      
    case "ArrayExpression":
      return node.elements.map((el) => extractValue(el));
      
    case "BinaryExpression":
      return `${extractValue(node.left)} ${node.operator} ${extractValue(node.right)}`;
      
    case "UnaryExpression":
      return `${node.operator} ${extractValue(node.operand)}`;
      
    case "FunctionCall": {
      const args = node.arguments ? node.arguments.map(arg => extractValue(arg)).join(', ') : '';
      return `${node.name}(${args})`;
    }
      
    case "CaseExpression": {
      let caseStr = "CASE";
      if (node.expression) {
        caseStr += ` ${extractValue(node.expression)}`;
      }
      if (node.whenClauses) {
        for (const whenClause of node.whenClauses) {
          caseStr += ` WHEN ${extractValue(whenClause.condition)} THEN ${extractValue(whenClause.result)}`;
        }
      }
      if (node.elseClause) {
        caseStr += ` ELSE ${extractValue(node.elseClause)}`;
      }
      caseStr += " END";
      return caseStr;
    }
      
    case "WhenClause":
      return `WHEN ${extractValue(node.condition)} THEN ${extractValue(node.result)}`;
      
    case "BetweenRange":
      return `BETWEEN ${extractValue(node.start)} AND ${extractValue(node.end)}`;
      
    case "ValuesList":
      return `(${node.values.map(val => extractValue(val)).join(', ')})`;
      
    case "SubqueryExpression":
      return "(子查询)";
      
    case "Assignment":
      return `${extractValue(node.column)} = ${extractValue(node.value)}`;
      
    // 处理嵌套的子句
    case "WhereClause":
      return extractValue(node.condition);
      
    case "FromClause":
      return node.tables ? node.tables.map(table => extractValue(table)).join(', ') : '';
      
    case "JoinClause":
      return `${node.joinType} ${extractValue(node.table)}${node.condition ? ` ON ${extractValue(node.condition)}` : ''}`;
      
    case "OrderByColumn":
      return `${extractValue(node.column)} ${node.direction}`;
      
    case "LimitClause":
      return node.offset ? `LIMIT ${node.offset}, ${node.count}` : `LIMIT ${node.count}`;
      
    // 处理特殊值
    case "NullLiteral":
      return null;
      
    case "BooleanLiteral":
      return node.value;
      
    case "NumericLiteral":
      return node.value;
      
    case "StringLiteral":
      return node.value;
      
    default:
      // 尝试从常见属性中提取值
      if (node.value !== undefined) {
        return node.value;
      }
      if (node.name !== undefined) {
        return node.name;
      }
      if (node.text !== undefined) {
        return node.text;
      }
      
      // 如果是对象且有子属性，尝试递归处理
      if (typeof node === 'object' && node !== null) {
        // 对于未知类型，返回类型名称以便调试
        return `[${node.type || 'Unknown'}]`;
      }
      
      return "unknown";
  }
}

/**
 * 获取条件类型
 * @param {string} operator - 操作符
 * @param {Object} _value - 值节点
 * @returns {string} 条件类型
 */
function getConditionType(operator, _value) {
  switch (operator) {
    case "=":
    case "!=":
    case "<>":
      return "equality";
    case ">":
    case "<":
    case ">=":
    case "<=":
      return "comparison";
    case "LIKE":
    case "ILIKE":
      return "pattern";
    case "IN":
      return "list";
    case "BETWEEN":
      return "range";
    default:
      return "other";
  }
}

/**
 * 判断是否为聚合函数
 * @param {string} functionName - 函数名
 * @returns {boolean} 是否为聚合函数
 */
function isAggregateFunction(functionName) {
  const aggregateFunctions = [
    "COUNT",
    "SUM",
    "AVG",
    "MAX",
    "MIN",
    "GROUP_CONCAT",
  ];
  return aggregateFunctions.includes(functionName.toUpperCase());
}

/**
 * 格式化函数调用
 * @param {Object} functionCall - 函数调用节点
 * @returns {string} 格式化后的函数调用
 */
function formatFunctionCall(functionCall) {
  const args = functionCall.arguments
    .map((arg) => extractFieldName(arg))
    .join(", ");
  return `${functionCall.name}(${args})`;
}

/**
 * 分析查询复杂度
 * @param {Object} analysisResult - 分析结果
 * @returns {Object} 复杂度信息
 */
export function analyzeQueryComplexity(analysisResult) {
  const complexity = {
    level: "simple",
    score: 0,
    factors: [],
  };

  // 条件数量
  if (analysisResult.conditions.length > 0) {
    complexity.score += analysisResult.conditions.length * 2;
    complexity.factors.push(`${analysisResult.conditions.length}个查询条件`);
  }

  // 表数量
  if (analysisResult.tables.length > 1) {
    complexity.score += (analysisResult.tables.length - 1) * 3;
    complexity.factors.push(`${analysisResult.tables.length}个表`);
  }

  // JOIN数量
  if (analysisResult.joins.length > 0) {
    complexity.score += analysisResult.joins.length * 4;
    complexity.factors.push(`${analysisResult.joins.length}个JOIN`);
  }

  // 聚合函数
  const aggregateFields = analysisResult.fields.filter((f) => f.aggregation);
  if (aggregateFields.length > 0) {
    complexity.score += aggregateFields.length * 2;
    complexity.factors.push(`${aggregateFields.length}个聚合函数`);
  }

  // 分组
  if (analysisResult.groupBy.length > 0) {
    complexity.score += 3;
    complexity.factors.push("GROUP BY");
  }

  // 排序
  if (analysisResult.orderBy.length > 0) {
    complexity.score += 2;
    complexity.factors.push("ORDER BY");
  }

  // 确定复杂度级别
  if (complexity.score <= 5) {
    complexity.level = "simple";
  } else if (complexity.score <= 15) {
    complexity.level = "medium";
  } else {
    complexity.level = "complex";
  }

  return complexity;
}
