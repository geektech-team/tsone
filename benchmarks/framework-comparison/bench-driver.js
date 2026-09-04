// 基准驱动脚本：等待应用挂载完成后，执行批量操作并记录耗时。
// 该脚本不属于被测框架，三套应用共用同一份驱动（纯浏览器 JS，无类型注解）。
// 运行方式：window.__benchRun()；由运行器（runner.ts / 调试脚本）显式调用。
(() => {
  const ITERATIONS = 5;

  const waitForBench = () =>
    new Promise((resolve) => {
      if (window.__bench) {
        resolve();
        return;
      }
      const timer = setInterval(() => {
        if (window.__bench) {
          clearInterval(timer);
          resolve();
        }
      }, 5);
    });

  // 测量一次操作耗时：以调用前为起点，以 DOM 最后一次变更时刻为终点。
  // 用 MutationObserver 记录变更时间戳，不依赖 rAF 帧等待，跨框架口径一致。
  const timeOp = async (fn) => {
    const appRoot = document.getElementById('app');
    const mutationTimes = [];
    const observer = new MutationObserver((list) => {
      const now = performance.now();
      for (let i = 0; i < list.length; i++) {
        mutationTimes.push(now);
      }
    });
    observer.observe(appRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    const t0 = performance.now();
    fn();

    await new Promise((resolve) => {
      const check = () => {
        if (mutationTimes.length === 0) {
          // 尚未产生任何 DOM 变更（如框架的提交是异步的），继续等待
          setTimeout(check, 2);
          return;
        }
        const last = mutationTimes[mutationTimes.length - 1];
        if (performance.now() - last >= 50) {
          resolve();
          return;
        }
        setTimeout(check, 2);
      };
      setTimeout(check, 2);
    });

    observer.disconnect();
    if (mutationTimes.length === 0) {
      return performance.now() - t0;
    }
    return mutationTimes[mutationTimes.length - 1] - t0;
  };

  const run = async () => {
    await waitForBench();
    const bench = window.__bench;
    const results = {
      framework: document.documentElement.dataset.framework,
      mountMs: Math.round((window.__mountMs ?? 0) * 100) / 100,
      add1000: [],
      toggle1000: [],
      remove1000: [],
      toggleEach1000: [],
      nodesAfter: 0,
    };

    for (let i = 0; i < ITERATIONS; i++) {
      results.add1000.push(await timeOp(() => bench.add(1000)));
      results.toggle1000.push(await timeOp(() => bench.toggle(1000)));
      results.remove1000.push(await timeOp(() => bench.remove(1000)));
      results.toggleEach1000.push(await timeOp(() => bench.toggleEach(1000)));
    }

    results.nodesAfter = document.querySelectorAll('.todo-row').length;
    window.__benchResults = results;
  };

  window.__benchRun = run;
})();
