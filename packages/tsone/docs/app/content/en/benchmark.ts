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

export const enBenchmarkPages: DocPage[] = [
  {
    path: '/benchmark/framework-comparison/',
    title: 'Framework Comparison: TSone × Vue × React',
    description:
      'Bundle size and rendering performance of the same todo app built with TSone, Vue 3, and React.',
    section: benchmarkSection,
    sectionOrder: benchmarkSectionOrder,
    order: 1,
    body: [
      heading(1, 'Framework Comparison: TSone × Vue × React'),
      paragraph(
        'The same todo-list app was implemented with TSone, Vue 3, and React 19 to compare ',
        inlineCode('bundle size'),
        ' and ',
        inlineCode('rendering performance'),
        '. The experiment scripts, the three implementations, and the full raw results live in ',
        inlineCode('benchmarks/framework-comparison/'),
        ' and are reproducible with a single command.',
      ),
      heading(2, 'Experiment Design'),
      heading(3, 'App Under Test'),
      list([
        ['Mounts with 1000 todo items (Task 0 ~ Task 999); each row has a checkbox, a title, and a delete button'],
        ['Footer shows the total item count and the active (incomplete) count'],
        ['All three apps produce the same DOM structure; only the implementation differs (TSone class component / Vue Composition API / React function component)'],
      ]),
      heading(3, 'Build Setup'),
      paragraph(
        'All three apps are built with the production configuration of ',
        inlineCode('Bun.build'),
        ' (Bun 1.4.0, target browser, esm, minify); React injects ',
        inlineCode('process.env.NODE_ENV=production'),
        '. The Vue bundle is runtime-only (no template compiler), equivalent to a bundled app whose SFCs were pre-compiled.',
      ),
      heading(3, 'Measurement Methodology'),
      paragraph(
        'A real browser (headless Chrome) loads each app from a local static server; every framework runs 3 rounds × 5 iterations and the median is reported. Mount time is measured from an inline timestamp in the HTML head until the first render completes; update time is measured from the moment the update function is called until the last DOM mutation (tracked by a MutationObserver), with no frame-wait floor.'
      ),
      list([
        [inlineCode('add1000'), ': append 1000 items (single commit)'],
        [inlineCode('toggle1000'), ': toggle the first 1000 items (single commit)'],
        [inlineCode('remove1000'), ': remove the first 1000 items (single commit)'],
        [inlineCode('toggleEach1000'), ': toggle 1000 items one by one (one independent update each, to observe batching behavior)'],
      ]),
      heading(2, 'Bundle Size'),
      table(
        ['Framework', 'Raw', 'gzip', 'brotli', 'gzip relative'],
        [
          ['TSone', '35.8 KB', '10.7 KB', '9.5 KB', '18.1%'],
          ['Vue 3.5', '94.9 KB', '36.8 KB', '32.8 KB', '62.2%'],
          ['React 19', '187.4 KB', '59.2 KB', '51.1 KB', '100%'],
        ]
      ),
      paragraph(
        'Sizes are for the entry ',
        inlineCode('main.js'),
        ', including the framework runtime; relative size uses React gzip as 100%.',
      ),
      heading(2, 'Rendering Performance (median, ms)'),
      table(
        ['Operation', 'TSone', 'Vue 3', 'React 19'],
        [
          ['Mount (1000 items)', '17.4', '22.4', '67.8'],
          ['add1000', '16.4', '9.4', '9.4'],
          ['toggle1000', '18.2', '6.0', '6.2'],
          ['remove1000', '17.8', '5.9', '4.8'],
          ['toggleEach1000 (one by one × 1000)', '9.7', '4.1', '10.5'],
        ]
      ),
      heading(2, 'Interpretation'),
      heading(3, 'Bundle Size: A Clear Win for TSone'),
      paragraph(
        'TSone is 10.7 KB after gzip — about 1/5.5 of React (59.2 KB) and 1/3.4 of Vue (36.8 KB). The smaller runtime pays off on slow networks, low-end devices, and first-load scenarios.'
      ),
      heading(3, 'Mount Time: Same Order of Magnitude'),
      paragraph(
        'Mounting 1000 items lands in the 17-68 ms range for all three frameworks, with TSone the fastest. React is relatively higher, mostly due to runtime initialization and module parsing.'
      ),
      heading(3, 'Single Batch Updates: Slower but Imperceptible'),
      paragraph(
        'One-shot bulk operations stay below 20 ms in all three frameworks. TSone is roughly 2-4× slower than Vue/React because every update rebuilds and diffs the full list of VNodes, whereas Vue/React benefit from optimized keyed rendering.'
      ),
      heading(3, 'Fine-Grained Updates: Automatic Batching Closes the Gap'),
      paragraph(
        'Updating 1000 items one by one (toggleEach1000) takes about 9.7 ms in TSone, in the same league as Vue (~4 ms) and React (~10 ms). TSone now ships a built-in automatic batching scheduler: a burst of synchronous state changes is merged into a single render on a microtask. Before this optimization the effect ran synchronously and re-rendered on every change, putting this metric at about 12 seconds; automatic batching improves it by roughly 1200×, matching Vue\u2019s microtask scheduler and React\u2019s automatic batching.'
      ),
      paragraph(
        'Note that batching is asynchronous: DOM updates land on a microtask after ',
        inlineCode('state'),
        ' changes. Use ',
        inlineCode('flushSync()'),
        ' when you need to read the latest DOM synchronously, or ',
        inlineCode('await nextTick()'),
        ' in async code.',
      ),
      heading(2, 'Environment and Reproduction'),
      table(
        ['Item', 'Value'],
        [
          ['TSone', '0.2.1 (workspace source, with automatic batching)'],
          ['Bun', '1.4.0'],
          ['Chrome', '152.0.7977.82 (headless)'],
          ['Vue', '3.5.42'],
          ['React / react-dom', '19.2.8'],
          ['playwright-core', '1.62.1'],
          ['Rounds × Iterations', '3 × 5'],
        ]
      ),
      callout('note', 'Reproduce', [
        'The full scripts live in ',
        inlineCode('benchmarks/framework-comparison/'),
        ': run ',
        inlineCode('bun install && bun bench'),
        ' to rebuild, measure, and generate ',
        inlineCode('results.json'),
        '. Absolute numbers vary by machine and browser version, but the relative trends are stable.',
      ]),
    ],
  },
];
