import {
  A,
  Article,
  Aside,
  Blockquote,
  Button,
  Code,
  Component,
  ComponentRenderStrategy,
  Div,
  ElementRenderStrategy,
  Em,
  Footer,
  Form,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Header,
  Img,
  Input,
  Label,
  Li,
  Main,
  ModelBindingController,
  Nav,
  Ol,
  Option,
  P,
  Pre,
  ReactiveSystem,
  RendererContext,
  Router,
  RouterLink,
  RouterView,
  Section,
  Select,
  SlotRenderStrategy,
  Small,
  Span,
  Strong,
  Table,
  Tag,
  Tbody,
  Td,
  TemplateEngine,
  TextRenderStrategy,
  Textarea,
  Th,
  Thead,
  Tr,
  Ul,
  computed,
  createComponent,
  createRouter,
  each,
  effect,
  getModelValue,
  h,
  isComponentNode,
  isHTMLNode,
  isReactive,
  isReadonly,
  isRef,
  isSlotProvider,
  modelPath,
  normalizeTransitionGroupProps,
  reactive,
  readonly,
  ref,
  setModelValue,
  slot,
  stop,
  unref,
  useRouter,
  validateTransitionGroupChildren
} from "./index-wv9gyjqt.js";
import {
  renderStyleSheet
} from "./index-vpx80nq5.js";
import"./index-8wjswsye.js";

// lib/core/document.ts
var VOID_HEAD_TAGS = new Set(["base", "link", "meta"]);
function renderHtmlDocument(options) {
  const lang = options.lang ?? "en";
  const charset = options.charset ?? "utf-8";
  const viewport = options.viewport ?? "width=device-width, initial-scale=1";
  const htmlAttributes = renderAttributes({
    lang,
    ...options.htmlAttributes ?? {}
  });
  const bodyAttributes = renderAttributes(options.bodyAttributes);
  const bodyHtml = renderDocumentBody(options.body);
  return [
    "<!doctype html>",
    `<html${htmlAttributes}>`,
    "<head>",
    `  <meta charset="${escapeHtml(charset)}">`,
    `  <meta name="viewport" content="${escapeHtml(viewport)}">`,
    `  <title>${escapeHtml(options.title)}</title>`,
    options.description ? `  <meta name="description" content="${escapeHtml(options.description)}">` : "",
    ...(options.head ?? []).map((element) => `  ${renderHeadElement(element)}`),
    options.styles && options.styles.length > 0 ? `  <style>${renderStyleSheet(options.styles)}</style>` : "",
    "</head>",
    `<body${bodyAttributes}>`,
    bodyHtml,
    ...(options.scripts ?? []).map((script) => `  ${renderScript(script)}`),
    "</body>",
    "</html>"
  ].filter((line) => line !== "").join(`
`);
}
function renderDocumentBody(body) {
  if (typeof document === "undefined") {
    throw new Error("renderHtmlDocument requires a DOM-like document");
  }
  const container = document.createElement("div");
  const renderer = new RendererContext;
  const mountedComponents = new Set;
  const renderables = Array.isArray(body) ? body : [body];
  const context = {
    templateEngine: new TemplateEngine({}),
    renderer,
    slots: { default: [] },
    registerChild: (component) => {
      mountedComponents.add(component);
    },
    unregisterChild: (component) => {
      mountedComponents.delete(component);
    }
  };
  renderables.forEach((renderable) => {
    container.appendChild(renderer.mount(renderable, context));
  });
  const html = container.innerHTML;
  mountedComponents.forEach((component) => {
    component.unmount();
  });
  return html;
}
function renderHeadElement(element) {
  const attributes = renderAttributes(element.attributes);
  if (VOID_HEAD_TAGS.has(element.tag) && !element.text) {
    return `<${element.tag}${attributes}>`;
  }
  return `<${element.tag}${attributes}>${escapeHtml(element.text ?? "")}</${element.tag}>`;
}
function renderScript(script) {
  const attributes = renderAttributes({
    type: script.type,
    src: script.src,
    async: script.async,
    defer: script.defer,
    ...script.attributes ?? {}
  });
  return `<script${attributes}></script>`;
}
function renderAttributes(attributes = {}) {
  const rendered = Object.entries(attributes).flatMap(([name, value]) => {
    if (value === false || value === null || value === undefined) {
      return [];
    }
    return value === true ? [name] : [`${name}="${escapeHtml(String(value))}"`];
  }).join(" ");
  return rendered ? ` ${rendered}` : "";
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// lib/core/app.ts
var DEFAULT_ROOT_ELEMENT = "#app";

class OneApp {
  options;
  container = null;
  rootInstance = null;
  mounted = false;
  templateEngine = null;
  appContext;
  providers = new Map;
  plugins = [];
  unmountedCallback;
  router;
  constructor(options = {}) {
    this.options = options;
    this.appContext = {
      app: this,
      version: "0.0.2",
      config: options.config || {}
    };
  }
  handleError(error) {
    console.error("应用错误:", error);
    this.renderErrorUI(error);
  }
  renderErrorUI(error) {
    if (!this.container) {
      return;
    }
    this.container.innerHTML = `
      <div style="padding: 20px; background-color: #ffebee; color: #c62828; font-family: Arial, sans-serif;">
        <h3>应用错误</h3>
        <p>${error.message}</p>
        <pre style="background-color: #fff; padding: 10px; border-radius: 4px; overflow: auto;">${error.stack}</pre>
      </div>
    `;
  }
  use(plugin, ...args) {
    if (typeof plugin.install !== "function") {
      throw new Error("插件必须提供 install 方法");
    }
    plugin.install(this, ...args);
    this.plugins.push({ plugin, args });
    return this;
  }
  mount() {
    if (this.mounted) {
      console.warn("应用已经处于运行状态");
      return;
    }
    const mountContainer = this.resolveMountContainer();
    if (!mountContainer) {
      return;
    }
    try {
      this.container = mountContainer;
      globalThis.__APP__ = this;
      if (this.options.root) {
        this.rootInstance = new this.options.root(this.options.rootProps);
        if ("setAppContext" in this.rootInstance) {
          this.rootInstance.setAppContext(this.appContext);
        }
        if (this.options.state && "setState" in this.rootInstance) {
          this.rootInstance.setState(this.options.state);
        }
        this.rootInstance.mount(this.container);
        this.templateEngine = new TemplateEngine(this.options.state || {});
      }
      this.mounted = true;
      this.onMounted();
    } catch (error) {
      this.handleError(error);
    }
  }
  unmount() {
    if (!this.mounted) {
      console.warn("应用未处于运行状态");
      return;
    }
    try {
      this.onBeforeUnmount();
      if (this.rootInstance) {
        if ("unmount" in this.rootInstance) {
          this.rootInstance.unmount();
        }
        this.rootInstance = null;
        this.mounted = false;
        delete globalThis.__APP__;
      }
      if (this.templateEngine) {
        this.templateEngine.clearBindings();
        this.templateEngine = null;
      }
      if (this.container) {
        this.container.innerHTML = "";
      }
      if (this.unmountedCallback) {
        this.unmountedCallback();
      }
    } catch (error) {
      console.error("Failed to unmount app:", error);
    }
  }
  isRunning() {
    return this.mounted;
  }
  updateRootComponent(component) {
    if (this.mounted) {
      this.unmount();
    }
    this.options.root = component;
    this.mount();
  }
  update(state) {
    if (!this.mounted) {
      console.warn("Cannot update unmounted app");
      return this;
    }
    try {
      if (state && this.options.state) {
        this.options.state = { ...this.options.state, ...state };
        if (this.rootInstance && "setState" in this.rootInstance) {
          this.rootInstance.setState(state);
        }
        if (this.templateEngine) {
          this.templateEngine.state = this.options.state;
        }
      }
      this.onUpdated();
    } catch (error) {
      console.error("Failed to update app:", error);
    }
    return this;
  }
  getContext() {
    return this.appContext;
  }
  provide(key, value) {
    this.providers.set(key, value);
    return this;
  }
  inject(key, fallback) {
    const result = this.resolveInjection(key);
    return result.found ? result.value : fallback;
  }
  resolveInjection(key) {
    if (!this.providers.has(key)) {
      return { found: false, value: undefined };
    }
    return { found: true, value: this.providers.get(key) };
  }
  getState() {
    return this.options.state;
  }
  setState(newState) {
    this.options.state = newState;
    if (this.mounted) {
      this.update();
    }
    return this;
  }
  onUnmounted(callback) {
    this.unmountedCallback = callback;
    return this;
  }
  renderHtmlDocument(options = {}) {
    const appDocument = this.options.document ?? {};
    const scripts = this.mergeDocumentScripts(appDocument.scripts, options.scripts);
    return renderHtmlDocument({
      ...appDocument,
      ...options,
      title: options.title ?? appDocument.title ?? "TSone App",
      body: options.body ?? appDocument.body ?? this.createMountDocumentBody(),
      scripts
    });
  }
  resolveRootElement(selector) {
    if (!selector) {
      return null;
    }
    if (typeof selector === "string") {
      if (typeof document === "undefined") {
        return null;
      }
      return document.querySelector(selector);
    }
    return typeof Element !== "undefined" && selector instanceof Element ? selector : null;
  }
  resolveMountContainer() {
    if (typeof document === "undefined") {
      return null;
    }
    const rootElement = this.resolveRootElement(this.options.rootElement ?? DEFAULT_ROOT_ELEMENT);
    return rootElement instanceof HTMLElement ? rootElement : null;
  }
  createMountDocumentBody() {
    const rootElement = this.options.rootElement ?? DEFAULT_ROOT_ELEMENT;
    if (typeof rootElement === "string") {
      return this.createMountElementFromSelector(rootElement);
    }
    if (typeof Element !== "undefined" && rootElement instanceof Element) {
      const props = {};
      if (rootElement.id) {
        props.id = rootElement.id;
      }
      if (rootElement.className) {
        props.className = rootElement.className;
      }
      return { tag: rootElement.tagName.toLowerCase(), props };
    }
    return Div({ props: { id: "app" } });
  }
  createMountElementFromSelector(selector) {
    if (selector.startsWith("#") && selector.length > 1) {
      return Div({ props: { id: selector.slice(1) } });
    }
    if (selector.startsWith(".") && selector.length > 1) {
      return Div({ props: { className: selector.slice(1) } });
    }
    return Div({ props: { "data-tsone-root": selector } });
  }
  mergeDocumentScripts(baseScripts, extraScripts) {
    if (!baseScripts && !extraScripts) {
      return;
    }
    return [...baseScripts ?? [], ...extraScripts ?? []];
  }
  onMounted() {
    this.plugins.forEach(({ plugin: pluginObj }) => {
      if (pluginObj && typeof pluginObj.onMounted === "function") {
        pluginObj.onMounted(this);
      }
    });
  }
  onUpdated() {
    this.plugins.forEach(({ plugin: pluginObj }) => {
      if (pluginObj && typeof pluginObj.onUpdated === "function") {
        pluginObj.onUpdated(this);
      }
    });
  }
  onBeforeUnmount() {
    this.plugins.forEach(({ plugin: pluginObj }) => {
      if (pluginObj && typeof pluginObj.onBeforeUnmount === "function") {
        pluginObj.onBeforeUnmount(this);
      }
    });
  }
}
// lib/core/form.ts
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function runRule(rule, value, model) {
  try {
    const result = rule(value, model);
    if (result === true) {
      return;
    }
    return result === false ? "Validation failed" : result;
  } catch (error) {
    return errorMessage(error);
  }
}
function required(message = "This field is required") {
  return (value) => {
    if (value === null || value === undefined) {
      return message;
    }
    if (typeof value === "string" && value.trim().length === 0) {
      return message;
    }
    if (Array.isArray(value) && value.length === 0) {
      return message;
    }
    return true;
  };
}
function minLength(length, message = `Must be at least ${length} characters`) {
  return (value) => typeof value === "string" && value.length >= length ? true : message;
}
function validate(rule) {
  return rule;
}
function createForm(model, rules) {
  const errors = {};
  const validateField = (path) => {
    const fieldRules = rules[path] ?? [];
    const value = getModelValue(model, path);
    const fieldErrors = fieldRules.map((rule) => runRule(rule, value, model)).filter((message) => message !== undefined);
    if (fieldErrors.length === 0) {
      delete errors[path];
    } else {
      errors[path] = fieldErrors;
    }
    return { valid: fieldErrors.length === 0, errors: fieldErrors };
  };
  return {
    model,
    errors,
    validate() {
      const allErrors = {};
      Object.keys(rules).forEach((path) => {
        const result = validateField(path);
        if (!result.valid) {
          allErrors[path] = result.errors;
        }
      });
      return { valid: Object.keys(allErrors).length === 0, errors: allErrors };
    },
    validateField,
    resetErrors() {
      Object.keys(errors).forEach((path) => delete errors[path]);
    }
  };
}
// lib/core/animation/TransitionGroup.ts
class TransitionGroup extends Component {
  initState() {
    return {};
  }
  initStyles() {}
  render() {
    const { tag, type, duration } = normalizeTransitionGroupProps(this.props);
    const children = validateTransitionGroupChildren(this.props.children ?? []);
    return {
      tag,
      props: this.props.elementProps,
      listeners: this.props.listeners,
      children,
      transitionGroup: {
        type,
        duration
      }
    };
  }
}
// lib/index.ts
function createApp(options = {}) {
  return new OneApp(options);
}
var version = "0.0.2";
var name = "@geektech/tsone";
export {
  version,
  validate,
  useRouter,
  unref,
  stop,
  slot,
  setModelValue,
  required,
  renderStyleSheet,
  renderHtmlDocument,
  ref,
  readonly,
  reactive,
  name,
  modelPath,
  minLength,
  isSlotProvider,
  isRef,
  isReadonly,
  isReactive,
  isHTMLNode,
  isComponentNode,
  h,
  getModelValue,
  effect,
  each,
  createRouter,
  createForm,
  createComponent,
  createApp,
  computed,
  Ul,
  TransitionGroup,
  Tr,
  Thead,
  Th,
  Textarea,
  TextRenderStrategy,
  TemplateEngine,
  Td,
  Tbody,
  Tag,
  Table,
  Strong,
  Span,
  Small,
  SlotRenderStrategy,
  Select,
  Section,
  RouterView,
  RouterLink,
  Router,
  RendererContext,
  ReactiveSystem,
  Pre,
  P,
  Option,
  OneApp,
  Ol,
  Nav,
  ModelBindingController,
  Main,
  Li,
  Label,
  Input,
  Img,
  Header,
  H6,
  H5,
  H4,
  H3,
  H2,
  H1,
  Form,
  Footer,
  Em,
  ElementRenderStrategy,
  Div,
  ComponentRenderStrategy,
  Component,
  Code,
  Button,
  Blockquote,
  Aside,
  Article,
  A
};

//# debugId=7471E8A79DBDD62164756E2164756E21
//# sourceMappingURL=index.js.map
