# 贡献指南

感谢您考虑为 TSone 框架做出贡献！本指南将帮助您了解如何参与项目开发。

## 开发环境设置

### 克隆仓库

```bash
git clone https://github.com/yourusername/tsone.git
cd tsone
```

### 安装依赖

```bash
bun install
```

### 运行开发服务器

```bash
bun run dev
```

### 构建项目

```bash
bun run build
```

### 运行代码检查

```bash
bun run lint
```

## 代码规范

### TypeScript

- 使用 TypeScript 进行开发
- 遵循项目的 TypeScript 配置
- 确保类型定义完整

### 代码风格

- 遵循项目的 ESLint 配置
- 使用 Prettier 格式化代码
- 保持代码风格一致

### 命名约定

- 类名使用 PascalCase
- 函数名和变量名使用 camelCase
- 常量使用 UPPER_SNAKE_CASE
- 文件和目录名使用 kebab-case

## 提交规范

### Commit 消息格式

我们使用 Conventional Commits 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码风格修改
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例

```
feat(router): 添加路由守卫功能

fix(core): 修复响应式系统的内存泄漏问题

docs: 更新组件 API 文档
```

## 开发流程

### 1. 创建分支

从 `main` 分支创建新分支：

```bash
git checkout -b feature/your-feature-name
```

### 2. 开发功能

- 实现功能
- 编写测试
- 确保代码通过 lint 检查

### 3. 提交代码

```bash
git add .
git commit -m "feat: 描述你的功能"
```

### 4. 推送分支

```bash
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

- 前往 GitHub 仓库
- 点击 "New Pull Request"
- 选择你的分支
- 填写描述
- 提交 Pull Request

## 测试

### 编写测试

为新功能和 bug 修复编写测试：

```bash
# 运行测试
bun test
```

### 测试覆盖

尽量保持高测试覆盖率，确保代码质量。

## 文档

### 更新文档

当你添加新功能或修改现有功能时，请更新相应的文档：

- 更新 API 文档
- 更新指南文档
- 更新示例代码

### 文档格式

- 使用 Markdown 格式
- 保持文档清晰、简洁
- 提供示例代码

## 问题报告

### Bug 报告

当你发现 bug 时，请提交一个 issue，包含以下信息：

- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息
- 可能的解决方案

### 功能请求

如果你有功能请求，请提交一个 issue，包含以下信息：

- 功能描述
- 为什么需要这个功能
- 可能的实现方案

## 行为准则

我们希望所有参与者都能遵循以下行为准则：

- 尊重他人
- 接受建设性批评
- 关注社区的最佳利益
- 友善和耐心

## 沟通渠道

- GitHub Issues: 用于 bug 报告和功能请求
- GitHub Discussions: 用于讨论和问题解答

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

## 感谢

再次感谢你的贡献！你的参与将帮助 TSone 变得更好。
