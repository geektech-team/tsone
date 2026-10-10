import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import ts from 'typescript';

export interface RuntimeModule {
  path: string;
  source: string;
  loader: 'js' | 'jsx' | 'ts' | 'tsx';
  imports: ReadonlyMap<string, string>;
  packageName?: string;
  packageRoot?: string;
}
export interface Discovery {
  entry: string;
  modules: ReadonlyMap<string, RuntimeModule>;
  hasResolvedImports: boolean;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function packageOwner(path: string): { packageName?: string; packageRoot?: string } {
  let directory = dirname(path);
  while (true) {
    try {
      const manifest: unknown = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
      if (record(manifest) && typeof manifest.name === 'string') {
        return { packageName: manifest.name, packageRoot: directory };
      }
    } catch { /* Parent package may own this module. */ }
    const parent = dirname(directory);
    if (parent === directory) return {};
    directory = parent;
  }
}

export async function discoverModules(options: Bun.BuildConfig): Promise<Discovery> {
  const modules = new Map<string, RuntimeModule>();
  const plugin: Bun.BunPlugin = {
    name: 'tsone-style-discovery',
    setup(builder) {
      builder.onLoad({ filter: /\.[cm]?[jt]sx?$/, namespace: 'file' }, async args => {
        if (!['js', 'jsx', 'ts', 'tsx'].includes(args.loader)) return;
        const path = resolve(args.path);
        const source = await readFile(path, 'utf8');
        const loader = args.loader as RuntimeModule['loader'];
        modules.set(path, { path, source, loader, imports: new Map(), ...packageOwner(path) });
        return { contents: source, loader };
      });
    },
  };
  const { outdir: _outdir, ...config } = options;
  const result = await Bun.build({ ...config, metafile: true, throw: false,
    plugins: [...(options.plugins ?? []), plugin] });
  if (!result.success) {
    throw new Error(`Failed to discover TSone application: ${result.logs.map(log => log.message).join('\n')}`);
  }
  const metadata: unknown = result.metafile;
  const hasResolvedImports = record(metadata) && record(metadata.inputs);
  if (hasResolvedImports && record(metadata) && record(metadata.inputs)) {
    const base = options.root ?? process.cwd();
    for (const [input, details] of Object.entries(metadata.inputs)) {
      const module = modules.get(resolve(base, input));
      if (!module || !record(details) || !Array.isArray(details.imports)) continue;
      const edges = new Map<string, string>();
      const ambiguous = new Set<string>();
      for (const edge of details.imports) {
        if (!record(edge) || typeof edge.original !== 'string' || typeof edge.path !== 'string') continue;
        const target = resolve(base, edge.path);
        if (!modules.has(target) || edge.external === true) continue;
        if (edges.has(edge.original) && edges.get(edge.original) !== target) ambiguous.add(edge.original);
        edges.set(edge.original, target);
      }
      for (const original of ambiguous) edges.delete(original);
      modules.set(module.path, { ...module, imports: edges });
    }
  }
  return { entry: resolve(options.entrypoints[0]), modules, hasResolvedImports };
}

export async function sourcesUnchanged(discovery: Discovery): Promise<boolean> {
  for (const module of discovery.modules.values()) {
    try {
      if (await readFile(module.path, 'utf8') !== module.source) return false;
    } catch { return false; }
  }
  return true;
}

export class RuntimeModuleGraph {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private framework = new Map<string, Set<ts.Declaration>>();
  private mutation = new Map<ts.Declaration, boolean>();

  constructor(discovery: Discovery) {
    const files = new Map<string, ts.SourceFile>();
    for (const module of discovery.modules.values()) {
      files.set(module.path, ts.createSourceFile(module.path, module.source,
        ts.ScriptTarget.Latest, true,
        module.loader === 'tsx' ? ts.ScriptKind.TSX : module.loader === 'jsx'
          ? ts.ScriptKind.JSX : module.loader === 'js' ? ts.ScriptKind.JS : ts.ScriptKind.TS));
    }
    const options: ts.CompilerOptions = { noLib: true, allowJs: true, checkJs: true,
      target: ts.ScriptTarget.Latest, module: ts.ModuleKind.ESNext };
    const host = ts.createCompilerHost(options);
    host.getSourceFile = path => files.get(resolve(path));
    host.fileExists = path => files.has(resolve(path));
    host.readFile = path => files.get(resolve(path))?.text;
    host.resolveModuleNames = (names, containingFile) => names.map(name => {
      const path = discovery.modules.get(resolve(containingFile))?.imports.get(name);
      if (!path) return undefined;
      const extension = extname(path) === '.tsx' ? ts.Extension.Tsx : extname(path) === '.jsx'
        ? ts.Extension.Jsx : /\.[cm]?js$/.test(path) ? ts.Extension.Js : ts.Extension.Ts;
      return { resolvedFileName: path, extension };
    });
    this.program = ts.createProgram([...files.keys()], options, host);
    this.checker = this.program.getTypeChecker();
    const frameworkRoots = new Set([...discovery.modules.values()]
      .filter(module => module.packageName === '@geektech/tsone').map(module => module.packageRoot));
    if (!discovery.hasResolvedImports || frameworkRoots.size !== 1) return;
    for (const module of discovery.modules.values()) {
      if (module.packageName !== '@geektech/tsone') continue;
      const file = this.getSourceFile(module.path)!;
      const symbol = this.checker.getSymbolAtLocation(file);
      if (!symbol) continue;
      for (const exported of this.checker.getExportsOfModule(symbol)) {
        if (!['Component', 'StyleManager'].includes(exported.name)) continue;
        const actual = this.unalias(exported);
        const declarations = this.framework.get(exported.name) ?? new Set();
        for (const declaration of actual?.declarations ?? []) declarations.add(declaration);
        this.framework.set(exported.name, declarations);
      }
    }
  }

  public getSourceFiles(): readonly ts.SourceFile[] { return this.program.getSourceFiles(); }
  public getSourceFile(path: string): ts.SourceFile | undefined { return this.program.getSourceFile(resolve(path)); }
  private unalias(symbol: ts.Symbol): ts.Symbol | undefined {
    const seen = new Set<ts.Symbol>();
    while (symbol.flags & ts.SymbolFlags.Alias) {
      if (seen.has(symbol)) return undefined;
      seen.add(symbol);
      symbol = this.checker.getAliasedSymbol(symbol);
    }
    return symbol;
  }
  public resolveDeclaration(node: ts.Node): ts.Declaration | undefined {
    const symbol = this.checker.getSymbolAtLocation(node);
    return symbol ? this.unalias(symbol)?.valueDeclaration : undefined;
  }
  public isFrameworkConstructor(expression: ts.Expression, name: 'Component' | 'StyleManager'): boolean {
    const seen = new Set<ts.Declaration>();
    const check = (node: ts.Expression): boolean => {
      const declaration = this.resolveDeclaration(node);
      if (!declaration || seen.has(declaration)) return false;
      if (this.framework.get(name)?.has(declaration)) return true;
      seen.add(declaration);
      if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
        return check(declaration.initializer);
      }
      if (name === 'Component' && (ts.isClassDeclaration(declaration) || ts.isClassExpression(declaration))) {
        const parent = declaration.heritageClauses?.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0];
        return parent ? check(parent.expression) : false;
      }
      return false;
    };
    return check(expression);
  }
  public hasObservableMutation(declaration: ts.Declaration): boolean {
    const cached = this.mutation.get(declaration);
    if (cached !== undefined) return cached;
    let mutated = false;
    const root = (node: ts.Node): ts.Node => ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)
      ? root(node.expression) : node;
    const refers = (node: ts.Node) => this.resolveDeclaration(root(node)) === declaration;
    const visit = (node: ts.Node): void => {
      if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        node.operatorToken.kind <= ts.SyntaxKind.LastAssignment && refers(node.left)) mutated = true;
      if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
        [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator) && refers(node.operand)) mutated = true;
      if (ts.isCallExpression(node)) {
        if (ts.isPropertyAccessExpression(node.expression) && refers(node.expression.expression) &&
          node.expression.name.text !== 'forEach') mutated = true;
        if (node.arguments.some(argument => refers(argument))) {
          const target = this.resolveDeclaration(node.expression);
          const pure = target && (ts.isFunctionDeclaration(target) || ts.isArrowFunction(target)) &&
            target.body && (!ts.isBlock(target.body) || (target.body.statements.length === 1 && ts.isReturnStatement(target.body.statements[0])));
          const freeze = ts.isPropertyAccessExpression(node.expression) && node.expression.getText() === 'Object.freeze' &&
            !this.resolveDeclaration(node.expression.expression);
          if (!pure && !freeze) mutated = true;
        }
      }
      ts.forEachChild(node, visit);
    };
    for (const file of this.getSourceFiles()) visit(file);
    this.mutation.set(declaration, mutated);
    return mutated;
  }
}
