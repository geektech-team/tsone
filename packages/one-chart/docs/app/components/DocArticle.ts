import { Component, type VNode } from '@geektech/tsone';
import type { OneChartDocDemoName } from '../content';
import {
  localize,
  sectionLabel,
  type OneChartDocBlock,
  type OneChartDocInline,
  type OneChartDocLocale,
  type OneChartDocPage,
} from '../content';
import { pick } from '../locale';
import { OneBarChart, OneLineChart, OnePieChart, OneRadarChart } from '../../../lib';

export interface DocArticleProps {
  page: OneChartDocPage;
  locale: OneChartDocLocale;
}

const DEMO_CHARTS: Record<OneChartDocDemoName, { component: unknown; props: object }> = {
  bar: {
    component: OneBarChart,
    props: {
      title: '季度销量',
      categories: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        { name: '华东', data: [120, 200, 150, 280] },
        { name: '华南', data: [80, 110, 130, 160] },
      ],
    },
  },
  line: {
    component: OneLineChart,
    props: {
      title: '访问趋势',
      categories: ['周一', '周二', '周三', '周四', '周五'],
      series: [{ name: '访问量', data: [120, 200, 150, 280, 190] }],
      curve: 'smooth',
      fill: true,
      showPoints: true,
    },
  },
  pie: {
    component: OnePieChart,
    props: {
      title: '渠道占比',
      data: [
        { name: '华东', value: 30 },
        { name: '华南', value: 50 },
        { name: '华北', value: 20 },
      ],
      showLabels: true,
      innerRadius: 'auto',
    },
  },
  radar: {
    component: OneRadarChart,
    props: {
      title: '能力对比',
      indicators: ['速度', '力量', '技巧', '耐力', '智力'],
      series: [
        { name: '战士', data: [80, 60, 90, 70, 85] },
        { name: '法师', data: [50, 80, 60, 95, 60] },
      ],
      showPoints: true,
    },
  },
};

export class DocArticle extends Component<DocArticleProps> {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {}

  protected render(): VNode {
    const { page, locale } = this.props;

    return {
      tag: 'article',
      props: { className: 'one-chart-doc-article' },
      children: [
        {
          tag: 'p',
          props: { className: 'one-chart-docs-section-label' },
          children: [sectionLabel(page.section, locale)],
        },
        ...page.body.map((block) => this.renderBlock(block)),
      ],
    };
  }

  private renderBlock(block: OneChartDocBlock): VNode {
    const { locale } = this.props;

    switch (block.type) {
      case 'heading':
        return {
          tag: `h${block.level}`,
          props: { id: block.id },
          children: [localize(block.text, locale)],
        };
      case 'paragraph':
        return { tag: 'p', children: this.renderInline(block.content) };
      case 'list':
        return {
          tag: 'ul',
          children: block.items.map((item) => ({
            tag: 'li',
            children: this.renderInline(item),
          })),
        };
      case 'code':
        return {
          tag: 'pre',
          children: [
            {
              tag: 'code',
              props: { className: `language-${block.language}` },
              children: [block.code],
            },
          ],
        };
      case 'callout':
        return {
          tag: 'aside',
          props: {
            className: `one-chart-docs-callout one-chart-docs-callout--${block.kind}`,
          },
          children: [
            { tag: 'strong', children: [localize(block.title, locale)] },
            { tag: 'p', children: this.renderInline(block.body) },
          ],
        };
      case 'api-table':
        return this.renderApiTable(block);
      case 'demo':
        return this.renderDemo(block.component, block.interactive === true, block.source);
      default:
        return assertNever(block);
    }
  }

  private renderApiTable(
    block: Extract<OneChartDocBlock, { type: 'api-table' }>
  ): VNode {
    const { locale } = this.props;

    return {
      tag: 'div',
      props: { className: 'one-chart-docs-api-scroll' },
      children: [
        {
          tag: 'table',
          props: { className: 'one-chart-docs-api-table' },
          children: [
            { tag: 'caption', children: [localize(block.caption, locale)] },
            {
              tag: 'thead',
              children: [
                {
                  tag: 'tr',
                  children: [
                    {
                      tag: 'th',
                      props: { scope: 'col' },
                      children: [pick('名称', 'Name', locale)],
                    },
                    {
                      tag: 'th',
                      props: { scope: 'col' },
                      children: [pick('签名', 'Signature', locale)],
                    },
                    {
                      tag: 'th',
                      props: { scope: 'col' },
                      children: [pick('说明', 'Description', locale)],
                    },
                  ],
                },
              ],
            },
            {
              tag: 'tbody',
              children: block.rows.map((row) => ({
                tag: 'tr',
                children: [
                  { tag: 'td', children: [{ tag: 'code', children: [row.name] }] },
                  { tag: 'td', children: [{ tag: 'code', children: [row.signature] }] },
                  { tag: 'td', children: [localize(row.description, locale)] },
                ],
              })),
            },
          ],
        },
      ],
    };
  }

  private renderInline(content: OneChartDocInline[]): Array<VNode | string> {
    const { locale } = this.props;

    return content.map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if ('type' in item) {
        if (item.type === 'code') {
          return { tag: 'code', children: [item.text] };
        }
        return {
          tag: 'a',
          props: { href: item.href },
          children: [localize(item.text, locale)],
        };
      }

      return localize(item, locale);
    });
  }

  private renderDemo(
    component: OneChartDocDemoName,
    interactive: boolean,
    source: Extract<OneChartDocBlock, { type: 'demo' }>['source']
  ): VNode {
    const { locale } = this.props;

    return {
      tag: 'section',
      props: {
        className: 'one-chart-docs-demo',
        'aria-label': pick(`${component} 图表预览`, `${component} demo`, locale),
      },
      children: [
        {
          tag: 'div',
          props: { className: 'one-chart-docs-demo-preview' },
          children: [this.renderStaticPreview(component)],
        },
        ...(interactive
          ? [
              {
                tag: 'div',
                props: { 'data-one-chart-demo': component },
              } as VNode,
            ]
          : []),
        {
          tag: 'details',
          props: {
            className: 'one-chart-docs-demo-source',
            'data-one-chart-demo-source': component,
          },
          children: [
            {
              tag: 'summary',
              children: [
                pick('查看代码', 'View code', locale),
              ],
            },
            {
              tag: 'pre',
              children: [
                {
                  tag: 'code',
                  props: { className: `language-${source.language}` },
                  children: [source.code],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  private renderStaticPreview(component: OneChartDocDemoName): VNode {
    const demoChart = DEMO_CHARTS[component];
    if (!demoChart) {
      return { tag: 'div', children: [] };
    }

    return {
      component: demoChart.component as never,
      props: demoChart.props,
    };
  }
}

function assertNever(value: never): never {
  throw new Error(`Unknown One Chart doc block: ${JSON.stringify(value)}`);
}
