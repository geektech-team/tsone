import { Component, VNode, computed } from '../../lib';
import { StyleOptions } from '../../lib/style/StyleManager';

export interface CounterProps {
  initialCount?: number;
  step?: number;
}

interface CounterState {
  count: number;
}

export class Counter extends Component<CounterProps, CounterState> {
  // 计算属性
  private doubleCount = computed(() => this.state.count * 2);

  constructor(props?: CounterProps) {
    super(props || {});
    // 初始化状态
    this.state.count = this.props?.initialCount || 0;
  }

  // 初始化状态
  protected initState(): CounterState {
    return {
      count: 0,
    };
  }

  protected initStyles(): void {
    const counterStyles: StyleOptions = {
      selector: '.counter',
      properties: {
        maxWidth: '400px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        textAlign: 'center',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
      media: {
        '(max-width: 768px)': {
          maxWidth: '100%',
          margin: '10px',
          padding: '15px',
        },
      },
    };

    const buttonStyles: StyleOptions = {
      selector: '.counter button',
      properties: {
        padding: '8px 16px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        margin: '0 5px',
        fontSize: '16px',
        transition: 'background-color 0.3s ease',
      },
      hover: {
        background: '#45a049',
      },
    };

    const countStyles: StyleOptions = {
      selector: '.counter-count',
      properties: {
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#333',
        margin: '20px 0',
      },
    };

    const doubleCountStyles: StyleOptions = {
      selector: '.double-count',
      properties: {
        fontSize: '18px',
        color: '#666',
        marginTop: '10px',
      },
    };

    this.styleManager.addStyle('counter', counterStyles);
    this.styleManager.addStyle('button', buttonStyles);
    this.styleManager.addStyle('count', countStyles);
    this.styleManager.addStyle('double-count', doubleCountStyles);
  }

  /**
   * 增加计数
   */
  private increment(): void {
    const step = this.props.step || 1;
    this.state.count += step;
  }

  /**
   * 减少计数
   */
  private decrement(): void {
    const step = this.props.step || 1;
    this.state.count -= step;
  }

  /**
   * 重置计数
   */
  private reset(): void {
    this.state.count = this.props.initialCount || 0;
  }

  protected render(): VNode {
    return {
      tag: 'div',
      props: {
        className: 'counter',
      },
      children: [
        { tag: 'h2', props: {}, children: ['计数器示例'] },
        {
          tag: 'div',
          props: { className: 'counter-count' },
          children: [String(this.state.count)],
        },
        {
          tag: 'div',
          props: { className: 'double-count' },
          children: [`两倍值: ${this.doubleCount.value}`],
        },
        {
          tag: 'div',
          props: {},
          children: [
            {
              tag: 'button',
              props: {
                onClick: this.decrement.bind(this),
              },
              children: ['-'],
            },
            {
              tag: 'button',
              props: {
                onClick: this.reset.bind(this),
              },
              children: ['重置'],
            },
            {
              tag: 'button',
              props: {
                onClick: this.increment.bind(this),
              },
              children: ['+'],
            },
          ],
        },
      ],
    };
  }

  // 组件生命周期钩子
  public mounted: boolean = false;
  public updated: boolean = false;
  public unmounted: boolean = false;

  public onMounted(): void {
    console.log('Counter组件已挂载');
  }

  public onUpdated(): void {
    console.log('Counter组件已更新', { count: this.state.count });
  }

  public onUnmounted(): void {
    console.log('Counter组件已卸载');
    // 清理可能的副作用
  }
}
