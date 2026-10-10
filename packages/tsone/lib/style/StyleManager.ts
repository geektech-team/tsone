import { renderManagedStyleSheet } from './managed-sheet';

export interface StyleOptions {
  selector: string;
  properties: Record<string, string | number>;
  hover?: Record<string, string | number>;
  media?: Record<string, Record<string, string | number>>;
}

export class StyleManager {
  public styleElement: HTMLStyleElement | null = null;
  public styles: Map<string, StyleOptions> = new Map();

  constructor() {
    // style 元素延迟到首次 addStyle 时创建，避免无样式组件产生空 <style> 节点
  }

  public addStyle(name: string, options: StyleOptions): void {
    this.styles.set(name, options);
    this.updateStyles();
  }

  public removeStyle(name: string): void {
    this.styles.delete(name);
    this.updateStyles();
  }

  public clearStyles(): void {
    this.styles.clear();
    if (this.styleElement) {
      this.styleElement.textContent = '';
    }
  }

  public destroy(): void {
    this.clearStyles();
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }

  private ensureStyleElement(): HTMLStyleElement {
    if (!this.styleElement) {
      const element = document.createElement('style');
      document.head.appendChild(element);
      this.styleElement = element;
    }
    return this.styleElement;
  }

  private updateStyles(): void {
    if (this.styles.size === 0) {
      if (this.styleElement) {
        this.styleElement.textContent = '';
      }
      return;
    }

    const element = this.ensureStyleElement();
    element.textContent = renderManagedStyleSheet(this.styles.values());
  }
}
