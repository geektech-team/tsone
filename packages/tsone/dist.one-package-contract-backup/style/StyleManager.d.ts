export interface StyleOptions {
    selector: string;
    properties: Record<string, string | number>;
    hover?: Record<string, string | number>;
    media?: Record<string, Record<string, string | number>>;
}
export declare class StyleManager {
    styleElement: HTMLStyleElement;
    styles: Map<string, StyleOptions>;
    constructor();
    addStyle(name: string, options: StyleOptions): void;
    removeStyle(name: string): void;
    clearStyles(): void;
    destroy(): void;
    private convertToCSS;
    private updateStyles;
}
