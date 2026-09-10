import {
  callout,
  diagram,
  heading,
  inlineCode,
  link,
  list,
  paragraph,
  svgEl,
  t,
  type BackOneDocDiagramNode,
  type BackOneDocPage,
} from './types';

const SURFACE =
  'fill:var(--backone-docs-surface);stroke:var(--backone-docs-border);stroke-width:1';
const CHIP =
  'fill:var(--backone-docs-accent-soft);stroke:var(--backone-docs-accent);stroke-width:1';
const ACCENT = 'fill:var(--backone-docs-accent)';
const TEXT = 'fill:var(--backone-docs-text)';
const MUTED = 'fill:var(--backone-docs-muted)';
const ARROW = 'stroke:var(--backone-docs-accent);stroke-width:2';

/** 分层架构图：应用层 / 公开 API / 框架核心 / Bun 运行时。 */
const architectureSvg: BackOneDocDiagramNode = svgEl(
  'svg',
  {
    viewBox: '0 0 760 470',
    role: 'img',
    'aria-label': 'BackOne layered architecture',
    xmlns: 'http://www.w3.org/2000/svg',
  },
  [
    // 请求/响应轨道（左进右出，request 自底向上、response 自顶向下）
    svgEl('line', { x1: 75, y1: 365, x2: 75, y2: 52, style: ARROW }),
    svgEl('polygon', { points: '75,38 65,60 85,60', style: ACCENT }),
    svgEl(
      'text',
      {
        x: 75,
        y: 26,
        'text-anchor': 'middle',
        style: `${MUTED};font-size:12px`,
      },
      ['request']
    ),
    svgEl('line', { x1: 735, y1: 52, x2: 735, y2: 362, style: ARROW }),
    svgEl('polygon', { points: '735,382 725,360 745,360', style: ACCENT }),
    svgEl(
      'text',
      {
        x: 735,
        y: 415,
        'text-anchor': 'middle',
        style: `${MUTED};font-size:12px`,
      },
      ['response']
    ),

    // 层 1：你的应用
    svgEl('rect', {
      x: 150,
      y: 20,
      width: 560,
      height: 64,
      rx: 12,
      style: SURFACE,
    }),
    svgEl(
      'text',
      {
        x: 166,
        y: 42,
        style: `${ACCENT};font-size:13px;font-weight:600`,
      },
      ['Your App']
    ),
    ...[
      ['Routes', 166],
      ['Handlers', 296],
      ['Middleware', 426],
      ['Static', 556],
    ].map(([label, x]) =>
      svgEl('g', {}, [
        svgEl('rect', {
          x: x as number,
          y: 50,
          width: 120,
          height: 24,
          rx: 6,
          style: CHIP,
        }),
        svgEl(
          'text',
          {
            x: (x as number) + 60,
            y: 66,
            'text-anchor': 'middle',
            style: `${TEXT};font-size:12px`,
          },
          [label as string]
        ),
      ])
    ),

    // 层 2：公开 API
    svgEl('rect', {
      x: 150,
      y: 104,
      width: 560,
      height: 64,
      rx: 12,
      style: SURFACE,
    }),
    svgEl(
      'text',
      {
        x: 166,
        y: 126,
        style: `${ACCENT};font-size:13px;font-weight:600`,
      },
      ['Public API']
    ),
    ...[
      ['createServer', 166],
      ['get · post · all', 348],
      ['use · serveStatic', 530],
    ].map(([label, x]) =>
      svgEl('g', {}, [
        svgEl('rect', {
          x: x as number,
          y: 134,
          width: 170,
          height: 24,
          rx: 6,
          style: CHIP,
        }),
        svgEl(
          'text',
          {
            x: (x as number) + 85,
            y: 150,
            'text-anchor': 'middle',
            style: `${TEXT};font-size:12px`,
          },
          [label as string]
        ),
      ])
    ),

    // 层 3：框架核心
    svgEl('rect', {
      x: 150,
      y: 188,
      width: 560,
      height: 88,
      rx: 12,
      style: SURFACE,
    }),
    svgEl(
      'text',
      {
        x: 166,
        y: 210,
        style: `${ACCENT};font-size:13px;font-weight:600`,
      },
      ['Framework Core']
    ),
    ...[
      ['Router · trie', 166],
      ['Middleware · onion', 296],
      ['Context · lazy', 426],
      ['Serializer', 556],
    ].map(([label, x]) =>
      svgEl('g', {}, [
        svgEl('rect', {
          x: x as number,
          y: 220,
          width: 120,
          height: 24,
          rx: 6,
          style: CHIP,
        }),
        svgEl(
          'text',
          {
            x: (x as number) + 60,
            y: 236,
            'text-anchor': 'middle',
            style: `${TEXT};font-size:12px`,
          },
          [label as string]
        ),
      ])
    ),
    ...[
      ['404 · 405 fallback', 166],
      ['params · query · body', 348],
      ['Response builders', 530],
    ].map(([label, x]) =>
      svgEl('g', {}, [
        svgEl('rect', {
          x: x as number,
          y: 250,
          width: 170,
          height: 24,
          rx: 6,
          style: CHIP,
        }),
        svgEl(
          'text',
          {
            x: (x as number) + 85,
            y: 266,
            'text-anchor': 'middle',
            style: `${TEXT};font-size:12px`,
          },
          [label as string]
        ),
      ])
    ),

    // 层 4：Bun 运行时
    svgEl('rect', {
      x: 150,
      y: 296,
      width: 560,
      height: 64,
      rx: 12,
      style: SURFACE,
    }),
    svgEl(
      'text',
      {
        x: 166,
        y: 318,
        style: `${ACCENT};font-size:13px;font-weight:600`,
      },
      ['Bun Runtime']
    ),
    ...[
      ['Bun.serve', 166],
      ['Bun.file', 296],
      ['Web Streams', 426],
      ['gzip', 556],
    ].map(([label, x]) =>
      svgEl('g', {}, [
        svgEl('rect', {
          x: x as number,
          y: 326,
          width: 120,
          height: 24,
          rx: 6,
          style: CHIP,
        }),
        svgEl(
          'text',
          {
            x: (x as number) + 60,
            y: 342,
            'text-anchor': 'middle',
            style: `${TEXT};font-size:12px`,
          },
          [label as string]
        ),
      ])
    ),

    // 底部说明
    svgEl(
      'text',
      {
        x: 380,
        y: 415,
        'text-anchor': 'middle',
        style: `${MUTED};font-size:12.5px`,
      },
      [
        'Request: Client → Bun.serve → Framework Core → Your App   ·   Response travels back along the same path',
      ]
    ),
  ]
);

/** 请求生命周期图：一次请求从进入到响应返回的完整管线。 */
const lifecycleSvg: BackOneDocDiagramNode = svgEl(
  'svg',
  {
    viewBox: '0 0 760 300',
    role: 'img',
    'aria-label': 'BackOne request lifecycle',
    xmlns: 'http://www.w3.org/2000/svg',
  },
  [
    ...[
      ['Request', 'Bun.serve', 'Request arrives', 'from the client'],
      ['Route match', 'radix trie', 'static > :param > *', 'writes ctx.params'],
      [
        'Middleware',
        'onion · next()',
        'runs in use() order',
        'returns bubble out',
      ],
      ['Handler', 'your code', 'Response passes through', 'zero wrapping'],
      [
        'Serialize',
        'JSON · text · 204',
        'merges headers · status',
        'content-type auto',
      ],
      ['Response', 'stream · body', 'sent back to client', 'streams supported'],
    ].map(([title, sub, note1, note2], index) => {
      const x = 33 + index * 118;
      return svgEl('g', {}, [
        svgEl('rect', {
          x,
          y: 40,
          width: 104,
          height: 70,
          rx: 10,
          style: SURFACE,
        }),
        svgEl(
          'text',
          {
            x: x + 52,
            y: 66,
            'text-anchor': 'middle',
            style: `${ACCENT};font-size:12.5px;font-weight:600`,
          },
          [title]
        ),
        svgEl(
          'text',
          {
            x: x + 52,
            y: 88,
            'text-anchor': 'middle',
            style: `${MUTED};font-size:11px`,
          },
          [sub]
        ),
        svgEl(
          'text',
          {
            x: x + 52,
            y: 140,
            'text-anchor': 'middle',
            style: `${MUTED};font-size:11px`,
          },
          [note1]
        ),
        svgEl(
          'text',
          {
            x: x + 52,
            y: 158,
            'text-anchor': 'middle',
            style: `${MUTED};font-size:11px`,
          },
          [note2]
        ),
      ]);
    }),
    ...[0, 1, 2, 3, 4].map((index) => {
      const x = 33 + index * 118;
      return svgEl('g', {}, [
        svgEl('line', {
          x1: x + 106,
          y1: 75,
          x2: x + 111,
          y2: 75,
          style: ARROW,
        }),
        svgEl('polygon', {
          points: `${x + 110},68 ${x + 110},82 ${x + 116},75`,
          style: ACCENT,
        }),
      ]);
    }),
    // 兜底语义
    svgEl('rect', {
      x: 60,
      y: 200,
      width: 640,
      height: 56,
      rx: 10,
      style: CHIP,
    }),
    svgEl(
      'text',
      {
        x: 380,
        y: 234,
        'text-anchor': 'middle',
        style: `${TEXT};font-size:12.5px`,
      },
      [
        'No route → 404 JSON  ·  Wrong method → 405 + Allow  ·  Unknown error → 500 (hidden in production)',
      ]
    ),
  ]
);

export const architecturePage: BackOneDocPage = {
  path: '/guide/architecture/',
  title: t('架构', 'Architecture'),
  description: t(
    'BackOne 的分层设计与一次请求的完整生命周期。',
    'BackOne’s layered design and the full lifecycle of a request.'
  ),
  section: 'guide',
  sectionOrder: 1,
  order: 0,
  body: [
    heading(1, 'architecture', t('架构', 'Architecture')),
    paragraph(
      t(
        'BackOne 是「薄壳」设计：不重复实现 HTTP 解析、事件循环与文件 IO，这些全部交给 Bun 运行时。框架层只负责三件事——路由匹配、中间件编排、请求上下文与响应序列化，因此简单路由的框架开销可以压到极小。',
        'BackOne follows a “thin shell” design: it does not re-implement HTTP parsing, the event loop or file IO — the Bun runtime owns all of that. The framework only does three things: route matching, middleware orchestration, and request context / response serialization, keeping framework overhead on simple routes minimal.'
      )
    ),
    heading(2, 'layers', t('分层架构', 'Layered architecture')),
    diagram(
      t(
        '图 1 · 分层架构（示意）',
        'Figure 1 · Layered architecture (schematic)'
      ),
      architectureSvg
    ),
    paragraph(
      t(
        '自上而下每一层只依赖下一层：',
        'Each layer depends only on the one below it:'
      )
    ),
    list([
      [
        inlineCode('你的应用'),
        t(
          '：注册路由、处理器与中间件，决定业务行为。',
          ': registers routes, handlers and middleware, deciding business behavior.'
        ),
      ],
      [
        inlineCode('公开 API'),
        t(
          '：createServer、get/post/all、use/useLogger/useCors/serveStatic 等链式方法。',
          ': createServer, get/post/all, use/useLogger/useCors/serveStatic and other chainable methods.'
        ),
      ],
      [
        inlineCode('框架核心'),
        t(
          '：分段基数树路由、洋葱模型中间件链、惰性解析的 Context、统一响应序列化与 404/405/500 兜底。',
          ': segment radix-tree routing, the onion-model middleware chain, the lazily-parsed Context, unified response serialization, and 404/405/500 fallbacks.'
        ),
      ],
      [
        inlineCode('Bun 运行时'),
        t(
          '：Bun.serve 接收连接、Bun.file 零拷贝静态文件、Web Streams 流式响应与内置 gzip。',
          ': Bun.serve accepts connections, Bun.file serves static files zero-copy, Web Streams powers streaming responses, and gzip is built in.'
        ),
      ],
    ]),
    heading(2, 'lifecycle', t('请求生命周期', 'Request lifecycle')),
    diagram(
      t(
        '图 2 · 请求生命周期（示意）',
        'Figure 2 · Request lifecycle (schematic)'
      ),
      lifecycleSvg
    ),
    paragraph(
      t(
        '一次请求按以下顺序穿过框架，任何一步都可能直接产出响应并短路返回：',
        'A request passes through the framework in this order, and any step may produce a response directly and short-circuit:'
      )
    ),
    list([
      [
        t('路由匹配：', 'Route matching: '),
        inlineCode(':param'),
        t(' 与 ', ' and '),
        inlineCode('*'),
        t(' 捕获的段写入 ', ' captures are written to '),
        inlineCode('ctx.params'),
        t(
          '；未匹配路径由链尾返回 404。',
          '; unmatched paths get 404 from the chain tail.'
        ),
      ],
      [
        t('中间件链：', 'Middleware chain: '),
        t('按注册顺序执行，', 'runs in registration order, '),
        inlineCode('next()'),
        t(
          ' 进入下一层，返回值从内向外冒泡。',
          ' enters the next layer, and return values bubble outward.'
        ),
      ],
      [
        t('处理器：', 'Handler: '),
        t(
          '返回 Response 零开销直通，原始值自动序列化。',
          'returning a Response passes through with zero overhead; raw values are serialized automatically.'
        ),
      ],
      [
        t('序列化与兜底：', 'Serialization and fallback: '),
        t(
          '方法不匹配返回 405 + Allow，未知异常返回 500（生产环境不泄漏内部信息）。',
          'wrong methods get 405 + Allow, unknown exceptions get 500 (no internals leak in production).'
        ),
      ],
    ]),
    heading(2, 'tradeoffs', t('设计取舍', 'Design trade-offs')),
    callout('note', t('不重造轮子', 'Don’t reinvent the wheel'), [
      t(
        '一切 Bun 已做好的事（连接管理、静态文件、压缩、流式 IO）框架都不重复实现；框架把精力集中在类型安全、可组合的中间件与可测试的请求管线上。',
        'Everything Bun already does well — connection management, static files, compression, streaming IO — the framework does not re-implement; its effort goes into type safety, composable middleware, and a testable request pipeline.'
      ),
    ]),
    paragraph(
      link(
        t(
          '性能手段的具体取舍见高性能设计',
          'See Performance design for the concrete trade-offs'
        ),
        '/guide/performance/'
      ),
      t('。', '.')
    ),
  ],
};
