import { Component, type VNode } from '@geektech/tsone';
import { OneRate, type OneRateValueEvent } from '../../../lib';
import { pick } from './locale';

interface RateDemoState {
  score: number;
}

export class RateDemo extends Component<Record<string, never>, RateDemoState> {
  private readonly handleScore = (payload: unknown): void => {
    const event = payload as OneRateValueEvent;
    this.setState({ score: event.value });
  };

  protected initState(): RateDemoState {
    return { score: 3 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-rate-demo' },
      children: [
        {
          component: OneRate,
          props: {
            value: this.state.score,
            ariaLabel: pick('评分', 'Rating'),
          },
          emitters: { change: this.handleScore },
        },
        {
          component: OneRate,
          props: {
            defaultValue: 4,
            count: 10,
            ariaLabel: pick('十星评分', 'Ten-star rating'),
          },
        },
        {
          component: OneRate,
          props: {
            defaultValue: 4,
            readonly: true,
            ariaLabel: pick('只读评分', 'Readonly rating'),
          },
        },
        {
          tag: 'output',
          props: { 'data-one-rate-result': '' },
          children: [
            pick(
              `已评分：${this.state.score} 星`,
              `Rated: ${this.state.score} stars`
            ),
          ],
        },
      ],
    };
  }
}
