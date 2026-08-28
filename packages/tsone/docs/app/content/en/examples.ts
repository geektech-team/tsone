import { codeBlock, heading, list, paragraph, type DocPage } from '../types';

const helloWorldExample = `import { createApp, Component } from '@geektech/tsone';

class App extends Component {
  protected initState() {
    return {
      message: 'Hello, TSone!',
    };
  }

  protected initStyles() {
    this.styleManager.addStyle('.app', {
      selector: '.app',
      properties: {
        textAlign: 'center',
        padding: '20px',
        fontSize: '24px',
      },
    });
  }

  protected render() {
    return {
      tag: 'div',
      props: { className: 'app' },
      children: ['{{message}}'],
    };
  }
}

const app = createApp({
  root: App,
});

app.mount();`;

const counterExample = `import { createApp, Component } from '@geektech/tsone';

class Counter extends Component {
  protected initState() {
    return {
      count: 0,
    };
  }

  protected initStyles() {
    this.styleManager.addStyle('.counter', {
      selector: '.counter',
      properties: {
        textAlign: 'center',
        padding: '20px',
      },
    });

    this.styleManager.addStyle('.counter button', {
      selector: '.counter button',
      properties: {
        padding: '8px 16px',
        margin: '0 10px',
        fontSize: '16px',
      },
    });

    this.styleManager.addStyle('.counter h2', {
      selector: '.counter h2',
      properties: {
        marginBottom: '20px',
      },
    });
  }

  protected increment() {
    this.state.count++;
  }

  protected decrement() {
    this.state.count--;
  }

  protected render() {
    return {
      tag: 'div',
      props: { className: 'counter' },
      children: [
        {
          tag: 'h2',
          children: ['Count: {{count}}'],
        },
        {
          tag: 'div',
          children: [
            {
              tag: 'button',
              listeners: { click: () => this.decrement() },
              children: ['-'],
            },
            {
              tag: 'button',
              listeners: { click: () => this.increment() },
              children: ['+'],
            },
          ],
        },
      ],
    };
  }
}

const app = createApp({
  root: Counter,
});

app.mount();`;

const formExample = `import { createApp, Component } from '@geektech/tsone';

class FormExample extends Component {
  protected initState() {
    return {
      name: '',
      email: '',
      message: '',
    };
  }

  protected initStyles() {
    this.styleManager.addStyle('.form', {
      selector: '.form',
      properties: {
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
      },
    });

    this.styleManager.addStyle('.form-group', {
      selector: '.form-group',
      properties: {
        marginBottom: '15px',
      },
    });

    this.styleManager.addStyle('.form-group label', {
      selector: '.form-group label',
      properties: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
      },
    });

    this.styleManager.addStyle('.form-group input, .form-group textarea', {
      selector: '.form-group input, .form-group textarea',
      properties: {
        width: '100%',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxSizing: 'border-box',
      },
    });

    this.styleManager.addStyle('.form-group textarea', {
      selector: '.form-group textarea',
      properties: {
        height: '100px',
        resize: 'vertical',
      },
    });

    this.styleManager.addStyle('.form button', {
      selector: '.form button',
      properties: {
        padding: '10px 15px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      },
    });

    this.styleManager.addStyle('.form button:hover', {
      selector: '.form button:hover',
      properties: {
        backgroundColor: '#0069d9',
      },
    });
  }

  protected handleSubmit(event: Event) {
    event.preventDefault();
    console.log('Form submitted:', this.state);
    alert('Form submitted successfully!');
  }

  protected render() {
    return {
      tag: 'form',
      props: { className: 'form' },
      listeners: { submit: (e) => this.handleSubmit(e) },
      children: [
        {
          tag: 'div',
          props: { className: 'form-group' },
          children: [
            {
              tag: 'label',
              props: { htmlFor: 'name' },
              children: ['Name:'],
            },
            {
              tag: 'input',
              props: {
                type: 'text',
                id: 'name',
                value: this.state.name,
              },
              listeners: {
                input: (e: Event) => {
                  this.state.name = (e.target as HTMLInputElement).value;
                },
              },
            },
          ],
        },
        {
          tag: 'div',
          props: { className: 'form-group' },
          children: [
            {
              tag: 'label',
              props: { htmlFor: 'email' },
              children: ['Email:'],
            },
            {
              tag: 'input',
              props: {
                type: 'email',
                id: 'email',
                value: this.state.email,
              },
              listeners: {
                input: (e: Event) => {
                  this.state.email = (e.target as HTMLInputElement).value;
                },
              },
            },
          ],
        },
        {
          tag: 'div',
          props: { className: 'form-group' },
          children: [
            {
              tag: 'label',
              props: { htmlFor: 'message' },
              children: ['Message:'],
            },
            {
              tag: 'textarea',
              props: {
                id: 'message',
                value: this.state.message,
              },
              listeners: {
                input: (e: Event) => {
                  this.state.message = (e.target as HTMLTextAreaElement).value;
                },
              },
            },
          ],
        },
        {
          tag: 'button',
          props: { type: 'submit' },
          children: ['Submit'],
        },
      ],
    };
  }
}

const app = createApp({
  root: FormExample,
});

app.mount();`;

const listExample = `import { createApp, Component } from '@geektech/tsone';

class ListExample extends Component {
  protected initState() {
    return {
      items: ['Item 1', 'Item 2', 'Item 3'],
      newItem: '',
    };
  }

  protected initStyles() {
    this.styleManager.addStyle('.list-app', {
      selector: '.list-app',
      properties: {
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
      },
    });

    this.styleManager.addStyle('.list', {
      selector: '.list',
      properties: {
        listStyle: 'none',
        padding: '0',
        margin: '15px 0',
      },
    });

    this.styleManager.addStyle('.list li', {
      selector: '.list li',
      properties: {
        padding: '8px',
        borderBottom: '1px solid #ddd',
      },
    });

    this.styleManager.addStyle('.add-item', {
      selector: '.add-item',
      properties: {
        display: 'flex',
        gap: '10px',
      },
    });

    this.styleManager.addStyle('.add-item input', {
      selector: '.add-item input',
      properties: {
        flex: '1',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
      },
    });

    this.styleManager.addStyle('.add-item button', {
      selector: '.add-item button',
      properties: {
        padding: '8px 15px',
        backgroundColor: '#28a745',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      },
    });
  }

  protected addItem() {
    if (this.state.newItem.trim()) {
      this.state.items.push(this.state.newItem);
      this.state.newItem = '';
    }
  }

  protected removeItem(index: number) {
    this.state.items.splice(index, 1);
  }

  protected render() {
    return {
      tag: 'div',
      props: { className: 'list-app' },
      children: [
        {
          tag: 'h2',
          children: ['Todo List'],
        },
        {
          tag: 'div',
          props: { className: 'add-item' },
          children: [
            {
              tag: 'input',
              props: {
                type: 'text',
                placeholder: 'Add new item',
                value: this.state.newItem,
              },
              listeners: {
                input: (e: Event) => {
                  this.state.newItem = (e.target as HTMLInputElement).value;
                },
                keyup: (e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    this.addItem();
                  }
                },
              },
            },
            {
              tag: 'button',
              listeners: { click: () => this.addItem() },
              children: ['Add'],
            },
          ],
        },
        {
          tag: 'ul',
          props: { className: 'list' },
          children: this.state.items.map((item, index) => ({
            tag: 'li',
            children: [
              item,
              {
                tag: 'button',
                props: {
                  style: {
                    marginLeft: '10px',
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                  },
                },
                listeners: { click: () => this.removeItem(index) },
                children: ['Remove'],
              },
            ],
          })),
        },
      ],
    };
  }
}

const app = createApp({
  root: ListExample,
});

app.mount();`;

export const enExamplePages: DocPage[] = [
  {
    path: '/examples/basic/',
    title: 'Basic Examples',
    description:
      'Basic examples covering Hello World, a counter, form handling, and list rendering.',
    section: 'Examples',
    sectionOrder: 3,
    order: 1,
    body: [
      heading(1, 'Basic Examples'),
      paragraph('This page demonstrates the basics of using TSone.'),
      heading(2, 'Hello World'),
      codeBlock('ts', helloWorldExample),
      heading(2, 'Counter'),
      codeBlock('ts', counterExample),
      heading(2, 'Form Handling'),
      codeBlock('ts', formExample),
      heading(2, 'List Rendering'),
      codeBlock('ts', listExample),
      heading(2, 'Summary'),
      list([
        ['Creating and mounting components'],
        ['State management'],
        ['Event handling'],
        ['Style management'],
        ['Form handling'],
        ['List rendering'],
      ]),
    ],
  },
];
