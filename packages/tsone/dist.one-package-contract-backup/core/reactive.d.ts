import { ComputedRef, Ref, ReactiveEffect, ReactiveEffectOptions } from './reactive/types';
export type { ComputedRef, Ref, ReactiveEffect, ReactiveEffectOptions, } from './reactive/types';
export declare class ReactiveSystem {
    private static instance;
    private activeEffect;
    private readonly effectStack;
    private targetMap;
    private reactiveMap;
    private readonlyMap;
    private constructor();
    static getInstance(): ReactiveSystem;
    reactive<T extends object>(target: T): T;
    /**
     * 创建响应式数组
     */
    private createReactiveArray;
    readonly<T extends object>(target: T): Readonly<T>;
    effect<T = unknown>(fn: () => T, options?: ReactiveEffectOptions): ReactiveEffect<T>;
    computed<T>(getter: () => T): ComputedRef<T>;
    private cleanup;
    private track;
    private trigger;
    stop(effect: ReactiveEffect): void;
}
export declare function reactive<T extends object>(target: T): T;
export declare function readonly<T extends object>(target: T): Readonly<T>;
export declare function effect<T = unknown>(fn: () => T, options?: ReactiveEffectOptions): ReactiveEffect<T>;
export declare function computed<T>(getter: () => T): ComputedRef<T>;
export declare function ref<T>(value: T): Ref<T>;
export declare function isRef(value: unknown): value is Ref<unknown>;
export declare function unref<T>(value: T | Ref<T>): T;
export declare function stop(effect: ReactiveEffect): void;
export declare function isReactive(value: unknown): boolean;
export declare function isReadonly(value: unknown): boolean;
