import { expect, test } from 'bun:test';
import ts from 'typescript';
import { StaticEvaluator } from '../src/static-styles/evaluate';
import { withStyleGraph } from './style-fixture';

test('evaluates frozen spreads, default parameters and templates without executing code', async () => {
  await withStyleGraph(`const palette = {color:'#fff'};
    function border(color = palette.color) { return \`1px solid \${color}\`; }
    export const value = Object.freeze({selector: '.a', properties: {...palette, border: border(), opacity:-1}});`,
  (graph, entry) => {
    const declaration = graph.getSourceFile(entry)!.statements.filter(ts.isVariableStatement)
      .flatMap(statement => [...statement.declarationList.declarations]).find(node => node.name.getText() === 'value')!;
    expect(new StaticEvaluator(graph).evaluate(declaration.initializer!)).toEqual({ ok: true, value: {
      selector: '.a', properties: { color: '#fff', border: '1px solid #fff', opacity: -1 },
    } });
  });
});

test.each([
  'const source={color:"red"}; source.color="blue"; export const value=source;',
  'let source="red"; source="blue"; export const value=source;',
  'const source={get color(){throw new Error("must not execute")}}; export const value=source;',
  'function unknown(){throw new Error("must not execute")} export const value=unknown();',
  'const Object={freeze(value){return value}}; export const value=Object.freeze({color:"red"});',
  'const a=b; const b=a; export const value=a;',
  'export const value=Date.now();',
  'export const value=process.env.COLOR;',
])('rejects unsafe expression: %s', async source => {
  await withStyleGraph(source, (graph, entry) => {
    const declaration = graph.getSourceFile(entry)!.statements.filter(ts.isVariableStatement)
      .flatMap(statement => [...statement.declarationList.declarations]).find(node => node.name.getText() === 'value')!;
    expect(new StaticEvaluator(graph).evaluate(declaration.initializer!)).toEqual({ ok: false });
  });
});

test('single-assignment var and arrow aliases remain usable in published JS', async () => {
  await withStyleGraph('var color="red", border=(c=color)=>`1px solid ${c}`; export const value={border:border()};',
    (graph, entry) => {
      const declaration = graph.getSourceFile(entry)!.statements.filter(ts.isVariableStatement)[1].declarationList.declarations[0];
      expect(new StaticEvaluator(graph).evaluate(declaration.initializer!)).toEqual({ ok: true, value: { border: '1px solid red' } });
    });
});
