import { OneApp, AppOptions } from './core/app';
import type { ComponentProps } from './core/component';
export * from './core';
export * from './router';
export declare function createApp<TState extends object = Record<string, unknown>, TConfig extends object = Record<string, unknown>, TRootProps extends ComponentProps = ComponentProps>(options?: AppOptions<TState, TConfig, TRootProps>): OneApp<TState, TConfig, TRootProps>;
export declare const version = "0.0.2";
export declare const name = "@geektech/tsone";
