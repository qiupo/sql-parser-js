# 发布指南 / Release Guide

本文档介绍如何使用 GitHub Actions 自动发布 SQL Parser JS 到 npm。

## 🚀 发布方式

### 1. 自动发布 (推荐)

#### 标签发布
当您推送一个以 `v` 开头的标签时，会自动触发发布流程：

```bash
# 创建并推送标签
git tag v1.0.1
git push origin v1.0.1
```

#### 手动触发发布
在 GitHub 仓库页面：
1. 点击 "Actions" 标签
2. 选择 "Manual Release" 工作流
3. 点击 "Run workflow"
4. 选择版本类型和其他选项
5. 点击 "Run workflow" 按钮

### 2. 本地发布

#### 使用 npm scripts
```bash
# 发布补丁版本 (1.0.0 -> 1.0.1)
npm run release

# 发布次要版本 (1.0.0 -> 1.1.0)
npm run release:minor

# 发布主要版本 (1.0.0 -> 2.0.0)
npm run release:major

# 发布 beta 版本 (1.0.0 -> 1.0.1-beta.0)
npm run release:beta

# 发布 alpha 版本 (1.0.0 -> 1.0.1-alpha.0)
npm run release:alpha
```

## 📋 发布前检查清单

### 必须完成的项目
- [ ] 所有测试通过 (`npm test`)
- [ ] 代码风格检查通过 (`npm run lint`)
- [ ] 构建成功 (`npm run build`)
- [ ] 更新 `CHANGELOG.md`
- [ ] 更新版本相关文档
- [ ] 确认 `package.json` 中的信息正确

### 推荐完成的项目
- [ ] 运行性能测试 (`npm run test:performance`)
- [ ] 检查安全漏洞 (`npm audit`)
- [ ] 更新示例代码
- [ ] 更新 API 文档

## 🔧 配置要求

### GitHub Secrets
在 GitHub 仓库设置中添加以下 secrets：

1. **NPM_TOKEN** (必需)
   - 访问 [npm 官网](https://www.npmjs.com/)
   - 登录您的账户
   - 点击头像 -> "Access Tokens"
   - 创建新的 "Automation" 类型 token
   - 将 token 添加到 GitHub Secrets

2. **GITHUB_TOKEN** (自动提供)
   - GitHub 自动提供，无需手动配置

### npm 配置
确保您的 npm 账户有发布权限：

```bash
# 登录 npm
npm login

# 检查登录状态
npm whoami

# 检查包名是否可用
npm view sql-parser-js
```

## 📦 发布流程

### 自动发布流程
1. **触发条件**：推送标签或手动触发
2. **环境准备**：安装依赖、配置 Node.js
3. **质量检查**：运行测试、代码检查
4. **构建项目**：生成发布文件
5. **发布到 npm**：上传到 npm 仓库
6. **创建 GitHub Release**：生成发布说明
7. **通知完成**：发送成功通知

### 版本号规则
遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **主版本号** (MAJOR)：不兼容的 API 修改
- **次版本号** (MINOR)：向下兼容的功能性新增
- **修订号** (PATCH)：向下兼容的问题修正
- **预发布版本**：1.0.0-alpha.1, 1.0.0-beta.1

### 发布标签
- **latest** (默认)：稳定版本
- **beta**：测试版本
- **alpha**：开发版本

## 🧪 测试发布

### Dry Run 模式
使用手动发布工作流的 "Dry run" 选项：
1. 勾选 "Dry run" 选项
2. 运行工作流
3. 检查输出日志，确认版本号正确
4. 不会实际发布到 npm

### 本地测试
```bash
# 打包测试
npm pack

# 检查打包内容
tar -tzf sql-parser-js-*.tgz

# 本地安装测试
npm install ./sql-parser-js-*.tgz
```

## 🔍 故障排除

### 常见问题

#### 1. npm 发布失败
```
Error: 403 Forbidden - PUT https://registry.npmjs.org/sql-parser-js
```
**解决方案**：
- 检查 NPM_TOKEN 是否正确
- 确认包名未被占用
- 检查 npm 账户权限

#### 2. 版本号冲突
```
Error: Version 1.0.0 already exists
```
**解决方案**：
- 使用不同的版本号
- 检查 npm 上的现有版本

#### 3. 测试失败
```
Error: Tests failed
```
**解决方案**：
- 本地运行 `npm test` 检查
- 修复失败的测试
- 重新提交代码

#### 4. 构建失败
```
Error: Build failed
```
**解决方案**：
- 本地运行 `npm run build` 检查
- 检查构建配置文件
- 确认所有依赖已安装

### 调试步骤
1. 检查 GitHub Actions 日志
2. 本地复现问题
3. 检查配置文件
4. 验证环境变量
5. 联系维护者

## 📊 发布统计

### 发布频率建议
- **补丁版本**：每周或根据 bug 修复需要
- **次要版本**：每月或每季度
- **主要版本**：每年或重大变更时

### 发布时机
- **工作日发布**：便于及时处理问题
- **避免节假日**：确保团队可用
- **预告重大变更**：提前通知用户

## 📞 支持

如果在发布过程中遇到问题：
1. 查看 [GitHub Issues](https://github.com/qiupo/sql-parser-js/issues)
2. 创建新的 issue 描述问题
3. 联系项目维护者

---

## 📚 相关文档
- [贡献指南](../CONTRIBUTING.md)
- [更新日志](../CHANGELOG.md)
- [API 文档](API.md)
- [npm 发布文档](https://docs.npmjs.com/cli/v9/commands/npm-publish)