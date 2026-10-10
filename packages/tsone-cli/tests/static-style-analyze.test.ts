import { expect, test } from 'bun:test';
import { analyzeFixedStyles, transformStaticStyles } from '../src/static-styles/analyze';
import { frameworkSource, withStyleGraph } from './style-fixture';

const imports = `import { Component } from ${JSON.stringify(frameworkSource)};
  import { StyleManager } from ${JSON.stringify(frameworkSource.replace('/index.ts', '/style/index.ts'))};`;
const component = (body: string) => `${imports}
  export class Widget extends Component { initState(){return {}} render(){return {tag:'div'}}
  initStyles(){${body}} }`;
const css = '.a {\ncolor: red;\n}\n';

test.each([
  component('this.styleManager.addStyle("a", {selector:".a", properties:{color:"red"}});'),
  component('const styles=[{name:"a",selector:".a",properties:{color:"red"}}]; styles.forEach(({name,...style})=>this.styleManager.addStyle(name, style));'),
  `${imports} const styles=[{name:'a',selector:'.a',properties:{color:'red'}}];
   export class Widget extends Component {initState(){return {}} render(){return {tag:'div'}}
   initStyles(){ styles.forEach(({name,...style})=>{this.styleManager.addStyle(name,style);}); }}`,
  `${imports} export const manager=new StyleManager(); manager.addStyle('a',{selector:'.a',properties:{color:'red'}});`,
])('extracts fixed registrations while keeping original evaluation (%#)', async source => {
  await withStyleGraph(source, graph => {
    const groups = analyzeFixedStyles(graph);
    expect(groups).toHaveLength(1);
    expect(groups[0].cssText).toBe(css);
    const transformed = transformStaticStyles(source, groups, () => './fixed.css');
    expect(transformed).toContain('useStaticStyleSheet');
    expect(transformed.replace(/\nif \(typeof [\s\S]*?\}\n/g, '')).toBe(source);
  });
});

test.each([
  component('this.styleManager.addStyle("a",{selector:".a",properties:{color:this.props.color}});'),
  component('if (true) this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}});'),
  component('const manager=this.styleManager; manager.addStyle("a",{selector:".a",properties:{color:"red"}});'),
  component('this.styleManager.addStyle("a",{selector:".a",properties:{color:Date.now()}});'),
  'class Component {} export class Fake extends Component {initStyles(){this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}})}}',
  component('this.styleManager.styleElement?.remove(); this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}});'),
])('keeps uncertain initializers completely unchanged (%#)', async source => {
  await withStyleGraph(source, graph => {
    const groups = analyzeFixedStyles(graph);
    expect(groups).toHaveLength(0);
    expect(transformStaticStyles(source, groups, () => './unused.css')).toBe(source);
  });
});

test('duplicate names preserve Map replacement order and extra calls are retained', async () => {
  const source = component('this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}}); this.styleManager.addStyle("a",{selector:".a",properties:{color:"blue"}}); ensureKeyframes();');
  await withStyleGraph(source, graph => {
    const groups = analyzeFixedStyles(graph);
    expect(groups[0].cssText).toBe('.a {\ncolor: blue;\n}\n');
    expect(transformStaticStyles(source, groups, () => './fixed.css')).toContain('ensureKeyframes();');
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
    const built = await Bun.build({ entrypoints: [entry], target: 'browser', minify: true,
      external: [frameworkSource, frameworkSource.replace('/index.ts', '/style/index.ts')] });
    const published = await built.outputs[0].text();
    await withStyleGraph(published, graph => {
      const groups = analyzeFixedStyles(graph);
      expect(groups).toHaveLength(1);
      expect(groups[0].cssText).toBe('.a {\ncolor: red;\nborder: 1px solid red;\n}\n');
    });
  });
});

test('retains an isolated call before fixed initialization and skips escaped fresh managers', async () => {
  const source = component('ensureKeyframes(); this.styleManager.addStyle("a",{selector:".a",properties:{color:"red"}});');
  await withStyleGraph(source, graph => {
    expect(analyzeFixedStyles(graph)[0]?.cssText).toBe(css);
  });
  await withStyleGraph(`${imports} const manager=new StyleManager(); const alias=manager;
    manager.addStyle('a',{selector:'.a',properties:{color:'red'}}); export {alias};`, graph => {
    expect(analyzeFixedStyles(graph)).toHaveLength(0);
  });
});
