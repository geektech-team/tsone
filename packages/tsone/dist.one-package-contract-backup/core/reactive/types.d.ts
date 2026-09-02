export interface ReactiveEffect<T = unknown> {
    (): T | undefined;
    deps: Set<ReactiveEffect>[];
    id: number;
    active: boolean;
    scheduler?: (effect: ReactiveEffect) => void;
}
export interface ReactiveEffectOptions {
    lazy?: boolean;
    scheduler?: (effect: ReactiveEffect) => void;
    throwOnError?: boolean;
}
export interface ComputedRef<T> {
    readonly value: T;
}
export declare const IS_REACTIVE: unique symbol;
export declare const IS_READONLY: unique symbol;
export declare const IS_REF: unique symbol;
export interface Ref<T = unknown> {
    value: T;
}
export declare const MUTATING_ARRAY_METHODS: readonly ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"];
export declare function hasReactiveFlag(value: object, flag: typeof IS_REACTIVE | typeof IS_READONLY): boolean;
export declare function isObject(value: unknown): value is object;
