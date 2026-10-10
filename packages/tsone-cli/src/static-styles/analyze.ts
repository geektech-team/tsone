import ts from 'typescript';
import {
  renderManagedStyleSheet,
  type StyleOptions,
} from '@geektech/tsone/style';
import { RuntimeModuleGraph } from './module-graph';
import { StaticEvaluator, isStaticRecord, type StaticValue } from './evaluate';

export interface FixedStyleGroup {
  modulePath: string;
  insertionOffset: number;
  managerExpression: string;
  cssText: string;
}
type Bindings = Map<string, StaticValue>;

function properties(
  value: StaticValue
): value is Record<string, string | number> {
  return (
    isStaticRecord(value) &&
    Object.values(value).every(
      (entry) => typeof entry === 'string' || typeof entry === 'number'
    )
  );
}
function styleOptions(value: StaticValue): StyleOptions | undefined {
  if (
    !isStaticRecord(value) ||
    typeof value.selector !== 'string' ||
    !properties(value.properties)
  )
    return;
  if (value.hover !== undefined && !properties(value.hover)) return;
  if (
    value.media !== undefined &&
    (!isStaticRecord(value.media) ||
      !Object.values(value.media).every(properties))
  )
    return;
  return {
    selector: value.selector,
    properties: value.properties,
    hover: value.hover,
    media: value.media,
  } as StyleOptions;
}

function bind(
  name: ts.BindingName,
  value: StaticValue,
  scope: Bindings
): boolean {
  if (ts.isIdentifier(name)) {
    scope.set(name.text, value);
    return true;
  }
  if (!ts.isObjectBindingPattern(name) || !isStaticRecord(value)) return false;
  const consumed = new Set<string>();
  for (const element of name.elements) {
    if (element.initializer || !ts.isIdentifier(element.name)) return false;
    if (element.dotDotDotToken) {
      const remaining = Object.fromEntries(
        Object.entries(value).filter(([key]) => !consumed.has(key))
      );
      scope.set(element.name.text, remaining);
    } else {
      const key = element.propertyName ?? element.name;
      if (!ts.isIdentifier(key) && !ts.isStringLiteralLike(key)) return false;
      consumed.add(key.text);
      scope.set(element.name.text, value[key.text]);
    }
  }
  return true;
}

export function analyzeFixedStyles(
  graph: RuntimeModuleGraph
): FixedStyleGroup[] {
  const evaluator = new StaticEvaluator(graph);
  const groups: FixedStyleGroup[] = [];
  const registration = (
    call: ts.CallExpression,
    receiver: string,
    scope: Bindings,
    rules: Map<string, StyleOptions>
  ): boolean => {
    if (
      !ts.isPropertyAccessExpression(call.expression) ||
      call.expression.name.text !== 'addStyle' ||
      call.expression.expression.getText() !== receiver ||
      call.arguments.length !== 2
    )
      return false;
    const name = evaluator.evaluate(call.arguments[0], scope);
    const options = evaluator.evaluate(call.arguments[1], scope);
    const style = options.ok ? styleOptions(options.value) : undefined;
    if (!name.ok || typeof name.value !== 'string' || !style) return false;
    rules.set(name.value, style);
    return true;
  };
  const statement = (
    node: ts.Statement,
    receiver: string,
    scope: Bindings,
    rules: Map<string, StyleOptions>
  ): boolean => {
    if (
      !ts.isExpressionStatement(node) ||
      !ts.isCallExpression(node.expression)
    )
      return false;
    const call = node.expression;
    if (registration(call, receiver, scope, rules)) return true;
    if (
      !ts.isPropertyAccessExpression(call.expression) ||
      call.expression.name.text !== 'forEach' ||
      call.arguments.length !== 1
    )
      return false;
    const list = evaluator.evaluate(call.expression.expression, scope);
    const callback = call.arguments[0];
    if (
      !list.ok ||
      !Array.isArray(list.value) ||
      (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) ||
      callback.parameters.length !== 1
    )
      return false;
    let body: ts.Expression | undefined;
    let declarations: readonly ts.VariableDeclaration[] = [];
    if (ts.isBlock(callback.body)) {
      const nodes = callback.body.statements;
      const last = nodes[nodes.length - 1];
      if (!last) return false;
      if (ts.isExpressionStatement(last)) body = last.expression;
      if (ts.isReturnStatement(last)) body = last.expression;
      if (nodes.slice(0, -1).some((item) => !ts.isVariableStatement(item)))
        return false;
      declarations = nodes
        .slice(0, -1)
        .flatMap((item) =>
          ts.isVariableStatement(item)
            ? [...item.declarationList.declarations]
            : []
        );
    } else body = callback.body;
    if (!body || !ts.isCallExpression(body)) return false;
    for (const entry of list.value) {
      const local = new Map(scope);
      if (!bind(callback.parameters[0].name, entry, local)) return false;
      for (const declaration of declarations) {
        if (!declaration.initializer) return false;
        const result = evaluator.evaluate(declaration.initializer, local);
        if (!result.ok || !bind(declaration.name, result.value, local))
          return false;
      }
      if (!registration(body, receiver, local, rules)) return false;
    }
    return true;
  };

  for (const file of graph.getSourceFiles()) {
    const analyzeStatements = (
      nodes: readonly ts.Statement[],
      receiver: string,
      requireComplete: boolean
    ): void => {
      const rules = new Map<string, StyleOptions>();
      const scope: Bindings = new Map();
      let last: ts.Statement | undefined;
      let ended = false;
      const allowed = new Set<ts.Node>();
      const mentionsManager = (node: ts.Node): boolean => {
        if (
          node.getText() === receiver ||
          node.kind === ts.SyntaxKind.SuperKeyword
        )
          return true;
        return ts.forEachChild(node, mentionsManager) === true;
      };
      for (const node of nodes) {
        if (!ended && statement(node, receiver, scope, rules)) {
          last = node;
          const visit = (child: ts.Node): void => {
            allowed.add(child);
            ts.forEachChild(child, visit);
          };
          visit(node);
        } else if (!last) {
          if (mentionsManager(node)) return;
        } else ended = true;
      }
      if (!last || rules.size === 0) return;
      let uncertain = false;
      const visit = (node: ts.Node): void => {
        if (node.getText() === receiver && !allowed.has(node)) uncertain = true;
        if (node.kind === ts.SyntaxKind.SuperKeyword) uncertain = true;
        ts.forEachChild(node, visit);
      };
      if (requireComplete) for (const node of nodes) visit(node);
      if (!uncertain)
        groups.push({
          modulePath: file.fileName,
          insertionOffset: last.end,
          managerExpression: receiver,
          cssText: renderManagedStyleSheet(rules.values()),
        });
    };
    const visit = (node: ts.Node): void => {
      if (
        (ts.isClassDeclaration(node) || ts.isClassExpression(node)) &&
        node.heritageClauses?.some(
          (clause) =>
            clause.token === ts.SyntaxKind.ExtendsKeyword &&
            clause.types.some((type) =>
              graph.isFrameworkConstructor(type.expression, 'Component')
            )
        )
      ) {
        if (
          !node.members.some(
            (member) => member.name?.getText() === 'styleManager'
          )
        ) {
          for (const member of node.members) {
            if (
              ts.isMethodDeclaration(member) &&
              member.name.getText() === 'initStyles' &&
              member.body
            ) {
              analyzeStatements(
                member.body.statements,
                'this.styleManager',
                true
              );
            }
          }
        }
      }
      if (ts.isSourceFile(node) || ts.isBlock(node)) {
        const nodes = node.statements;
        for (let index = 0; index < nodes.length; index++) {
          const declaration = nodes[index];
          if (
            !ts.isVariableStatement(declaration) ||
            declaration.declarationList.declarations.length !== 1
          )
            continue;
          const variable = declaration.declarationList.declarations[0];
          if (
            !ts.isIdentifier(variable.name) ||
            !variable.initializer ||
            !ts.isNewExpression(variable.initializer) ||
            !graph.isFrameworkConstructor(
              variable.initializer.expression,
              'StyleManager'
            )
          )
            continue;
          analyzeStatements(nodes.slice(index + 1), variable.name.text, false);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return groups;
}

export function transformStaticStyles(
  source: string,
  groups: readonly FixedStyleGroup[],
  hrefForCss: (cssText: string) => string
): string {
  let output = source;
  for (const group of [...groups].sort(
    (a, b) => b.insertionOffset - a.insertionOffset
  )) {
    const receiver = group.managerExpression;
    const insertion =
      `\nif (typeof ${receiver}.useStaticStyleSheet === 'function') {` +
      ` ${receiver}.useStaticStyleSheet(${JSON.stringify(hrefForCss(group.cssText))}); }\n`;
    output =
      output.slice(0, group.insertionOffset) +
      insertion +
      output.slice(group.insertionOffset);
  }
  return output;
}
