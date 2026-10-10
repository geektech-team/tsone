import { renderManagedStyleSheet } from './managed-sheet';
import { fetchStaticStyleSheet } from './static-style-resource';

export interface StyleOptions {
  selector: string;
  properties: Record<string, string | number>;
  hover?: Record<string, string | number>;
  media?: Record<string, Record<string, string | number>>;
}

export class StyleManager {
  public styleElement: HTMLStyleElement | null = null;
  public styles: Map<string, StyleOptions> = new Map();
  private generation = 0;
  private pendingLink: HTMLElement | null = null;
  private staticLink: HTMLElement | null = null;
  private writtenElement: HTMLStyleElement | null = null;
  private writtenCss = '';

  constructor() {
    // style 元素延迟到首次 addStyle 时创建，避免无样式组件产生空 <style> 节点
  }

  public addStyle(name: string, options: StyleOptions): void {
    this.invalidateStaticStyle();
    this.styles.set(name, options);
    this.updateStyles();
  }

  public removeStyle(name: string): void {
    this.invalidateStaticStyle();
    this.styles.delete(name);
    this.updateStyles();
  }

  public clearStyles(): void {
    this.invalidateStaticStyle();
    this.styles.clear();
    if (this.styleElement) {
      this.styleElement.textContent = '';
      this.recordWrittenStyle(this.styleElement);
    }
  }

  public destroy(): void {
    this.generation++;
    this.pendingLink?.remove();
    this.staticLink?.remove();
    this.pendingLink = this.staticLink = null;
    this.clearStyles();
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    this.writtenElement = null;
    this.writtenCss = '';
  }

  public useStaticStyleSheet(href: string): void {
    this.invalidateStaticStyle();
    const inline = this.styleElement;
    if (
      !inline || !inline.isConnected || !this.writtenCss ||
      inline !== this.writtenElement || inline.textContent !== this.writtenCss ||
      inline.ownerDocument.querySelector('base') ||
      this.addStyle !== originalMethods.addStyle ||
      this.removeStyle !== originalMethods.removeStyle ||
      this.clearStyles !== originalMethods.clearStyles ||
      this.destroy !== originalMethods.destroy
    ) return;
    let absoluteHref: string;
    try {
      absoluteHref = new URL(href,
        inline.ownerDocument.baseURI || inline.ownerDocument.URL).href;
    } catch {
      return;
    }
    const generation = this.generation;
    const css = this.writtenCss;
    const current = () => this.generation === generation &&
      this.styleElement === inline && inline.isConnected && inline.textContent === css;
    void fetchStaticStyleSheet(absoluteHref).then(fetched => {
      if (fetched !== css || !current()) return;
      const link = inline.ownerDocument.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('media', 'not all');
      this.pendingLink = link;
      const discard = () => {
        link.remove();
        if (this.pendingLink === link) this.pendingLink = null;
      };
      link.addEventListener('error', discard, { once: true });
      link.addEventListener('load', () => {
        if (!current()) { discard(); return; }
        link.removeAttribute('media');
        inline.remove();
        this.styleElement = null;
        this.writtenElement = null;
        this.staticLink = link;
        this.pendingLink = null;
      }, { once: true });
      link.setAttribute('href', absoluteHref);
      inline.parentNode!.insertBefore(link, inline);
    }).catch(() => {});
  }

  private invalidateStaticStyle(): void {
    this.generation++;
    this.pendingLink?.remove();
    this.pendingLink = null;
    if (this.staticLink) {
      const link = this.staticLink;
      const inline = link.ownerDocument.createElement('style');
      link.parentNode?.replaceChild(inline, link);
      this.styleElement = inline;
      this.staticLink = null;
      inline.textContent = this.writtenCss;
      this.writtenElement = inline;
    }
  }

  private recordWrittenStyle(element: HTMLStyleElement): void {
    this.writtenElement = element;
    this.writtenCss = element.textContent ?? '';
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
        this.recordWrittenStyle(this.styleElement);
      }
      return;
    }

    const element = this.ensureStyleElement();
    element.textContent = renderManagedStyleSheet(this.styles.values());
    this.recordWrittenStyle(element);
  }
}

const originalMethods = {
  addStyle: StyleManager.prototype.addStyle,
  removeStyle: StyleManager.prototype.removeStyle,
  clearStyles: StyleManager.prototype.clearStyles,
  destroy: StyleManager.prototype.destroy,
};
