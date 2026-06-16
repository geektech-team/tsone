export interface StyleOptions {
  selector: string;
  properties: Record<string, string | number>;
  hover?: Record<string, string | number>;
  media?: Record<string, Record<string, string | number>>;
}

export class StyleManager {
  public styleElement: HTMLStyleElement;
  public styles: Map<string, StyleOptions> = new Map();

  constructor() {
    this.styleElement = document.createElement('style');
    document.head.appendChild(this.styleElement);
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
    this.styleElement.textContent = '';
  }

  private convertToCSS(properties: Record<string, string | number>): string {
    return Object.entries(properties)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value};`;
      })
      .join('\n');
  }

  private updateStyles(): void {
    let cssText = '';

    this.styles.forEach((style) => {
      // 基础样式
      cssText += `${style.selector} {\n${this.convertToCSS(style.properties)}\n}\n`;

      // hover 样式
      if (style.hover) {
        cssText += `${style.selector}:hover {\n${this.convertToCSS(style.hover)}\n}\n`;
      }

      // media 查询
      if (style.media) {
        Object.entries(style.media).forEach(([query, properties]) => {
          cssText += `@media ${query} {\n${style.selector} {\n${this.convertToCSS(properties)}\n}\n}\n`;
        });
      }
    });

    this.styleElement.textContent = cssText;
  }
}
