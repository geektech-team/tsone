export interface ModelBindingOptions {
    path: string;
    parse?: (value: unknown) => unknown;
    format?: (value: unknown) => string;
}
export type ModelBinding = string | ModelBindingOptions;
type ModelState = Record<string, unknown>;
export declare function modelPath(binding: ModelBinding): string;
export declare function getModelValue(state: ModelState, path: string): unknown;
export declare function setModelValue(state: ModelState, path: string, value: unknown): void;
export declare class ModelBindingController {
    private readonly bindings;
    bind(element: HTMLElement, binding: ModelBinding, state: ModelState): void;
    cleanup(element: HTMLElement): void;
    private isSupportedControl;
    private sameBinding;
}
export {};
