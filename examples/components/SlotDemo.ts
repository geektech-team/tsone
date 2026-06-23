import { Button, Component, Div, VNode } from '../../lib';
import { StyleOptions } from '../../lib/style/StyleManager';

interface SlotDemoState {
  title: string;
  content: string;
  footerText: string;
  counter: number;
  messages: string[];
}

export class SlotDemo extends Component<object, SlotDemoState> {
  protected initState(): SlotDemoState {
    return {
      title: '插槽示例',
      content:
        '这是一个展示插槽功能的示例。通过插槽，我们可以让父组件自定义子组件的部分内容。',
      footerText: '© 2024 TSone',
      counter: 0,
      messages: [] as string[],
    };
  }

  protected initStyles(): void {
    const demoStyles: StyleOptions = {
      selector: '.slot-demo',
      properties: {
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
      },
    };

    const titleStyles: StyleOptions = {
      selector: '.slot-demo-title',
      properties: {
        fontSize: '24px',
        color: '#2c3e50',
        marginBottom: '20px',
        textAlign: 'center',
      },
    };

    const buttonStyles: StyleOptions = {
      selector: '.slot-demo-button',
      properties: {
        padding: '8px 16px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px',
        transition: 'background-color 0.3s',
      },
      hover: {
        backgroundColor: '#45a049',
      },
    };

    const inputStyles: StyleOptions = {
      selector: '.slot-demo-input',
      properties: {
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        marginRight: '8px',
        width: '200px',
      },
    };

    const messageStyles: StyleOptions = {
      selector: '.slot-demo-message',
      properties: {
        backgroundColor: '#f8f9fa',
        padding: '8px',
        margin: '4px 0',
        borderRadius: '4px',
        color: '#333',
      },
    };

    this.styleManager.addStyle('demo', demoStyles);
    this.styleManager.addStyle('title', titleStyles);
    this.styleManager.addStyle('button', buttonStyles);
    this.styleManager.addStyle('input', inputStyles);
    this.styleManager.addStyle('message', messageStyles);
  }

  private incrementCounter = () => {
    this.state.counter++;
    this.state.content = `计数器值: ${this.state.counter}`;
  };

  private addMessage = () => {
    const message = `消息 #${this.state.messages.length + 1}: ${new Date().toLocaleTimeString()}`;
    this.state.messages = [...this.state.messages, message];
  };

  protected render(): VNode {
    return Div({
      props: { class: 'slot-demo' },
      children: [
        {
          tag: 'h1',
          props: { class: 'slot-demo-title' },
          children: ['{{title}}'],
        },
        Div({
          props: {},
          children: [
            Div({
              props: { class: 'card-header' },
              children: ['自定义卡片标题'],
            }),
            Div({
              props: { class: 'card-content' },
              children: [
                Div({
                  children: ['{{content}}'],
                }),
                Div({
                  props: { style: { marginTop: '16px' } },
                  children: [
                    Button({
                      props: { class: 'slot-demo-button' },
                      listeners: {
                        click: this.incrementCounter,
                      },
                      children: ['增加计数'],
                    }),
                    Button({
                      props: {
                        class: 'slot-demo-button',
                        style: {
                          marginLeft: '8px',
                          backgroundColor: '#2196F3',
                        },
                      },
                      listeners: {
                        click: this.addMessage,
                      },
                      children: ['添加消息'],
                    }),
                  ],
                }),
                Div({
                  props: { style: { marginTop: '16px' } },
                  children: this.state.messages.map((message: string) =>
                    Div({
                      props: { class: 'slot-demo-message' },
                      children: [message],
                    })
                  ),
                }),
              ],
            }),
            Div({
              props: { class: 'card-footer' },
              children: ['{{footerText}}'],
            }),
          ],
        }),
      ],
    });
  }
}
