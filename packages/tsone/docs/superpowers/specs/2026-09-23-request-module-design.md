# TSone Request 模块设计

## 目标

为 `@geektech/tsone` 提供零运行时依赖的浏览器请求模块。它以原生
`fetch` 为传输层，默认解析 JSON，并支持请求前、响应成功和响应失败三个
拦截阶段。

## 非目标

首版不提供重试、超时包装、缓存、取消包装、全局配置或服务端专用行为。
原生 `fetch` 的其余选项（例如 `signal`）直接透传。

## 公开 API

模块由 `@geektech/tsone/request` 导入，根入口不再重复导出：

```ts
import { createRequest, request } from '@geektech/tsone/request';

const api = createRequest({ baseURL: '/api' });

api.interceptors.request.use((config) => ({
  ...config,
  headers: { ...config.headers, Authorization: 'Bearer token' },
}));

const user = await api.get<User>('/users/1');
const health = await api.get('/health', { responseType: 'text' });
```

`createRequest(defaultConfig?)` 创建独立客户端；`request` 是默认客户端实例。
客户端提供 `request`、`get`、`post`、`put`、`patch` 和 `delete` 快捷方法。
`RequestConfig` 包含 `baseURL`、URL、原生 `RequestInit` 字段与
`responseType`。`responseType` 为 `'json' | 'text' | 'blob' | 'arrayBuffer' |
'response'`，默认值为 `'json'`。

## 模块边界与对象关系

`RequestClient` 组合三个 `InterceptorManager` 实例，并依赖浏览器的
`fetch` 实现。它只负责合并配置、执行管线和解析响应。
`InterceptorManager<T>` 实现一个受限的注册/注销接口，维护某一阶段的
有序处理器；它不理解 HTTP 或调用方数据。`RequestError` 承载失败的
`RequestConfig` 与可选 `Response`。这些边界遵循单一职责和依赖倒置：
调用者面向导出的类型和工厂，不接触拦截器内部存储。

目录形状如下：

```
lib/request/
  index.ts
  types.ts
  InterceptorManager.ts
  RequestClient.ts
  RequestError.ts
  __tests__/request.test.ts
```

包 `exports` 新增 `./request`，构建产物同时包含该子路径的 JavaScript 和声明。

## 执行与错误语义

1. 合并实例默认配置与本次配置，并以 `baseURL` 解析相对 URL。
2. 按注册顺序执行请求拦截器；处理器可同步或异步返回新配置。
3. 调用原生 `fetch`。
4. 非 2xx 响应转换为含 `response` 与 `config` 的 `RequestError`；网络异常也
   进入失败链。
5. 成功响应按 `responseType` 解析，再按注册顺序进入响应成功拦截器。
6. 任一阶段的错误进入响应失败拦截器。失败处理器可抛出（继续失败）或返回
   恢复值（调用成功）。

请求头兼容 `HeadersInit`。合并配置时保留其余原生 `RequestInit` 选项。
`use()` 返回注销函数；注销后，该处理器不再参与后续请求。

## 文档与验证

在中英文 README 与 typed docs 中记录安装路径、默认 JSON 行为、
`responseType` 选项、认证请求拦截器和统一错误恢复示例。

实现遵循 TDD：先运行失败测试，再实现最小代码。测试应覆盖配置/URL 合并、
三个阶段的顺序、异步处理器、非 2xx、网络错误、错误恢复、五种返回类型和
注销行为。发布面变更还需构建包、运行公开 API/包 smoke 测试，并检查包的
dry-run 内容。

## 验收条件

- `createRequest` 的每个实例拥有独立的拦截器集合。
- 默认调用返回 JSON，`responseType` 覆盖解析结果。
- 请求前、响应成功、响应失败均可异步执行，且严格按注册顺序运行。
- 非 2xx 与网络失败可由失败拦截器观察和恢复。
- 发布后的 `@geektech/tsone/request` 可以解析并具有类型声明。
