import { Component, Div, VNode } from '../../lib';
import { StyleOptions } from '../../lib/style/StyleManager';
import { Navigation } from './Navigation';
import { TextInput } from './TextInput';
import { SlotDemo } from './SlotDemo';

interface NavigationLink {
  path: string;
  text: string;
}

interface HomeState {
  title: string;
  navigationLinks: NavigationLink[];
  lastNavigation: string;
  inputValue: string;
}

export class Home extends Component<object, HomeState> {
  protected initState(): HomeState {
    return {
      title: 'TSone 示例',
      navigationLinks: [
        { path: '/', text: '首页' },
        { path: '/counter', text: '计数器' },
        { path: '/about', text: '关于' },
      ],
      lastNavigation: '',
      inputValue: '',
    };
  }

  protected initStyles(): void {
    const containerStyles: StyleOptions = {
      selector: '.container',
      properties: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
      },
    };

    const titleStyles: StyleOptions = {
      selector: '.title',
      properties: {
        fontSize: '32px',
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: '40px',
      },
    };

    const sectionStyles: StyleOptions = {
      selector: '.section',
      properties: {
        marginBottom: '40px',
      },
    };

    const homeStyles: StyleOptions = {
      selector: '.home',
      properties: {
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center',
      },
    };

    const contentStyles: StyleOptions = {
      selector: '.home .content',
      properties: {
        marginTop: '30px',
        fontSize: '1.2em',
        color: '#666',
      },
    };

    const navigationInfoStyles: StyleOptions = {
      selector: '.home .navigation-info',
      properties: {
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        color: '#666',
        fontSize: '0.9em',
      },
    };

    const messageItemStyles: StyleOptions = {
      selector: '.home .message-item',
      properties: {
        padding: '8px',
        margin: '4px 0',
        backgroundColor: '#fff',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'left',
      },
    };

    this.styleManager.addStyle('container', containerStyles);
    this.styleManager.addStyle('title', titleStyles);
    this.styleManager.addStyle('section', sectionStyles);
    this.styleManager.addStyle('home', homeStyles);
    this.styleManager.addStyle('content', contentStyles);
    this.styleManager.addStyle('navigationInfo', navigationInfoStyles);
    this.styleManager.addStyle('messageItem', messageItemStyles);
  }

  private handleNavigation(path: string): void {
    this.state.lastNavigation = `上次导航到: ${path} (${new Date().toLocaleTimeString()})`;
  }

  private handleInputChange(value: string): void {
    this.state.inputValue = value;
  }

  protected render(): VNode {
    return Div({
      props: { class: 'container' },
      children: [
        {
          tag: 'h1',
          props: { class: 'title' },
          children: [this.state.title],
        },
        Div({
          props: { class: 'section' },
          children: [
            Div({
              props: { class: 'counter-container' },
              children: ['Counter Component'],
            }),
          ],
        }),
        Div({
          props: { class: 'section' },
          children: [
            {
              component: SlotDemo,
              props: {},
            },
          ],
        }),
        {
          component: Navigation,
          props: {
            links: this.state.navigationLinks,
            onNavigate: (path: string) => this.handleNavigation(path),
          },
        },
        Div({
          props: { class: 'content' },
          children: [
            '这是一个轻量级的前端框架示例，展示了组件化、响应式状态管理、路由等功能。',
          ],
        }),
        {
          component: TextInput,
          props: {
            value: this.state.inputValue,
            placeholder: '请输入消息...',
            label: '消息',
            onChange: (value: string) => this.handleInputChange(value),
          },
          children: [],
        },
        Div({
          props: { class: 'navigation-info' },
          children: ['{{lastNavigation}}'],
        }),
        Div({
          children: ['{{inputValue}}'],
        }),
        Div({
          children: [this.state.inputValue],
        }),
      ],
    });
  }
}
