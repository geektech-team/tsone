# One UI

One UI（`@geektech/one`）是面向 TSone 类组件框架的轻量级、无额外运行时依赖
UI 组件库。TSone 是它的 peer dependency，使用 One UI 的应用必须同时安装
TSone。

## 安装

```bash
bun add @geektech/tsone @geektech/one
```

## 快速开始

```ts
import {
  Component,
  createApp,
  createComponent,
  type VNode,
} from '@geektech/tsone';
import { OneButton, OneCard, OneInput } from '@geektech/one';

class App extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'main',
      children: [
        createComponent(OneButton, {}, ['保存']),
        createComponent(OneInput, { placeholder: '项目名称' }),
        createComponent(OneCard, { title: 'One UI' }, [
          '为 TSone 提供轻量级组件。',
        ]),
      ],
    };
  }
}

createApp({ root: App }).mount();
```

## 按钮变体、尺寸、加载状态和事件

`OneButton` 提供 `primary`、`secondary`、`danger` 三种变体，以及 `sm`、
`md`、`lg` 三种尺寸。加载状态下按钮会被禁用并带有 `aria-busy`。

```ts
import { OneButton } from '@geektech/one';

const button = new OneButton({
  variant: 'danger',
  size: 'lg',
  loading: false,
  children: ['删除'],
});

button.on('click', (event) => {
  console.log('已点击', event);
  button.setProps({ loading: true });
});
button.mount(document.querySelector('#actions') as HTMLElement);
```

## 受控与非受控输入框

受控输入框传入 `value`，收到事件后通过 `setProps` 接受新值；非受控输入框传入
`defaultValue`，值由 One UI 自己维护。

```ts
import { OneInput, type OneInputValueEvent } from '@geektech/one';

const controlled = new OneInput({ value: 'one' });
controlled.on('input', (payload) => {
  const event = payload as OneInputValueEvent;
  controlled.setProps({ value: event.value });
});

const uncontrolled = new OneInput({ defaultValue: '草稿' });
uncontrolled.on('change', (payload) => {
  const event = payload as OneInputValueEvent;
  console.log(event.value, event.originalEvent);
});
```

## 卡片插槽

带有 `slot: 'header'` 或 `slot: 'footer'` 的子节点进入对应命名插槽，未指定
slot 的子节点进入默认内容区。

```ts
import { createComponent } from '@geektech/tsone';
import { OneCard } from '@geektech/one';

const card = createComponent(OneCard, {}, [
  { tag: 'h2', slot: 'header', children: ['账户'] },
  { tag: 'p', children: ['默认插槽内容'] },
  { tag: 'button', slot: 'footer', children: ['继续'] },
]);
```

## 主题覆盖

One UI 样式限定在 `.one-*` 选择器中。可以在应用容器或 `:root` 上覆盖公开
CSS 变量：

```css
.my-app {
  --one-color-primary: #326bff;
  --one-radius-md: 12px;
}
```

对应的默认回退值也可以从 `ONE_THEME_DEFAULTS` 读取。

## 开发

```bash
bun install
bun test packages/one
bunx tsc --noEmit --project packages/one/tsconfig.json
bun run --cwd packages/one build
```

在仓库根目录运行完整发布前检查：

```bash
bun test packages/one/tests/package-contract.test.ts packages/one/tests/component-types.test.ts packages/one/tests/style-contract.test.ts packages/one/tests/package-smoke.test.ts && bunx tsc --noEmit --project packages/one/tsconfig.json && bun run --cwd packages/one build && bun pm pack --cwd packages/one --dry-run
```
