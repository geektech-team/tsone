# 响应式 API

本文档介绍 TSone 响应式系统的 API。

## reactive

`reactive` 函数用于创建响应式对象：

```typescript
import { reactive } from '@geektech/tsone';

const state = reactive({
  count: 0,
  user: {
    name: 'John',
    age: 30,
  },
});
```

### 参数

- `target`: 要转换为响应式的对象

### 返回值

返回响应式代理对象。

### 注意事项

- 只有对象类型可以转换为响应式对象（数组也是对象）
- 原始类型（如数字、字符串、布尔值）不会被转换为响应式对象
- 嵌套对象会自动转换为响应式对象

## effect

`effect` 函数用于创建副作用函数，当依赖的响应式对象发生变化时，副作用函数会自动重新执行：

```typescript
import { reactive, effect } from '@geektech/tsone';

const state = reactive({ count: 0 });

effect(() => {
  console.log(`Count: ${state.count}`);
});

// 输出: Count: 0

state.count = 1;
// 输出: Count: 1
```

### 参数

- `fn`: 副作用函数
- `options`: 选项（可选）
  - `lazy`: 是否懒加载，默认为 `false`
  - `scheduler`: 调度器函数，用于控制副作用函数的执行时机

### 返回值

返回副作用函数对象。

### 示例

#### 懒加载

```typescript
const effectFn = effect(
  () => {
    console.log(`Count: ${state.count}`);
  },
  { lazy: true }
);

// 手动执行
console.log('Before effect execution');
effectFn();
// 输出: Count: 0
```

#### 调度器

```typescript
const state = reactive({ count: 0 });

const effectFn = effect(
  () => {
    console.log(`Count: ${state.count}`);
  },
  {
    scheduler: (effect) => {
      // 使用 setTimeout 延迟执行
      setTimeout(() => {
        effect();
      }, 1000);
    },
  }
);

state.count = 1;
// 1秒后输出: Count: 1
```

## computed

`computed` 函数用于创建计算属性，它会缓存计算结果，只有当依赖的响应式属性发生变化时才会重新计算：

```typescript
import { reactive, computed } from '@geektech/tsone';

const state = reactive({ count: 0 });

const doubleCount = computed(() => {
  console.log('Computing doubleCount...');
  return state.count * 2;
});

console.log(doubleCount.value);
// 输出: Computing doubleCount... 0

console.log(doubleCount.value);
// 输出: 0 (从缓存获取)

state.count = 1;
console.log(doubleCount.value);
// 输出: Computing doubleCount... 2
```

### 参数

- `getter`: 计算函数

### 返回值

返回一个包含 `value` 属性的对象。

### 注意事项

- 计算属性是只读的，修改 `value` 属性不会生效
- 计算属性会自动追踪依赖，当依赖发生变化时会重新计算
- 计算属性会缓存计算结果，提高性能

## readonly

`readonly` 函数用于创建只读响应式对象，您可以访问其属性，但不能修改它们：

```typescript
import { reactive, readonly } from '@geektech/tsone';

const original = reactive({ count: 0 });
const readOnlyState = readonly(original);

console.log(readOnlyState.count);
// 输出: 0

readOnlyState.count = 1;
// 警告: Cannot set property count on readonly object
console.log(readOnlyState.count);
// 输出: 0

// 修改原始对象，只读代理会反映变化
original.count = 1;
console.log(readOnlyState.count);
// 输出: 1
```

### 参数

- `target`: 要转换为只读响应式的对象

### 返回值

返回只读响应式代理对象。

### 注意事项

- 只读响应式对象仍然会追踪依赖，当原始对象发生变化时会更新
- 嵌套对象会自动转换为只读响应式对象

## stop

`stop` 函数用于停止副作用函数的执行：

```typescript
import { reactive, effect, stop } from '@geektech/tsone';

const state = reactive({ count: 0 });

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

### 参数

- `effect`: 要停止的副作用函数

### 返回值

无。

## isReactive

`isReactive` 函数用于检查一个对象是否是响应式对象：

```typescript
import { reactive, isReactive } from '@geektech/tsone';

const state = reactive({ count: 0 });
const normalObj = { count: 0 };

console.log(isReactive(state));
// 输出: true

console.log(isReactive(normalObj));
// 输出: false
```

### 参数

- `value`: 要检查的值

### 返回值

返回布尔值，表示是否是响应式对象。

## isReadonly

`isReadonly` 函数用于检查一个对象是否是只读响应式对象：

```typescript
import { reactive, readonly, isReadonly } from '@geektech/tsone';

const state = reactive({ count: 0 });
const readOnlyState = readonly(state);

console.log(isReadonly(state));
// 输出: false

console.log(isReadonly(readOnlyState));
// 输出: true
```

### 参数

- `value`: 要检查的值

### 返回值

返回布尔值，表示是否是只读响应式对象。

## 示例

### 完整响应式系统示例

```typescript
import {
  reactive,
  effect,
  computed,
  readonly,
  stop,
  isReactive,
  isReadonly,
} from '@geektech/tsone';

// 创建响应式对象
const state = reactive({
  count: 0,
  user: {
    name: 'John',
    age: 30,
  },
});

// 创建计算属性
const doubleCount = computed(() => {
  return state.count * 2;
});

// 创建副作用函数
const effectFn = effect(() => {
  console.log(`Count: ${state.count}`);
  console.log(`Double count: ${doubleCount.value}`);
  console.log(`User: ${state.user.name}, ${state.user.age}`);
});

// 输出:
// Count: 0
// Double count: 0
// User: John, 30

// 修改响应式对象
state.count = 1;
// 输出:
// Count: 1
// Double count: 2
// User: John, 30

// 修改嵌套对象
state.user.name = 'Jane';
// 输出:
// Count: 1
// Double count: 2
// User: Jane, 30

// 检查响应式对象
console.log(isReactive(state));
// 输出: true

console.log(isReactive(state.user));
// 输出: true

// 创建只读响应式对象
const readOnlyState = readonly(state);
console.log(isReadonly(readOnlyState));
// 输出: true

// 尝试修改只读对象
readOnlyState.count = 2;
// 警告: Cannot set property count on readonly object

// 停止副作用
console.log('Stopping effect');
stop(effectFn);

// 不会再触发更新
state.count = 3;
// 无输出
```

## 注意事项

### 响应式对象的限制

1. **直接替换对象**：不要直接替换整个响应式对象，这会丢失响应性

   ```typescript
   // 错误做法
   let state = reactive({ count: 0 });
   state = reactive({ count: 1 }); // 丢失之前的依赖关系

   // 正确做法
   const state = reactive({ count: 0 });
   state.count = 1;
   ```

2. **添加新属性**：对于 ES6+，Proxy 可以拦截新属性的添加

   ```typescript
   const state = reactive({});
   state.count = 0; // 会被追踪
   ```

3. **数组操作**：数组的变异方法（如 `push`、`pop`、`splice` 等）会被拦截

   ```typescript
   const state = reactive({ items: [] });
   state.items.push('item'); // 会被追踪
   ```

### 副作用函数的限制

1. **无限循环**：不要在副作用函数中修改依赖的响应式对象，这会导致无限循环

   ```typescript
   // 错误做法
   const state = reactive({ count: 0 });
   effect(() => {
     state.count++; // 会导致无限循环
   });
   ```

2. **依赖收集**：副作用函数执行时会收集依赖，因此要确保在副作用函数中访问所有需要追踪的响应式属性

   ```typescript
   const state = reactive({ count: 0, show: true });
   effect(() => {
     if (state.show) {
       console.log(`Count: ${state.count}`);
     }
   });

   state.count = 1; // 会触发更新
   state.show = false; // 会触发更新
   state.count = 2; // 不会触发更新，因为 show 为 false
   ```

## 总结

响应式 API 是 TSone 的核心特性之一，通过 `reactive`、`effect`、`computed` 等函数，您可以创建响应式状态，并在状态变化时自动更新 UI。通过理解和掌握这些 API，您可以创建更加灵活、高效的应用。
