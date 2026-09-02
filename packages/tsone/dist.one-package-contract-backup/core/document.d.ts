import type { Renderable } from './renderer/types';
import { type StyleSheet } from '../style/sheet';
export { renderStyleSheet, type StyleAtRule, type StyleProperties, type StyleRule, type StyleSheet, type StyleSheetEntry, type StyleValue, } from '../style/sheet';
export type HtmlAttributeValue = string | number | boolean | null | undefined;
export type HtmlAttributes = Record<string, HtmlAttributeValue>;
export type HtmlDocumentBody = Renderable | Renderable[];
export interface HtmlHeadElement {
    tag: string;
    attributes?: HtmlAttributes;
    text?: string;
}
export interface HtmlScript {
    src: string;
    type?: string;
    async?: boolean;
    defer?: boolean;
    attributes?: HtmlAttributes;
}
export interface HtmlDocumentOptions {
    title: string;
    body: HtmlDocumentBody;
    lang?: string;
    charset?: string;
    viewport?: string;
    description?: string;
    htmlAttributes?: HtmlAttributes;
    bodyAttributes?: HtmlAttributes;
    head?: HtmlHeadElement[];
    styles?: StyleSheet;
    scripts?: HtmlScript[];
}
export declare function renderHtmlDocument(options: HtmlDocumentOptions): string;
