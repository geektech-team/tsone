export type StyleValue = string | number;
export type StyleProperties = Record<string, StyleValue>;
export interface StyleRule {
    selector: string;
    properties: StyleProperties;
}
export interface StyleAtRule {
    atRule: string;
    rules: StyleRule[];
}
export type StyleSheetEntry = StyleRule | StyleAtRule;
export type StyleSheet = StyleSheetEntry[];
export declare function renderStyleSheet(styles: StyleSheet): string;
