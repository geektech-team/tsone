import { Component, type VNode } from '@geektech/tsone';
import { OneSlider, type OneSliderValueEvent } from '../../../lib';
import { pick } from './locale';

interface SliderDemoState {
  volume: number;
  opacity: number;
}

export class SliderDemo extends Component<
  Record<string, never>,
  SliderDemoState
> {
  private readonly handleVolume = (payload: unknown): void => {
    const event = payload as OneSliderValueEvent;
    this.setState({ volume: event.value });
  };

  private readonly handleOpacity = (payload: unknown): void => {
    const event = payload as OneSliderValueEvent;
    this.setState({ opacity: event.value });
  };

  protected initState(): SliderDemoState {
    return { volume: 60, opacity: 40 };
  }

  protected initStyles(): void {}

  protected render(): VNode {
    return {
      tag: 'div',
      props: { className: 'one-docs-slider-demo' },
      children: [
        {
          component: OneSlider,
          props: {
            value: this.state.volume,
            min: 0,
            max: 100,
            showValue: true,
            ariaLabel: pick('音量', 'Volume'),
          },
          emitters: { change: this.handleVolume },
        },
        {
          component: OneSlider,
          props: {
            value: this.state.opacity,
            step: 5,
            showValue: true,
            ariaLabel: pick('透明度', 'Opacity'),
          },
          emitters: { change: this.handleOpacity },
        },
        {
          component: OneSlider,
          props: {
            defaultValue: 80,
            min: 0,
            max: 200,
            showValue: true,
            ariaLabel: pick('预算', 'Budget'),
          },
        },
        {
          tag: 'output',
          props: { 'data-one-slider-result': '' },
          children: [
            pick(
              `音量：${this.state.volume}%，透明度：${this.state.opacity}%`,
              `Volume: ${this.state.volume}%, opacity: ${this.state.opacity}%`
            ),
          ],
        },
      ],
    };
  }
}
