import { describe, expect, it } from 'bun:test';
import * as publicApi from '../lib';
import type { ElementShortcut, ElementShortcutOptions, HTMLNode } from '../lib';

type TagFactory = (tag: string, options?: ElementShortcutOptions) => HTMLNode;

const api = publicApi as unknown as Record<string, unknown>;

describe('HTML tag helpers', () => {
  it('creates an arbitrary HTML VNode without changing its options', () => {
    const click = () => undefined;
    expect(typeof api.Tag).toBe('function');
    const Tag = api.Tag as TagFactory;

    expect(
      Tag('section', {
        props: { className: 'panel' },
        children: ['Content'],
        listeners: { click },
        key: 'panel',
        slot: 'content',
        directions: { show: true },
      })
    ).toEqual({
      tag: 'section',
      props: { className: 'panel' },
      children: ['Content'],
      listeners: { click },
      key: 'panel',
      slot: 'content',
      directions: { show: true },
    });
  });

  it('maps common tag helpers to their matching HTML tags', () => {
    const helpers = [
      ['Section', 'section'],
      ['Main', 'main'],
      ['Header', 'header'],
      ['Footer', 'footer'],
      ['Nav', 'nav'],
      ['Article', 'article'],
      ['Aside', 'aside'],
      ['H1', 'h1'],
      ['H2', 'h2'],
      ['H3', 'h3'],
      ['H4', 'h4'],
      ['H5', 'h5'],
      ['H6', 'h6'],
      ['Strong', 'strong'],
      ['Em', 'em'],
      ['Small', 'small'],
      ['Pre', 'pre'],
      ['Code', 'code'],
      ['Blockquote', 'blockquote'],
      ['Ul', 'ul'],
      ['Ol', 'ol'],
      ['Li', 'li'],
      ['A', 'a'],
      ['Img', 'img'],
      ['Form', 'form'],
      ['Label', 'label'],
      ['Textarea', 'textarea'],
      ['Select', 'select'],
      ['Option', 'option'],
      ['Table', 'table'],
      ['Thead', 'thead'],
      ['Tbody', 'tbody'],
      ['Tr', 'tr'],
      ['Th', 'th'],
      ['Td', 'td'],
    ] as const;

    for (const [name, tag] of helpers) {
      expect(typeof api[name]).toBe('function');
      const helper = api[name] as ElementShortcut;
      expect(helper({ props: { id: `${tag}-node` } })).toEqual({
        tag,
        props: { id: `${tag}-node` },
      });
    }
  });
});
