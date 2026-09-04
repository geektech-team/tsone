// 基准页面的共享全局钩子声明（三套应用与 driver 共用）
declare global {
  interface Window {
    __t0: number;
    __mountMs?: number;
    __appReady?: boolean;
    __bench?: {
      add: (n: number) => void;
      toggle: (n: number) => void;
      remove: (n: number) => void;
      toggleEach: (n: number) => void;
      count: () => number;
    };
    __benchRun?: () => void;
    __benchResults?: unknown;
  }
}

export {};
