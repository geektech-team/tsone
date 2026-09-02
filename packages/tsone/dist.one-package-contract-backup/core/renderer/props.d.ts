export interface ParsedEventName {
    eventName: string;
    modifiers: Set<string>;
}
export declare function isEventProp(key: string): boolean;
export declare function eventNameFromProp(key: string): string;
export declare function parseEventName(event: string): ParsedEventName;
export declare function wrapEventHandler(handler: (event: Event) => void, modifiers: Set<string>): EventListener;
export declare function setStyleValue(style: CSSStyleDeclaration, property: string, value: string | number): void;
