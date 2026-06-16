import { Component, VNode } from '../../lib';
import { StyleOptions } from '../../lib/style/StyleManager';

export class Card extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    const cardStyles: StyleOptions = {
      selector: '.card',
      properties: {
        border: '1px solid #e4e4e4',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        margin: '20px 0',
      },
    };

    const headerStyles: StyleOptions = {
      selector: '.card-header',
      properties: {
        padding: '16px',
        borderBottom: '1px solid #e4e4e4',
        backgroundColor: '#f8f9fa',
        fontWeight: 'bold',
        fontSize: '18px',
      },
    };

    const contentStyles: StyleOptions = {
      selector: '.card-content',
      properties: {
        padding: '16px',
        lineHeight: '1.6',
        color: '#333',
      },
    };

    const footerStyles: StyleOptions = {
      selector: '.card-footer',
      properties: {
        padding: '16px',
        borderTop: '1px solid #e4e4e4',
        backgroundColor: '#f8f9fa',
        color: '#666',
        fontSize: '14px',
      },
    };

    this.styleManager.addStyle('card', cardStyles);
    this.styleManager.addStyle('header', headerStyles);
    this.styleManager.addStyle('content', contentStyles);
    this.styleManager.addStyle('footer', footerStyles);
  }

  protected render(): VNode {
    return {
      tag: 'div',
      props: { class: 'card' },
      children: [
        {
          tag: 'div',
          props: { class: 'card-header' },
          children: [
            {
              tag: 'slot',
              props: { name: 'header' },
              children: ['默认标题'],
            },
          ],
        },
        {
          tag: 'div',
          props: { class: 'card-content' },
          children: [
            {
              tag: 'slot',
              props: { name: 'content' },
              children: ['默认内容'],
            },
          ],
        },
        {
          tag: 'div',
          props: { class: 'card-footer' },
          children: [
            {
              tag: 'slot',
              props: { name: 'footer' },
              children: ['默认页脚'],
            },
          ],
        },
      ],
    };
  }
}
