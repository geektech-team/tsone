# TSone 框架能力完善设计

## 背景与目标

TSone 已提供响应式状态、类组件、策略化 DOM 渲染、基础 `directions.if`、
`directions.model` 与 keyed 子节点更新。本次按依赖顺序完善三类基础能力：

1. 条件与列表渲染；
2. 组件通信；
3. 表单绑定与轻量校验。

设计保持浏览器运行时零外部依赖、类组件模型和策略化渲染架构，不引入 JSX、
模板编译、SSR、大型表单框架或全局状态单例。

## 总体架构

能力分别落在已有的单一职责边界中：

| 能力 | 所属边界 | 关系 |
| --- | --- | --- |
| 条件与列表渲染 | VNode 类型与渲染策略 | `RendererContext` 依赖并分派策略 |
| 组件通信 | `Component` 与组件渲染策略 | 父组件聚合子组件；子组件经接口访问上层依赖 |
| 表单绑定 | 独立的表单绑定和校验模块 | 元素渲染策略依赖绑定模块 |

条件切换和列表删除必须经既有卸载链执行，使组件、副作用和 DOM 监听器均可清理。
依赖注入从组件树向上解析，应用实例作为根提供者。

## 第一批：条件与列表渲染

### 公共 API

保留并扩展现有的 `directions.if`：

```ts
{
  component: UserPanel,
  directions: { if: this.state.visible },
}
```

新增列表 helper：

```ts
each<T>(
  items: readonly T[],
  render: (item: T, index: number) => VNode | string,
  key: (item: T, index: number) => string | number
): Array<VNode | string>;
```

`each` 为每个 VNode 写入稳定 key；渲染过程继续由现有 keyed diff 完成。手写
`items.map(...)` 仍完全兼容。

### 更新语义

- `directions.if` 支持 HTML 元素、组件和插槽节点。
- 条件为 `false` 时渲染注释锚点；切换分支时执行标准挂载或卸载流程。
- 重复 key 抛出明确错误。
- keyed 与非 keyed 子节点混用时按位置安全更新，而不进行部分 keyed 复用。
- 现有元素级 `directions.if` 行为保持兼容。

### 测试

覆盖条件组件卸载、列表重排时的 DOM/组件状态复用、插入删除、重复 key，以及
旧的 `map` 写法。

## 第二批：组件通信

### 事件和 props

```ts
const off = child.on('saved', handleSaved);
off();

{
  component: Editor,
  emitters: {
    saved: (result) => this.handleSaved(result),
  },
}
```

- `on(eventName, listener)` 返回取消订阅函数；`off` 保持兼容。
- 组件 VNode patch 时同步 emitters：清除已移除监听器、替换变化的监听器、保留未变更监听器。
- 同类组件 patch 时 props 更新只触发一次组件渲染。
- 卸载组件时清空其事件与提供值。

### 依赖注入

```ts
this.provide(THEME_KEY, { mode: 'dark' });
const theme = this.inject(THEME_KEY, defaultTheme);
```

- `provide` 和 `inject` 使用 `string | symbol` key。
- 组件提供的值仅对自身后代可见；查询沿父链向上，最后查应用级 provider。
- `OneApp` 同样提供 `provide` 和 `inject`，作为根依赖源。
- 保留现有 router app context，不迁移其既有访问方式。

### 测试

覆盖事件替换与解绑、props 单次更新、组件 provider 对应用 provider 的遮蔽、
symbol key 和卸载后的事件清理。

## 第三批：表单绑定与轻量校验

### 模型绑定

保留字符串路径，也支持带转换器的绑定描述：

```ts
Input({ directions: { model: 'profile.name' } });

Input({
  props: { type: 'number' },
  directions: {
    model: {
      path: 'profile.age',
      parse: (value) => Number(value),
      format: (value) => String(value ?? ''),
    },
  },
});
```

- input 和 textarea 使用 `value` / `input`。
- checkbox 支持布尔值和数组值；radio 使用 `checked` / `value`。
- select 支持单选和 `multiple` 多选。
- 点分隔路径只允许自有对象属性；写入时创建缺失的中间对象，非法路径抛出错误。
- 每次 patch 清理被替换的 model effect 和监听器。

### 校验

校验保持纯函数和无 UI 约束：

```ts
const form = createForm(this.state, {
  'profile.name': [required('请输入姓名'), minLength(2)],
  'profile.age': [
    required(),
    validate((value) => Number(value) >= 18 || '年龄须不小于 18'),
  ],
});

const result = form.validate();
// { valid: false, errors: { 'profile.name': ['请输入姓名'] } }
```

`createForm()` 返回 `validate()`、`validateField(path)`、`errors` 和
`resetErrors()`。框架不渲染错误 UI，也不管理提交或网络请求。

### 测试

覆盖四类原生控件、嵌套路径、parse/format、模型路径切换后的清理，以及规则的
成功、失败和异常结果。

## 非目标

- JSX、模板编译器、SSR 或构建链改造；
- 路由守卫、devtools、全局状态库；
- 表单组件库、异步提交编排或默认错误 UI；
- 对现有 monorepo 迁移改动的重构。
