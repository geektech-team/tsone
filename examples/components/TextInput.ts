import { Component, VNode } from '../../lib';
import { StyleOptions } from '../../lib/style/StyleManager';

interface TextInputProps {
  value?: string;
  placeholder?: string;
  label?: string;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
}

interface TextInputState {
  value: string;
  isFocused: boolean;
}

export class TextInput extends Component<TextInputProps, TextInputState> {
  constructor(protected props: TextInputProps = {}) {
    super(props);
  }

  protected initState(): TextInputState {
    return {
      value: this.props.value ?? '',
      isFocused: false,
    };
  }

  protected initStyles(): void {
    const containerStyles: StyleOptions = {
      selector: '.text-input-container',
      properties: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '300px',
        margin: '0 auto',
      },
    };

    const labelStyles: StyleOptions = {
      selector: '.text-input-label',
      properties: {
        fontSize: '0.9em',
        color: '#666',
        textAlign: 'left',
      },
    };

    const inputStyles: StyleOptions = {
      selector: '.text-input',
      properties: {
        padding: '8px 12px',
        fontSize: '1em',
        border: '2px solid #ddd',
        borderRadius: '4px',
        outline: 'none',
        transition: 'all 0.3s',
      },
    };

    const inputFocusStyles: StyleOptions = {
      selector: '.text-input:focus',
      properties: {
        borderColor: '#42b983',
        boxShadow: '0 0 0 2px rgba(66, 185, 131, 0.1)',
      },
    };

    this.styleManager.addStyle('container', containerStyles);
    this.styleManager.addStyle('label', labelStyles);
    this.styleManager.addStyle('input', inputStyles);
    this.styleManager.addStyle('inputFocus', inputFocusStyles);
  }

  private handleInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.state.value = value;

    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }

  protected render(): VNode {
    const children: Array<VNode | string> = [];

    if (this.props.label) {
      children.push({
        tag: 'label',
        props: { class: 'text-input-label' },
        children: [this.props.label],
      });
    }

    children.push({
      tag: 'input',
      props: {
        class: 'text-input',
        type: 'text',
        value: this.state.value,
        placeholder: this.props.placeholder ?? '',
      },
      listeners: {
        input: (e: Event) => this.handleInput(e),
        focus: () => (this.state.isFocused = true),
        blur: () => (this.state.isFocused = false),
      },
    });

    return {
      tag: 'div',
      props: { class: 'text-input-container' },
      children,
    };
  }
}
