import { Component } from '../component';
import { isHTMLNode, type VNode } from '../vnode';

export type TransitionPhase =
  'idle' | 'enter-from' | 'enter-to' | 'leave-from' | 'leave-to';

export interface TransitionProps {
  /**
   * 是否显示子元素。true 时进入（enter），false 时离开（leave）。
   */
  show: boolean;
  /**
   * 动画 class 前缀，默认 'transition'，生成
   * `{name}-enter-from` / `{name}-enter-to` / `{name}-leave-from` / `{name}-leave-to`
   * 及对应 `-active` class。
   */
  name?: string;
  /**
   * 动画时长（ms），默认 300。作为过渡结束的兜底时间。
   */
  duration?: number;
  children?: Array<VNode | string>;
}

interface TransitionState {
  show: boolean;
  phase: TransitionPhase;
}

export class Transition extends Component<TransitionProps, TransitionState> {
  private timers: ReturnType<typeof setTimeout>[] = [];

  protected initState(): TransitionState {
    return {
      show: this.props.show,
      phase: 'idle',
    };
  }

  protected initStyles(): void {}

  protected onUpdated(): void {
    if (this.state.show === this.props.show) {
      return;
    }

    this.state.show = this.props.show;
    this.startTransition();
  }

  protected onUnmounted(): void {
    this.clearTimers();
  }

  protected render(): VNode {
    const phase = this.state.phase;
    const shouldRender = this.state.show || phase.startsWith('leave');
    if (!shouldRender) {
      return { tag: 'div', children: [] };
    }

    const children = this.props.children ?? [];
    const phaseClass = phase === 'idle' ? '' : this.phaseClass(phase);

    return {
      tag: 'div',
      children: children.map((child) => this.decorate(child, phaseClass)),
    };
  }

  private startTransition(): void {
    this.clearTimers();

    if (this.state.show) {
      this.enter('enter-from');
    } else {
      this.enter('leave-from');
    }
  }

  private enter(from: 'enter-from' | 'leave-from'): void {
    this.state.phase = from;

    const duration = this.validateDuration();
    this.timers.push(
      setTimeout(() => {
        // 下一帧切到 to 阶段，触发 CSS transition
        if (this.state.phase === from) {
          this.state.phase = from === 'enter-from' ? 'enter-to' : 'leave-to';
        }
      }, 0)
    );

    this.timers.push(
      setTimeout(() => {
        if (
          this.state.phase === 'enter-to' ||
          this.state.phase === 'leave-to'
        ) {
          this.state.phase = 'idle';
        }
      }, duration)
    );
  }

  private phaseClass(phase: TransitionPhase): string {
    const name = this.props.name ?? 'transition';
    const kind = phase.startsWith('enter') ? 'enter' : 'leave';
    const step = phase.endsWith('-from') ? 'from' : 'to';
    return `${name}-${kind}-${step} ${name}-${kind}-active`;
  }

  private decorate(child: VNode | string, phaseClass: string): VNode | string {
    if (typeof child === 'string' || !phaseClass || !isHTMLNode(child)) {
      return child;
    }

    const props = { ...(child.props ?? {}) };
    props.class = [props.class, phaseClass].filter(Boolean).join(' ');
    return { ...child, props };
  }

  private validateDuration(): number {
    const duration = this.props.duration ?? 300;
    if (!Number.isFinite(duration) || duration < 0) {
      throw new Error(
        'Transition duration must be a non-negative finite number'
      );
    }
    return duration;
  }

  private clearTimers(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }
}
