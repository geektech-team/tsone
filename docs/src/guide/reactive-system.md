# 响应式系统

TSone 的响应式系统是框架的核心特性之一，它允许您创建响应式状态，并在状态变化时自动更新UI。本文档将详细介绍响应式系统的工作原理和使用方法。

## 核心概念

### 响应式对象

响应式对象是通过 `reactive` 函数创建的特殊对象，当您访问或修改其属性时，框架会自动跟踪依赖关系并触发相应的更新。

### 副作用函数

副作用函数是通过 `effect` 函数创建的函数，它会在其依赖的响应式属性发生变化时自动重新执行。

### 依赖追踪

当副作用函数执行时，它会访问响应式对象的属性，框架会记录这些依赖关系。当响应式对象的属性发生变化时，框架会通知所有依赖该属性的副作用函数重新执行。

## 核心 API

### reactive

`reactive` 函数用于创建响应式对象：

```typescript
import { reactive } from 'tsone';

// 创建响应式对象
const state = reactive({
  count: 0,
  user: {
    name: 'John',
    age: 30
  }
});

// 访问属性（会被追踪）
console.log(state.count); // 0

// 修改属性（会触发更新）
state.count = 1;
```

### effect

`effect` 函数用于创建副作用函数：

```typescript
import { reactive, effect } from 'tsone';

const state = reactive({
  count: 0
});

// 创建副作用函数
effect(() => {
  console.log(`Count: ${state.count}`);
});

// 输出: Count: 0

// 修改属性，触发副作用函数重新执行
state.count = 1;
// 输出: Count: 1

state.count = 2;
// 输出: Count: 2
```

### computed

`computed` 函数用于创建计算属性，它会缓存计算结果，只有当依赖的响应式属性发生变化时才会重新计算：

```typescript
import { reactive, computed } from 'tsone';

const state = reactive({
  count: 0
});

// 创建计算属性
const doubleCount = computed(() => {
  console.log('Computing doubleCount...');
  return state.count * 2;
});

// 访问计算属性（首次计算）
console.log(doubleCount.value); // 输出: Computing doubleCount... 0

// 再次访问（从缓存获取）
console.log(doubleCount.value); // 输出: 0

// 修改依赖属性，触发重新计算
state.count = 1;
console.log(doubleCount.value); // 输出: Computing doubleCount... 2
```

### readonly

`readonly` 函数用于创建只读响应式对象，您可以访问其属性，但不能修改它们：

```typescript
import { reactive, readonly } from 'tsone';

const original = reactive({
  count: 0
});

// 创建只读代理
const readOnlyState = readonly(original);

// 访问属性（正常）
console.log(readOnlyState.count); // 0

// 尝试修改属性（会被阻止并警告）
readOnlyState.count = 1; // 警告: Cannot set property count on readonly object
console.log(readOnlyState.count); // 0

// 修改原始对象，只读代理会反映变化
original.count = 1;
console.log(readOnlyState.count); // 1
```

## 响应式原理

TSone 的响应式系统基于 JavaScript 的 Proxy 对象实现：

1. 当您通过 `reactive` 创建响应式对象时，框架会返回一个 Proxy 对象
2. 当您访问响应式对象的属性时，Proxy 的 `get` 陷阱会被触发，框架会记录当前正在执行的副作用函数作为依赖
3. 当您修改响应式对象的属性时，Proxy 的 `set` 陷阱会被触发，框架会通知所有依赖该属性的副作用函数重新执行

### 依赖追踪过程

1. 执行 `effect` 函数，将其设置为当前活动的副作用函数
2. 执行副作用函数内部的代码，访问响应式对象的属性
3. 响应式对象的 `get` 陷阱被触发，记录当前副作用函数为该属性的依赖
4. 副作用函数执行完成，清除当前活动的副作用函数
5. 当响应式对象的属性发生变化时，触发 `set` 陷阱
6. 通知所有依赖该属性的副作用函数重新执行

## 高级用法

### 嵌套响应式对象

TSone 的响应式系统支持嵌套对象，当您访问嵌套对象的属性时，框架会自动将其转换为响应式对象：

```typescript
const state = reactive({
  user: {
    name: 'John',
    address: {
      city: 'New York',
      zipCode: '10001'
    }
  }
});

// 访问嵌套属性（会被自动转换为响应式）
effect(() => {
  console.log(`${state.user.name} lives in ${state.user.address.city}`);
});

// 修改嵌套属性，会触发更新
state.user.address.city = 'Los Angeles';
// 输出: John lives in Los Angeles
```

### 数组响应式

TSone 的响应式系统也支持数组，包括数组的变异方法（如 `push`、`pop`、`splice` 等）：

```typescript
const state = reactive({
  items: ['Item 1', 'Item 2']
});

effect(() => {
  console.log(`Items: ${state.items.join(', ')}`);
  console.log(`Length: ${state.items.length}`);
});

// 输出: Items: Item 1, Item 2
// 输出: Length: 2

// 使用数组变异方法
state.items.push('Item 3');
// 输出: Items: Item 1, Item 2, Item 3
// 输出: Length: 3

// 修改数组索引
state.items[0] = 'Updated Item 1';
// 输出: Items: Updated Item 1, Item 2, Item 3
// 输出: Length: 3
```

### 条件依赖

副作用函数可以包含条件逻辑，框架会根据实际执行路径追踪依赖：

```typescript
const state = reactive({
  showCount: true,
  count: 0,
  message: 'Hello'
});

effect(() => {
  console.log('Effect running...');
  if (state.showCount) {
    console.log(`Count: ${state.count}`);
  } else {
    console.log(`Message: ${state.message}`);
  }
});

// 输出: Effect running...
// 输出: Count: 0

// 修改 count（会触发更新，因为当前依赖 count）
state.count = 1;
// 输出: Effect running...
// 输出: Count: 1

// 修改 showCount（会触发更新，并改变依赖）
state.showCount = false;
// 输出: Effect running...
// 输出: Message: Hello

// 修改 count（不会触发更新，因为现在不依赖 count）
state.count = 2;
// 无输出

// 修改 message（会触发更新，因为现在依赖 message）
state.message = 'Hello World';
// 输出: Effect running...
// 输出: Message: Hello World
```

### 清除副作用

您可以通过 `stop` 函数停止副作用函数的执行：

```typescript
import { reactive, effect, stop } from 'tsone';

const state = reactive({
  count: 0
});

const effectFn = effect(() => {
  console.log(`Count: ${state.count}`);
});

// 输出: Count: 0

state.count = 1;
// 输出: Count: 1

// 停止副作用
stop(effectFn);

// 不会再触发更新
state.count = 2;
// 无输出
```

## 最佳实践

### 状态设计

1. **集中管理状态**：对于复杂应用，考虑使用集中式状态管理
2. **最小化响应式状态**：只将需要响应式更新的属性放在响应式对象中
3. **合理组织状态结构**：根据功能模块组织状态，避免过深的嵌套

### 性能优化

1. **使用计算属性**：对于复杂的计算逻辑，使用 `computed` 缓存计算结果
2. **避免在副作用中执行昂贵操作**：副作用函数应该尽量轻量
3. **合理使用 readonly**：对于不需要修改的状态，使用 `readonly` 可以提高性能

### 常见陷阱

1. **直接替换响应式对象**：不要直接替换整个响应式对象，这会丢失响应性

   ```typescript
   // 错误做法
   let state = reactive({ count: 0 });
   state = reactive({ count: 1 }); // 丢失之前的依赖关系

   // 正确做法
   const state = reactive({ count: 0 });
   state.count = 1;
   ```

2. **在副作用中修改响应式状态**：这可能导致无限循环

   ```typescript
   // 错误做法
   const state = reactive({ count: 0 });
   effect(() => {
     state.count++; // 会导致无限循环
   });
   ```

3. **忽略嵌套对象的响应性**：嵌套对象会自动转换为响应式对象，不需要手动处理

   ```typescript
   const state = reactive({});
   // 正确做法：直接赋值
   state.user = { name: 'John' };
   // state.user 会自动变为响应式对象
   ```

## 与组件系统集成

在 TSone 组件中，您可以通过 `initState()` 方法初始化响应式状态：

```typescript
import { Component } from 'tsone';

class CounterComponent extends Component {
  protected initState() {
    return {
      count: 0
    };
  }

  protected render() {
    return {
      tag: 'div',
      children: [
        { tag: 'h1', children: [`Count: {{count}}`] },
        {
          tag: 'button',
          listeners: { click: () => this.state.count++ },
          children: ['Increment']
        }
      ]
    };
  }
}
```

当您修改 `this.state` 中的属性时，组件会自动重新渲染，因为组件的 `render` 方法被包装在一个副作用函数中。

## 总结

TSone 的响应式系统提供了一种简洁、高效的方式来管理应用状态，并在状态变化时自动更新UI。通过理解和掌握响应式系统的工作原理和使用方法，您可以创建更加灵活、高效的应用。

如果您想了解更多关于响应式系统的细节，请参考 [API 参考](/api/reactive.md) 文档。
