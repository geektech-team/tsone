import {
  Component,
  createApp,
  each,
  h,
  type VNode,
} from '@geektech/tsone';

interface RankItem {
  id: number;
  name: string;
  score: number;
  change: number;
}

interface LeaderboardState {
  ranks: RankItem[];
  lastUpdated: string;
}

/** 行点击事件：h5 的 DOM 事件可用 currentTarget.dataset 读取。 */
interface TapEvent {
  currentTarget: { dataset: Record<string, string | number | undefined> };
}

// 静态数据仅作演示，运行时通过 initState 初始化。
const INITIAL_RANKS: RankItem[] = [
  { id: 1, name: '星尘观察站', score: 9820, change: 3 },
  { id: 2, name: '橘子汽水', score: 9545, change: -1 },
  { id: 3, name: '深夜代码', score: 9310, change: 2 },
  { id: 4, name: '像素花园', score: 9050, change: 0 },
  { id: 5, name: '慢速快门', score: 8760, change: -2 },
  { id: 6, name: '老唱片', score: 8420, change: 4 },
  { id: 7, name: '雨夜电台', score: 8190, change: 1 },
  { id: 8, name: '凌晨四点半', score: 7910, change: -3 },
];

class LeaderboardApp extends Component<object, LeaderboardState> {
  protected initState(): LeaderboardState {
    return { ranks: INITIAL_RANKS, lastUpdated: '09:30' };
  }

  protected initStyles(): void {
    this.styleManager.addStyle('board-body', {
      selector: 'body',
      properties: {
        margin: 0,
        background: '#f4f6fb',
        color: '#1c2333',
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      },
    });
    this.styleManager.addStyle('board-shell', {
      selector: '.board-shell',
      properties: {
        background: '#f4f6fb',
        margin: '0 auto',
        maxWidth: 720,
        padding: '24px 16px 40px',
      },
    });
    this.styleManager.addStyle('board-title', {
      selector: '.board-title',
      properties: {
        fontSize: 28,
        letterSpacing: 0,
        lineHeight: 1.2,
        margin: '0 0 4px',
      },
    });
    this.styleManager.addStyle('board-subtitle', {
      selector: '.board-subtitle',
      properties: {
        color: '#6b7280',
        fontSize: 14,
        margin: '0 0 16px',
      },
    });
    this.styleManager.addStyle('board-stats', {
      selector: '.board-stats',
      properties: {
        display: 'flex',
        gap: 12,
        marginBottom: 16,
      },
    });
    this.styleManager.addStyle('stat-card', {
      selector: '.stat-card',
      properties: {
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(28, 35, 51, 0.08)',
        flex: 1,
        padding: '12px 16px',
      },
    });
    this.styleManager.addStyle('stat-value', {
      selector: '.stat-value',
      properties: {
        display: 'block',
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1.3,
      },
    });
    this.styleManager.addStyle('stat-label', {
      selector: '.stat-label',
      properties: {
        color: '#9ca3af',
        display: 'block',
        fontSize: 12,
        marginTop: 2,
      },
    });
    this.styleManager.addStyle('rank-list', {
      selector: '.rank-list',
      properties: {
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(28, 35, 51, 0.08)',
        overflow: 'hidden',
      },
    });
    this.styleManager.addStyle('rank-row', {
      selector: '.rank-row',
      properties: {
        alignItems: 'center',
        borderBottom: '1px solid #eef1f6',
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
      },
    });
    this.styleManager.addStyle('rank-row-top', {
      selector: '.rank-row.top',
      properties: {
        background: '#fffaf0',
      },
    });
    this.styleManager.addStyle('rank-index', {
      selector: '.rank-index',
      properties: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: 700,
        minWidth: 28,
        textAlign: 'center',
      },
    });
    this.styleManager.addStyle('rank-name', {
      selector: '.rank-name',
      properties: {
        flex: 1,
        fontSize: 15,
      },
    });
    this.styleManager.addStyle('rank-delta-up', {
      selector: '.rank-delta.up',
      properties: {
        color: '#d64545',
        fontSize: 13,
        minWidth: 36,
        textAlign: 'right',
      },
    });
    this.styleManager.addStyle('rank-delta-down', {
      selector: '.rank-delta.down',
      properties: {
        color: '#2f7c39',
        fontSize: 13,
        minWidth: 36,
        textAlign: 'right',
      },
    });
    this.styleManager.addStyle('rank-score', {
      selector: '.rank-score',
      properties: {
        color: '#1c2333',
        fontSize: 16,
        fontWeight: 700,
        minWidth: 56,
        textAlign: 'right',
      },
    });
    this.styleManager.addStyle('rank-refresh', {
      selector: '.rank-refresh',
      properties: {
        background: '#2563eb',
        border: 0,
        borderRadius: 12,
        color: '#ffffff',
        fontSize: 15,
        marginTop: 16,
        padding: '12px 20px',
        width: '100%',
      },
    });
  }

  protected render(): VNode {
    const ranks = this.state.ranks;
    return h('main', { className: 'board-shell' }, [
      h('header', {}, [
        h('h1', { className: 'board-title' }, ['数据排行榜']),
        h(
          'p',
          { className: 'board-subtitle' },
          [`更新于 ${this.state.lastUpdated} · 点击刷新随机重排`]
        ),
      ]),
      h('section', { className: 'board-stats' }, [
        h('div', { className: 'stat-card' }, [
          h('strong', { className: 'stat-value' }, [`${ranks.length}`]),
          h('span', { className: 'stat-label' }, ['上榜项目']),
        ]),
        h('div', { className: 'stat-card' }, [
          h('strong', { className: 'stat-value' }, ['Top 1']),
          h('span', { className: 'stat-label' }, ['点击刷新，见证排名变化']),
        ]),
      ]),
      h(
        'section',
        { className: 'rank-list' },
        each(
          ranks,
          (item, index) =>
            h(
              'div',
              {
                className: index < 3 ? 'rank-row top' : 'rank-row',
                dataId: item.id,
                onClick: (e) => this.selectRow(e as unknown as TapEvent),
              },
              [
                h('span', { className: 'rank-index' }, [`${index + 1}`]),
                h('span', { className: 'rank-name' }, [item.name]),
                h(
                  'span',
                  {
                    className:
                      item.change > 0 ? 'rank-delta up' : 'rank-delta down',
                  },
                  [`${item.change > 0 ? '+' : ''}${item.change}`]
                ),
                h('span', { className: 'rank-score' }, [`${item.score}`]),
              ]
            ),
          (item) => item.id
        )
      ),
      h(
        'button',
        { className: 'rank-refresh', onClick: () => this.refresh() },
        ['刷新排行']
      ),
    ]);
  }

  protected refresh(): void {
    const ranks = [...this.state.ranks];
    for (let index = ranks.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      const current = ranks[index];
      ranks[index] = ranks[target];
      ranks[target] = current;
    }
    this.setState({ ranks, lastUpdated: '刚刚' });
  }

  /** 榜单行点击：通过 data-id 读取 currentTarget.dataset。 */
  protected selectRow(e: TapEvent): void {
    const raw = e.currentTarget.dataset.id;
    const id = typeof raw === 'number' ? raw : Number(raw);
    const item = this.state.ranks.find((rank) => rank.id === id);
    if (item) {
      this.setState({ lastUpdated: `选中：${item.name}` });
    }
  }
}

export const app = createApp({
  root: LeaderboardApp,
  document: {
    lang: 'zh-CN',
    title: '数据排行榜 - TSone',
    description: 'TSone 数据排行榜首页示例',
  },
});

app.mount();
