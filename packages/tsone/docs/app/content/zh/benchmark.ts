import {
  callout,
  heading,
  inlineCode,
  list,
  paragraph,
  table,
  type DocPage,
} from '../types';

const benchmarkSection = 'Benchmark';
const benchmarkSectionOrder = 5;

export const benchmarkPages: DocPage[] = [
  {
    path: '/benchmark/framework-comparison/',
    title: '框架对比：TSone × Vue × React',
    description:
      '同一待办应用在 TSone、Vue 3、React 上的产物体积与渲染性能对比实验结果。',
    section: benchmarkSection,
    sectionOrder: benchmarkSectionOrder,
    order: 1,
    body: [
      heading(1, '框架对比：TSone × Vue × React'),
      paragraph(
        '用同一份待办列表应用分别在 TSone、Vue 3、React 19 上实现，对比',
        inlineCode('产物体积'),
        '与',
        inlineCode('渲染性能'),
        '。实验脚本、三套实现源码与完整原始数据位于 ',
        inlineCode('benchmarks/framework-comparison/'),
        '，可一键复现。'
      ),
      heading(2, '实验设计'),
      heading(3, '被测功能'),
      list([
        [
          '初始挂载 1000 条待办（Task 0 ~ Task 999），每行含复选框、标题与删除按钮',
        ],
        ['底部统计总条数与未完成数'],
        [
          '三套应用产出相同的 DOM 结构，仅实现方式不同（TSone 类组件 / Vue Composition API / React 函数组件）',
        ],
      ]),
      heading(3, '构建方式'),
      paragraph(
        '三套应用均使用 Bun 1.4.0 的 ',
        inlineCode('Bun.build'),
        ' 生产配置构建（target browser、esm、minify），React 注入 ',
        inlineCode('process.env.NODE_ENV=production'),
        '；Vue 产物为 runtime-only（不含模板编译器，等价于 SFC 预编译后的打包结果）。'
      ),
      heading(3, '性能测量口径'),
      paragraph(
        '真实浏览器（Chrome headless）加载本地静态服务，每个框架 3 轮 × 5 次取中位数。挂载耗时从 HTML 起点计时到应用首次渲染完成；更新耗时以调用更新函数为起点、以 DOM 最后一次变更时刻为终点（MutationObserver），不依赖帧等待。'
      ),
      list([
        [inlineCode('add1000'), '：追加 1000 条（单次提交）'],
        [inlineCode('toggle1000'), '：切换前 1000 条完成态（单次提交）'],
        [inlineCode('remove1000'), '：删除前 1000 条（单次提交）'],
        [
          inlineCode('toggleEach1000'),
          '：逐条切换 1000 次（每次一条独立状态更新，用于观察批处理行为）',
        ],
      ]),
      heading(2, '产物体积'),
      table(
        ['框架', '原始体积', 'gzip', 'brotli', 'gzip 相对体积'],
        [
          ['TSone', '37.4 KB', '11.1 KB', '9.9 KB', '18.8%'],
          ['Vue 3.5', '94.9 KB', '36.8 KB', '32.8 KB', '62.2%'],
          ['React 19', '187.4 KB', '59.2 KB', '51.1 KB', '100%'],
        ]
      ),
      paragraph(
        '体积为入口 ',
        inlineCode('main.js'),
        ' 的统计，包含框架运行时；相对体积以 React 的 gzip 体积为 100%。'
      ),
      heading(2, '渲染性能（中位数，ms）'),
      table(
        ['操作', 'TSone', 'Vue 3', 'React 19'],
        [
          ['挂载（1000 条首屏）', '19.9', '43.0', '62.0'],
          ['add1000', '16.6', '11.5', '10.1'],
          ['toggle1000', '18.8', '6.5', '5.4'],
          ['remove1000', '18.8', '6.1', '5.1'],
          ['toggleEach1000（逐条 × 1000）', '8.1', '4.6', '10.2'],
        ]
      ),
      heading(2, '结果解读'),
      heading(3, '产物体积：TSone 优势明显'),
      paragraph(
        'TSone gzip 后仅 11.1 KB，约为 React（59.2 KB）的 1/5.3、Vue（36.8 KB）的 1/3.3。与上一轮测量（10.7 KB）相比增加了约 0.4 KB，对应新增的 watch、Transition、KeepAlive、错误边界与路由守卫等运行时能力。在弱网环境、低端设备与首屏加载场景中，轻量运行时收益明显。'
      ),
      heading(3, '挂载耗时：三者同一量级'),
      paragraph(
        '首屏挂载 1000 条均落在 20-62 ms 区间，TSone 最快。React 相对偏高，主要来自运行时初始化与模块解析开销。'
      ),
      heading(3, '单次批量更新：TSone 较慢但无感知'),
      paragraph(
        '一次性批量操作下三框架均低于 20 ms，用户完全无感知。TSone 约为 Vue/React 的 1.5-3.7 倍（add1000 约 1.5 倍，toggle/remove 约 3 倍），原因是每次更新都会对完整列表进行 VNode 重建与 keyed diff，而 Vue/React 的 keyed 渲染做了针对性优化。'
      ),
      heading(3, '细粒度更新：自动批处理已消除差距'),
      paragraph(
        '逐条更新 1000 次（toggleEach1000）时，TSone 约 8.1 ms，与 Vue（约 4.6 ms）、React（约 10.2 ms）处于同一量级，较上一轮测量（9.7 ms）进一步下降，主要来自 props 值级 diff 与 setProps 批处理优化。TSone 内置自动批处理调度：同一批同步状态变更会在微任务中合并为一次渲染。优化前 effect 同步执行、逐次重渲染时，该指标约为 12 秒；自动批处理落地后提升约 1200 倍，与 Vue 的微任务调度、React 的自动批处理行为一致。'
      ),
      paragraph(
        '注意批处理是异步的：修改 ',
        inlineCode('state'),
        ' 后 DOM 更新在微任务中完成。需要同步读取最新 DOM 时使用 ',
        inlineCode('flushSync()'),
        '，或在异步代码中 ',
        inlineCode('await nextTick()'),
        '。'
      ),
      heading(2, '环境与复现'),
      table(
        ['项目', '值'],
        [
          ['TSone', '0.4.0（工作区源码，含自动批处理）'],
          ['Bun', '1.4.0'],
          ['Chrome', '152.0.7977.83（headless）'],
          ['Vue', '3.5.42'],
          ['React / react-dom', '19.2.8'],
          ['playwright-core', '1.62.1'],
          ['轮数 × 迭代数', '3 × 5'],
        ]
      ),
      callout('note', '复现', [
        '完整脚本位于 ',
        inlineCode('benchmarks/framework-comparison/'),
        '，执行 ',
        inlineCode('bun install && bun bench'),
        ' 即可重新构建、测量并生成 ',
        inlineCode('results.json'),
        '。不同机器与浏览器版本的绝对值会有波动，相对趋势基本稳定。',
      ]),
    ],
  },
];
