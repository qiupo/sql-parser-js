# 更新日志 / Changelog

本文档记录了 SQL Parser JS 项目的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布] - Unreleased

### 新增 Added
- 待添加的新功能

### 更改 Changed
- 待更改的现有功能

### 修复 Fixed
- 待修复的 bug

## [1.0.0] - 2024-01-XX

### 新增 Added
- 🎉 **核心解析器**: 支持基本 SQL 语句解析（SELECT、INSERT、UPDATE、DELETE）
- 🌳 **AST 生成**: 生成结构化的抽象语法树
- 🔍 **查询分析器**: 提供智能查询分析功能
- 📝 **TypeScript 支持**: 完整的 TypeScript 类型定义
- 🧪 **测试覆盖**: 超过 80% 的测试覆盖率
- 📚 **完整文档**: API 文档、示例和开发指南
- 🔧 **多种构建格式**: 支持 ES Module、CommonJS 和 UMD
- 🌐 **浏览器兼容**: 支持现代浏览器和 Node.js 环境

### 支持的 SQL 语法 Supported SQL Syntax
- **SELECT 语句**: 基本查询、WHERE 条件、JOIN 操作、聚合函数
- **INSERT 语句**: 单行和多行插入
- **UPDATE 语句**: 条件更新
- **DELETE 语句**: 条件删除
- **数据类型**: 字符串、数字、布尔值、NULL
- **操作符**: 算术、比较、逻辑操作符
- **函数**: 常用 SQL 函数支持

### 技术特性 Technical Features
- 🚀 **高性能**: 优化的词法分析器和解析器
- 🔌 **可扩展**: 插件系统支持自定义语法
- 🛡️ **错误处理**: 详细的错误信息和位置定位
- 📊 **性能监控**: 内置性能分析工具
- 🎯 **零依赖**: 无外部运行时依赖

---

## 版本说明 Version Notes

### 语义化版本控制
- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 发布周期
- **主版本**: 根据需要发布
- **次版本**: 每月发布
- **修订版本**: 根据 bug 修复需要发布

### 支持政策
- **当前版本**: 完全支持
- **前一个主版本**: 安全更新和重要 bug 修复
- **更早版本**: 不再维护

---

## 贡献指南 Contributing

如果您想为此项目做出贡献，请查看我们的 [贡献指南](CONTRIBUTING.md)。

## 许可证 License

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。