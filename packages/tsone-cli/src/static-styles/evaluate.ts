import ts from 'typescript';
import { RuntimeModuleGraph } from './module-graph';

export type StaticValue = string | number | boolean | null | undefined |
  StaticValue[] | { [key: string]: StaticValue };
export type StaticResult = { ok: true; value: StaticValue } | { ok: false };
const failed: StaticResult = { ok: false };
export function isStaticRecord(value: StaticValue): value is { [key: string]: StaticValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class StaticEvaluator {
  constructor(private graph: RuntimeModuleGraph) {}

  public evaluate(expression: ts.Expression, bindings: ReadonlyMap<string, StaticValue> = new Map()): StaticResult {
    let steps = 10000;
    const visiting = new Set<ts.Node>();
    const evaluate = (node: ts.Expression, scope = bindings): StaticResult => {
      if (--steps < 0 || visiting.has(node)) return failed;
      visiting.add(node);
      try { return value(node, scope); } finally { visiting.delete(node); }
    };
    const value = (node: ts.Expression, scope: ReadonlyMap<string, StaticValue>): StaticResult => {
      if (ts.isStringLiteralLike(node)) return { ok: true, value: node.text };
      if (ts.isNumericLiteral(node)) return { ok: true, value: Number(node.text) };
      if (node.kind === ts.SyntaxKind.TrueKeyword) return { ok: true, value: true };
      if (node.kind === ts.SyntaxKind.FalseKeyword) return { ok: true, value: false };
      if (node.kind === ts.SyntaxKind.NullKeyword) return { ok: true, value: null };
      if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ||
        ts.isTypeAssertionExpression(node) || ts.isSatisfiesExpression(node)) return evaluate(node.expression, scope);
      if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
        const operand = evaluate(node.operand, scope);
        return operand.ok && typeof operand.value === 'number' ? { ok: true, value: -operand.value } : failed;
      }
      if (ts.isIdentifier(node)) {
        if (scope.has(node.text)) return { ok: true, value: scope.get(node.text) };
        const declaration = this.graph.resolveDeclaration(node);
        if (!declaration && node.text === 'undefined') return { ok: true, value: undefined };
        if (!declaration || !ts.isVariableDeclaration(declaration) || !declaration.initializer ||
          this.graph.hasObservableMutation(declaration)) return failed;
        return evaluate(declaration.initializer, scope);
      }
      if (ts.isArrayLiteralExpression(node)) {
        const result: StaticValue[] = [];
        for (const element of node.elements) {
          const entry = evaluate(ts.isSpreadElement(element) ? element.expression : element, scope);
          if (!entry.ok) return failed;
          if (ts.isSpreadElement(element)) {
            if (!Array.isArray(entry.value)) return failed;
            result.push(...entry.value);
          } else result.push(entry.value);
        }
        return { ok: true, value: result };
      }
      if (ts.isObjectLiteralExpression(node)) {
        const result: { [key: string]: StaticValue } = Object.create(null);
        for (const property of node.properties) {
          if (ts.isSpreadAssignment(property)) {
            const spread = evaluate(property.expression, scope);
            if (!spread.ok || !isStaticRecord(spread.value)) return failed;
            Object.assign(result, spread.value);
            continue;
          }
          if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) return failed;
          if (!ts.isIdentifier(property.name) && !ts.isStringLiteralLike(property.name) && !ts.isNumericLiteral(property.name)) return failed;
          const entry = evaluate(ts.isPropertyAssignment(property) ? property.initializer : property.name, scope);
          if (!entry.ok) return failed;
          result[property.name.text] = entry.value;
        }
        return { ok: true, value: result };
      }
      if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
        const base = evaluate(node.expression, scope);
        const key = ts.isPropertyAccessExpression(node) ? { ok: true as const, value: node.name.text }
          : evaluate(node.argumentExpression, scope);
        if (!base.ok || !key.ok || (typeof key.value !== 'string' && typeof key.value !== 'number') ||
          ['__proto__', 'constructor', 'prototype'].includes(String(key.value))) return failed;
        if (isStaticRecord(base.value) && Object.hasOwn(base.value, key.value)) {
          return { ok: true, value: base.value[String(key.value)] };
        }
        if (Array.isArray(base.value) && (key.value === 'length' || /^\d+$/.test(String(key.value)))) {
          return { ok: true, value: key.value === 'length' ? base.value.length : base.value[Number(key.value)] };
        }
        return failed;
      }
      if (ts.isTemplateExpression(node)) {
        let text = node.head.text;
        for (const span of node.templateSpans) {
          const entry = evaluate(span.expression, scope);
          if (!entry.ok || typeof entry.value === 'object' && entry.value !== null) return failed;
          text += String(entry.value) + span.literal.text;
        }
        return { ok: true, value: text };
      }
      if (ts.isCallExpression(node)) {
        if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'freeze' &&
          ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'Object' &&
          !this.graph.resolveDeclaration(node.expression.expression) && node.arguments.length === 1) {
          return evaluate(node.arguments[0], scope);
        }
        let declaration = this.graph.resolveDeclaration(node.expression);
        if (declaration && ts.isVariableDeclaration(declaration)) {
          if (this.graph.hasObservableMutation(declaration)) return failed;
          declaration = declaration.initializer && (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer)) ? declaration.initializer : undefined;
        }
        if (!declaration || (!ts.isFunctionDeclaration(declaration) && !ts.isFunctionExpression(declaration) &&
          !ts.isArrowFunction(declaration)) || !declaration.body) return failed;
        const body = declaration.body;
        const returned = ts.isBlock(body) ? body.statements.length === 1 && ts.isReturnStatement(body.statements[0])
          ? body.statements[0].expression : undefined : body;
        if (!returned || node.arguments.length > declaration.parameters.length) return failed;
        const local = new Map(scope);
        for (let index = 0; index < declaration.parameters.length; index++) {
          const parameter = declaration.parameters[index];
          if (!ts.isIdentifier(parameter.name) || parameter.dotDotDotToken) return failed;
          const argument = node.arguments[index];
          let bound = argument ? evaluate(argument, scope) : { ok: true as const, value: undefined };
          if (!bound.ok) return failed;
          if (bound.value === undefined && parameter.initializer) bound = evaluate(parameter.initializer, local);
          if (!bound.ok) return failed;
          local.set(parameter.name.text, bound.value);
        }
        return evaluate(returned, local);
      }
      return failed;
    };
    return evaluate(expression);
  }
}
