import { expect, test } from 'bun:test';
import { pathToFileURL } from 'node:url';
import type { StyleManager } from '../../tsone/lib/style';
import {
  analyzeFixedStyles,
  transformStaticStyles,
} from '../src/static-styles/analyze';
import { frameworkSource, withStyleGraph } from './style-fixture';

const imports = `import { Component } from ${JSON.stringify(frameworkSource)};
  import { StyleManager } from ${JSON.stringify(frameworkSource.replace('/index.ts', '/style/index.ts'))};`;
const component = (body: string) => `${imports}
  export class Widget extends Component { initState(){return {}} render(){return {tag:'div'}}
  initStyles(){${body}} }`;
const css = '.a {\ncolor: red;\n}\n';

test.each([
  component(
    'this.styleManager.addStyle("a", {selector:".a", properties:{color:"red"}});'
  ),
  component(
    'const styles=[{name:"a",selector:".a",properties:{color:"red"}}]; styles.forEach(({name,...style})=>this.styleManager.addStyle(name, style));'
  ),
  `${imports} const styles=[{name:'a',selector:'.a',properties:{color:'red'}}];
   export class Widget extends Component {initState(){return {}} render(){return {tag:'div'}}
   initStyles(){ styles.forEach(({name,...style})=>{this.styleManager.addStyle(name,style);}); }}`,
  `${imports} export const manager=new StyleManager(); manager.addStyle('a',{selector:'.a',properties:{color:'red'}});`,
])(
  'extracts fixed registrations while keeping original evaluation (%#)',
  async (source) => {
    await withStyleGraph(source, (graph) => {
      const groups = analyzeFixedStyles(graph);
      expect(groups).toHaveLength(1);
      expect(groups[0].cssText).toBe(css);
      const transformed = transformStaticStyles(
        source,
        groups,
        () => './fixed.css'
      );
      expect(transformed).toContain('useStaticStyleSheet');
      expect(transformed.replace(/\nif \(typeof [\s\S]*?\}\n/g, '')).toBe(
        source
      );
    });
  }
);

test.each([
  component(
    'this.styleManager.addStyle("a",{selector:".a",properties:{color:this.props.color}});'
  ),
  component(
    'if (true) this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}});'
  ),
  component(
    'const manager=this.styleManager; manager.addStyle("a",{selector:".a",properties:{color:"red"}});'
  ),
  component(
    'this.styleManager.addStyle("a",{selector:".a",properties:{color:Date.now()}});'
  ),
  'class Component {} export class Fake extends Component {initStyles(){this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}})}}',
  component(
    'this.styleManager.styleElement?.remove(); this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}});'
  ),
])('keeps uncertain initializers completely unchanged (%#)', async (source) => {
  await withStyleGraph(source, (graph) => {
    const groups = analyzeFixedStyles(graph);
    expect(groups).toHaveLength(0);
    expect(transformStaticStyles(source, groups, () => './unused.css')).toBe(
      source
    );
  });
});

test('duplicate names preserve Map replacement order and extra calls are retained', async () => {
  const source = component(
    'this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}}); this.styleManager.addStyle("a",{selector:".a",properties:{color:"blue"}}); ensureKeyframes();'
  );
  await withStyleGraph(source, (graph) => {
    const groups = analyzeFixedStyles(graph);
    expect(groups[0].cssText).toBe('.a {\ncolor: blue;\n}\n');
    expect(
      transformStaticStyles(source, groups, () => './fixed.css')
    ).toContain('ensureKeyframes();');
  });
});

test('supports real Bun-minified theme arrays and export aliases', async () => {
  const source = `${imports}
    const theme=Object.freeze({color:'red'});
    function border(color=theme.color){return \`1px solid \${color}\`}
    const styles=[{name:'a',selector:'.a',properties:{...theme,border:border()}}];
    export class Widget extends Component {initState(){return {}} render(){return {tag:'div'}}
      initStyles(){styles.forEach(({name,...style})=>this.styleManager.addStyle(name,style))}}`;
  await withStyleGraph(source, async (_graph, entry) => {
    const built = await Bun.build({
      entrypoints: [entry],
      target: 'browser',
      minify: true,
      external: [
        frameworkSource,
        frameworkSource.replace('/index.ts', '/style/index.ts'),
      ],
    });
    const published = await built.outputs[0].text();
    await withStyleGraph(published, (graph) => {
      const groups = analyzeFixedStyles(graph);
      expect(groups).toHaveLength(1);
      expect(groups[0].cssText).toBe(
        '.a {\ncolor: red;\nborder: 1px solid red;\n}\n'
      );
    });
  });
});

test('retains an isolated call before fixed initialization and skips escaped fresh managers', async () => {
  const source = component(
    'ensureKeyframes(); this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}});'
  );
  await withStyleGraph(source, (graph) => {
    expect(analyzeFixedStyles(graph)[0]?.cssText).toBe(css);
  });
  await withStyleGraph(
    `${imports} const manager=new StyleManager(); const alias=manager;
    manager.addStyle('a',{selector:'.a',properties:{color:'red'}}); export {alias};`,
    (graph) => {
      expect(analyzeFixedStyles(graph)).toHaveLength(0);
    }
  );
});

test('generated code preserves runtime forEach/getter observations and old-manager fallback', async () => {
  const source = `${imports}
    export const styles=[{name:'a',selector:'.a',properties:{color:'red'}},{name:'b',selector:'.b',properties:{color:'blue'}}];
    export class Widget extends Component {
      static latest; initState(){Widget.latest=this;return {}} render(){return {tag:'div'}}
      initStyles(){styles.forEach(({name,...style})=>this.styleManager.addStyle(name,style));}
    }`;
  await withStyleGraph(source, async (graph, entry) => {
    const groups = analyzeFixedStyles(graph);
    expect(groups).toHaveLength(1);
    const transformed = transformStaticStyles(
      source,
      groups,
      () => './fixed.css'
    );
    await Bun.write(entry, transformed);
    const module = (await import(pathToFileURL(entry).href)) as {
      styles: Array<{
        name: string;
        selector: string;
        properties: { color: string };
      }>;
      Widget: {
        new (): { styleManager: StyleManager };
        latest: { styleManager: StyleManager };
      };
    };
    const events: Array<string | number> = [];
    Object.defineProperty(module.styles[1], 'properties', {
      enumerable: true,
      get() {
        events.push(module.Widget.latest.styleManager.styles.size);
        return { color: 'green' };
      },
    });
    module.styles.forEach = function (callback, thisArg) {
      events.push('start');
      Array.prototype.forEach.call(this, callback, thisArg);
      events.push('end');
    };
    const fetch = globalThis.fetch;
    globalThis.fetch = Object.assign(
      async () => new Response(groups[0].cssText),
      { preconnect: fetch.preconnect }
    );
    const instance = new module.Widget();
    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(events).toEqual(['start', 1, 'end']);
      expect(instance.styleManager.styleElement!.textContent).toContain(
        'color: green'
      );
    } finally {
      instance.styleManager.destroy();
      globalThis.fetch = fetch;
    }
    const oldSource = transformed.replace(
      imports,
      `class Component {
      constructor(){this.styleManager={styles:new Map(),addStyle(name,style){this.styles.set(name,style)}};this.initState();this.initStyles();}
    }`
    );
    await Bun.write(entry, oldSource);
    const old = (await import(pathToFileURL(entry).href + '?old=1')) as {
      Widget: new () => { styleManager: { styles: Map<string, unknown> } };
    };
    expect(new old.Widget().styleManager.styles.size).toBe(2);
  });
});
