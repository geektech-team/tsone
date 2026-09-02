import {
  StyleManager
} from "./index-8wjswsye.js";

// lib/core/reactive/types.ts
var IS_REACTIVE = Symbol("is_reactive");
var IS_READONLY = Symbol("is_readonly");
var IS_REF = Symbol("is_ref");
var MUTATING_ARRAY_METHODS = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse"
];
function hasReactiveFlag(value, flag) {
  return Boolean(Reflect.get(value, flag));
}
function isObject(value) {
  return value !== null && typeof value === "object";
}

// lib/core/reactive.ts
var effectId = 0;

class ReactiveSystem {
  static instance;
  activeEffect = null;
  effectStack = [];
  targetMap = new WeakMap;
  reactiveMap = new WeakMap;
  readonlyMap = new WeakMap;
  constructor() {}
  static getInstance() {
    if (!ReactiveSystem.instance) {
      ReactiveSystem.instance = new ReactiveSystem;
    }
    return ReactiveSystem.instance;
  }
  reactive(target) {
    if (!isObject(target)) {
      console.warn("reactive: target must be an object");
      return target;
    }
    if (isReactive(target)) {
      return target;
    }
    if (this.reactiveMap.has(target)) {
      return this.reactiveMap.get(target);
    }
    if (Array.isArray(target)) {
      return this.createReactiveArray(target);
    }
    const proxy = new Proxy(target, {
      get: (target2, key) => {
        if (key === IS_REACTIVE) {
          return true;
        }
        if (key === IS_READONLY) {
          return false;
        }
        this.track(target2, key);
        const value = Reflect.get(target2, key);
        if (isObject(value) && !hasReactiveFlag(value, IS_READONLY)) {
          return this.reactive(value);
        }
        return value;
      },
      set: (target2, key, value) => {
        if (hasReactiveFlag(target2, IS_READONLY)) {
          console.warn(`Cannot set property ${String(key)} on readonly object`);
          return false;
        }
        const oldValue = Reflect.get(target2, key);
        if (isObject(value) && !hasReactiveFlag(value, IS_REACTIVE) && !hasReactiveFlag(value, IS_READONLY)) {
          value = this.reactive(value);
        }
        const result = Reflect.set(target2, key, value);
        if (oldValue !== value) {
          this.trigger(target2, key);
        }
        return result;
      },
      deleteProperty: (target2, key) => {
        if (hasReactiveFlag(target2, IS_READONLY)) {
          console.warn(`Cannot delete property ${String(key)} on readonly object`);
          return false;
        }
        const hadKey = key in target2;
        const result = Reflect.deleteProperty(target2, key);
        if (hadKey) {
          this.trigger(target2, key);
        }
        return result;
      }
    });
    this.reactiveMap.set(target, proxy);
    return proxy;
  }
  createReactiveArray(target) {
    if (this.reactiveMap.has(target)) {
      return this.reactiveMap.get(target);
    }
    const proxy = new Proxy(target, {
      get: (target2, key) => {
        if (key === IS_REACTIVE) {
          return true;
        }
        if (key === IS_READONLY) {
          return false;
        }
        this.track(target2, key);
        const value = Reflect.get(target2, key);
        if (typeof key === "string" && MUTATING_ARRAY_METHODS.includes(key)) {
          return (...args) => {
            const arrayMethod = value;
            const result = arrayMethod.apply(target2, args);
            this.trigger(target2, "length");
            this.trigger(target2, key);
            return result;
          };
        }
        if (isObject(value) && !hasReactiveFlag(value, IS_READONLY)) {
          return this.reactive(value);
        }
        return value;
      },
      set: (target2, key, value) => {
        if (hasReactiveFlag(target2, IS_READONLY)) {
          console.warn(`Cannot set property ${String(key)} on readonly object`);
          return false;
        }
        const oldValue = Reflect.get(target2, key);
        if (isObject(value) && !hasReactiveFlag(value, IS_REACTIVE) && !hasReactiveFlag(value, IS_READONLY)) {
          value = this.reactive(value);
        }
        const result = Reflect.set(target2, key, value);
        if (oldValue !== value) {
          this.trigger(target2, key);
          if (typeof key === "string" && !isNaN(Number(key))) {
            this.trigger(target2, "length");
          }
        }
        return result;
      },
      deleteProperty: (target2, key) => {
        if (hasReactiveFlag(target2, IS_READONLY)) {
          console.warn(`Cannot delete property ${String(key)} on readonly object`);
          return false;
        }
        const hadKey = key in target2;
        const result = Reflect.deleteProperty(target2, key);
        if (hadKey) {
          this.trigger(target2, key);
          this.trigger(target2, "length");
        }
        return result;
      }
    });
    this.reactiveMap.set(target, proxy);
    return proxy;
  }
  readonly(target) {
    if (!isObject(target)) {
      console.warn("readonly: target must be an object");
      return target;
    }
    if (hasReactiveFlag(target, IS_READONLY)) {
      return target;
    }
    if (this.readonlyMap.has(target)) {
      return this.readonlyMap.get(target);
    }
    const proxy = new Proxy(target, {
      get: (target2, key) => {
        if (key === IS_REACTIVE) {
          return false;
        }
        if (key === IS_READONLY) {
          return true;
        }
        const value = Reflect.get(target2, key);
        if (isObject(value)) {
          return this.readonly(value);
        }
        return value;
      },
      set: () => {
        console.warn("Cannot set property on readonly object");
        return false;
      },
      deleteProperty: () => {
        console.warn("Cannot delete property on readonly object");
        return false;
      }
    });
    this.readonlyMap.set(target, proxy);
    return proxy;
  }
  effect(fn, options) {
    const { lazy = false, scheduler, throwOnError = false } = options || {};
    const effectFn = () => {
      if (!effectFn.active) {
        return fn();
      }
      try {
        this.cleanup(effectFn);
        this.effectStack.push(effectFn);
        this.activeEffect = effectFn;
        return fn();
      } catch (error) {
        if (throwOnError) {
          throw error;
        }
        console.error("Effect error:", error);
        return;
      } finally {
        this.effectStack.pop();
        this.activeEffect = this.effectStack[this.effectStack.length - 1] ?? null;
      }
    };
    effectFn.id = effectId++;
    effectFn.deps = [];
    effectFn.active = true;
    effectFn.scheduler = scheduler;
    if (!lazy) {
      effectFn();
    }
    return effectFn;
  }
  computed(getter) {
    let dirty = true;
    let value;
    const computedTarget = {};
    const trackComputedValue = () => {
      this.track(computedTarget, "value");
    };
    const runner = this.effect(() => {
      value = getter();
      dirty = false;
    }, {
      lazy: true,
      scheduler: () => {
        if (!dirty) {
          dirty = true;
          this.trigger(computedTarget, "value");
        }
      }
    });
    return {
      get value() {
        if (dirty) {
          runner();
        }
        trackComputedValue();
        return value;
      }
    };
  }
  cleanup(effect) {
    effect.deps.forEach((dep) => {
      dep.delete(effect);
    });
    effect.deps.length = 0;
  }
  track(target, key) {
    if (!this.activeEffect || !this.activeEffect.active)
      return;
    let depsMap = this.targetMap.get(target);
    if (!depsMap) {
      depsMap = new Map;
      this.targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
      dep = new Set;
      depsMap.set(key, dep);
    }
    if (!dep.has(this.activeEffect)) {
      dep.add(this.activeEffect);
      this.activeEffect.deps.push(dep);
    }
  }
  trigger(target, key) {
    const depsMap = this.targetMap.get(target);
    if (!depsMap)
      return;
    const dep = depsMap.get(key);
    if (!dep)
      return;
    const effects = new Set(dep);
    effects.forEach((effect) => {
      if (effect.active) {
        if (effect.scheduler) {
          effect.scheduler(effect);
        } else {
          effect();
        }
      }
    });
  }
  stop(effect) {
    if (effect.active) {
      this.cleanup(effect);
      effect.active = false;
    }
  }
}
function reactive(target) {
  return ReactiveSystem.getInstance().reactive(target);
}
function readonly(target) {
  return ReactiveSystem.getInstance().readonly(target);
}
function effect(fn, options) {
  return ReactiveSystem.getInstance().effect(fn, options);
}
function computed(getter) {
  return ReactiveSystem.getInstance().computed(getter);
}
function ref(value) {
  const wrapper = { value };
  Object.defineProperty(wrapper, IS_REF, {
    configurable: false,
    enumerable: false,
    value: true
  });
  return reactive(wrapper);
}
function isRef(value) {
  return isObject(value) && Boolean(Reflect.get(value, IS_REF));
}
function unref(value) {
  return isRef(value) ? value.value : value;
}
function stop(effect2) {
  ReactiveSystem.getInstance().stop(effect2);
}
function isReactive(value) {
  return isObject(value) && hasReactiveFlag(value, IS_REACTIVE);
}
function isReadonly(value) {
  return isObject(value) && hasReactiveFlag(value, IS_READONLY);
}

// lib/core/vnode.ts
function isComponentNode(vnode) {
  return typeof vnode === "object" && vnode !== null && "component" in vnode;
}
function isHTMLNode(vnode) {
  return typeof vnode === "object" && vnode !== null && "tag" in vnode && vnode.tag !== "slot";
}
function isSlotProvider(vnode) {
  return typeof vnode === "object" && vnode !== null && "tag" in vnode && vnode.tag === "slot";
}
function h(tag, props, children, listeners, key, directions) {
  return {
    tag,
    props,
    children,
    listeners,
    key,
    directions
  };
}
function Tag(tag, options = {}) {
  return {
    tag,
    ...options
  };
}
function createElementFactory(tag) {
  return (options = {}) => Tag(tag, options);
}
var Div = createElementFactory("div");
var Span = createElementFactory("span");
var P = createElementFactory("p");
var Button = createElementFactory("button");
var Input = createElementFactory("input");
var Section = createElementFactory("section");
var Main = createElementFactory("main");
var Header = createElementFactory("header");
var Footer = createElementFactory("footer");
var Nav = createElementFactory("nav");
var Article = createElementFactory("article");
var Aside = createElementFactory("aside");
var H1 = createElementFactory("h1");
var H2 = createElementFactory("h2");
var H3 = createElementFactory("h3");
var H4 = createElementFactory("h4");
var H5 = createElementFactory("h5");
var H6 = createElementFactory("h6");
var Strong = createElementFactory("strong");
var Em = createElementFactory("em");
var Small = createElementFactory("small");
var Pre = createElementFactory("pre");
var Code = createElementFactory("code");
var Blockquote = createElementFactory("blockquote");
var Ul = createElementFactory("ul");
var Ol = createElementFactory("ol");
var Li = createElementFactory("li");
var A = createElementFactory("a");
var Img = createElementFactory("img");
var Form = createElementFactory("form");
var Label = createElementFactory("label");
var Textarea = createElementFactory("textarea");
var Select = createElementFactory("select");
var Option = createElementFactory("option");
var Table = createElementFactory("table");
var Thead = createElementFactory("thead");
var Tbody = createElementFactory("tbody");
var Tr = createElementFactory("tr");
var Th = createElementFactory("th");
var Td = createElementFactory("td");
function createComponent(componentClass, props, children, key, directions) {
  return {
    component: componentClass,
    props,
    children,
    key,
    directions
  };
}
function slot(name, key, directions) {
  return {
    tag: "slot",
    props: { name },
    key,
    directions
  };
}
function each(items, render, key) {
  return items.map((item, index) => {
    const vnode = render(item, index);
    if (typeof vnode === "string") {
      throw new Error("each render callback must return a VNode");
    }
    return { ...vnode, key: key(item, index) };
  });
}

// lib/core/model.ts
function pathSegments(path) {
  const segments = path.split(".");
  if (path.length === 0 || segments.some((segment) => segment.length === 0 || segment === "__proto__" || segment === "prototype" || segment === "constructor")) {
    throw new Error(`Invalid model path "${path}"`);
  }
  return segments;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
function modelPath(binding) {
  return typeof binding === "string" ? binding : binding.path;
}
function getModelValue(state, path) {
  let value = state;
  for (const segment of pathSegments(path)) {
    if (!isRecord(value)) {
      throw new Error(`Invalid model path "${path}"`);
    }
    if (!hasOwn(value, segment)) {
      if (segment in value) {
        throw new Error(`Invalid model path "${path}"`);
      }
      return;
    }
    value = value[segment];
  }
  return value;
}
function setModelValue(state, path, value) {
  const segments = pathSegments(path);
  let target = state;
  for (const segment of segments.slice(0, -1)) {
    if (!hasOwn(target, segment)) {
      if (segment in target) {
        throw new Error(`Invalid model path "${path}"`);
      }
      target[segment] = {};
    } else if (!isRecord(target[segment])) {
      throw new Error(`Invalid model path "${path}"`);
    }
    const nextTarget = target[segment];
    if (!isRecord(nextTarget)) {
      throw new Error(`Invalid model path "${path}"`);
    }
    target = nextTarget;
  }
  const lastSegment = segments[segments.length - 1];
  target[lastSegment] = value;
}
function displayValue(binding, value) {
  if (typeof binding !== "string" && binding.format) {
    return binding.format(value);
  }
  return value === undefined || value === null ? "" : String(value);
}
function toModelValue(binding, value) {
  if (typeof binding !== "string" && binding.parse) {
    return binding.parse(value);
  }
  return value;
}
function syncControl(element, binding, value) {
  if (element instanceof HTMLInputElement) {
    if (element.type === "checkbox") {
      element.checked = Array.isArray(value) ? value.some((item) => String(item) === element.value) : Boolean(value);
      return;
    }
    if (element.type === "radio") {
      element.checked = value === element.value;
      return;
    }
    element.value = displayValue(binding, value);
    return;
  }
  if (element instanceof HTMLTextAreaElement) {
    element.value = displayValue(binding, value);
    return;
  }
  if (element instanceof HTMLSelectElement) {
    if (element.multiple) {
      const selected = Array.isArray(value) ? new Set(value.map(String)) : new Set;
      for (let index = 0;index < element.options.length; index += 1) {
        const option = element.options.item(index);
        if (!option) {
          continue;
        }
        option.selected = selected.has(option.value);
      }
      return;
    }
    element.value = displayValue(binding, value);
  }
}
function controlValue(element, currentValue) {
  if (element instanceof HTMLInputElement) {
    if (element.type === "checkbox") {
      if (Array.isArray(currentValue)) {
        const values = currentValue.filter((value) => String(value) !== element.value);
        return element.checked ? [...values, element.value] : values;
      }
      return element.checked;
    }
    if (element.type === "radio") {
      return element.checked ? element.value : currentValue;
    }
    return element.value;
  }
  if (element instanceof HTMLTextAreaElement) {
    return element.value;
  }
  if (element instanceof HTMLSelectElement) {
    if (!element.multiple) {
      return element.value;
    }
    const values = [];
    for (let index = 0;index < element.selectedOptions.length; index += 1) {
      const option = element.selectedOptions.item(index);
      if (option) {
        values.push(option.value);
      }
    }
    return values;
  }
  return;
}

class ModelBindingController {
  bindings = new WeakMap;
  bind(element, binding, state) {
    if (!this.isSupportedControl(element)) {
      return;
    }
    const existing = this.bindings.get(element);
    if (existing && this.sameBinding(existing, binding)) {
      return;
    }
    this.cleanup(element);
    const path = modelPath(binding);
    const sync = () => syncControl(element, binding, getModelValue(state, path));
    const eventName = element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement && !["checkbox", "radio"].includes(element.type) ? "input" : "change";
    const listener = () => {
      const currentValue = getModelValue(state, path);
      setModelValue(state, path, toModelValue(binding, controlValue(element, currentValue)));
    };
    element.addEventListener(eventName, listener);
    const effectRef = effect(sync);
    this.bindings.set(element, {
      binding,
      path,
      parse: typeof binding === "string" ? undefined : binding.parse,
      format: typeof binding === "string" ? undefined : binding.format,
      eventName,
      listener,
      effect: effectRef
    });
  }
  cleanup(element) {
    const existing = this.bindings.get(element);
    if (!existing) {
      return;
    }
    element.removeEventListener(existing.eventName, existing.listener);
    stop(existing.effect);
    this.bindings.delete(element);
  }
  isSupportedControl(element) {
    return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
  }
  sameBinding(record, binding) {
    if (typeof record.binding === "string" || typeof binding === "string") {
      return record.binding === binding;
    }
    return record.path === binding.path && record.parse === binding.parse && record.format === binding.format;
  }
}

// lib/core/renderer/props.ts
function isEventProp(key) {
  return /^on[A-Z]/.test(key) || /^on[a-z]/.test(key);
}
function eventNameFromProp(key) {
  return key.slice(2).toLowerCase();
}
function parseEventName(event) {
  const [eventName, ...modifiers] = event.split(".");
  return { eventName, modifiers: new Set(modifiers) };
}
function wrapEventHandler(handler, modifiers) {
  const eventHandler = (event) => {
    if (modifiers.has("stop")) {
      event.stopPropagation();
    }
    if (modifiers.has("prevent")) {
      event.preventDefault();
    }
    if (modifiers.has("self") && event.currentTarget !== event.target) {
      return;
    }
    if (modifiers.has("once")) {
      event.currentTarget.removeEventListener(event.type, eventHandler);
    }
    handler(event);
  };
  return eventHandler;
}
function setStyleValue(style, property, value) {
  const cssProperty = property.includes("-") ? property : property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  style.setProperty(cssProperty, String(value));
}

// lib/core/renderer/element-strategy.ts
class ElementRenderStrategy {
  listeners = new WeakMap;
  effects = new WeakMap;
  modelBindings = new ModelBindingController;
  matches(vnode) {
    return typeof vnode === "object" && vnode !== null && isHTMLNode(vnode);
  }
  mount(vnode, context) {
    if (vnode.directions?.if === false) {
      return document.createComment("if");
    }
    const element = document.createElement(vnode.tag);
    this.applyProps(element, {}, vnode.props ?? {}, context);
    this.updateListeners(element, {}, this.collectListeners(vnode));
    this.mountChildren(element, vnode, context);
    this.applyDirections(element, undefined, vnode.directions, context);
    return element;
  }
  patch(oldVNode, newVNode, currentNode, context) {
    if (oldVNode.tag !== newVNode.tag || currentNode.nodeType === Node.COMMENT_NODE) {
      const nextNode = this.mount(newVNode, context);
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      this.unmount(oldVNode, currentNode, context);
      return nextNode;
    }
    if (!(currentNode instanceof HTMLElement)) {
      return currentNode;
    }
    if (newVNode.directions?.if === false) {
      const nextNode = document.createComment("if");
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      this.unmount(oldVNode, currentNode, context);
      return nextNode;
    }
    this.applyProps(currentNode, oldVNode.props ?? {}, newVNode.props ?? {}, context);
    this.updateListeners(currentNode, this.collectListeners(oldVNode), this.collectListeners(newVNode));
    this.updateChildren(currentNode, oldVNode, newVNode, context);
    this.applyDirections(currentNode, oldVNode.directions, newVNode.directions, context);
    return currentNode;
  }
  unmount(vnode, currentNode, context) {
    if (!(currentNode instanceof HTMLElement)) {
      return;
    }
    this.effects.get(currentNode)?.forEach((item) => stop(item));
    this.effects.delete(currentNode);
    this.listeners.get(currentNode)?.forEach(({ eventName, listener }) => {
      currentNode.removeEventListener(eventName, listener);
    });
    this.listeners.delete(currentNode);
    this.modelBindings.cleanup(currentNode);
    this.unmountChildren(currentNode, vnode, context);
  }
  mountChildren(element, vnode, context) {
    (vnode.children ?? []).forEach((child) => {
      element.appendChild(context.renderer.mount(child, context));
    });
  }
  updateChildren(element, oldVNode, newVNode, context) {
    this.updateOrdinaryChildren(element, oldVNode.children ?? [], newVNode.children ?? [], context);
  }
  unmountChildren(element, vnode, context) {
    (vnode.children ?? []).forEach((child, index) => {
      const childNode = element.childNodes[index];
      if (childNode) {
        context.renderer.unmount(child, childNode, context);
      }
    });
  }
  applyProps(element, oldProps, newProps, context) {
    Object.keys(oldProps).forEach((key) => {
      if (isEventProp(key) || key in newProps) {
        return;
      }
      if (key === "className" || key === "class") {
        element.removeAttribute("class");
      } else if (key === "style") {
        element.removeAttribute("style");
      } else {
        element.removeAttribute(key);
      }
    });
    Object.entries(newProps).forEach(([key, value]) => {
      if (isEventProp(key)) {
        return;
      }
      if (key === "className" || key === "class") {
        element.className = String(value ?? "");
        return;
      }
      if (key === "style" && typeof value === "object" && value !== null) {
        element.removeAttribute("style");
        Object.entries(value).forEach(([cssKey, cssValue]) => {
          setStyleValue(element.style, cssKey, cssValue);
        });
        return;
      }
      if (value === false || value === undefined || value === null) {
        element.removeAttribute(key);
        return;
      }
      if (value === true) {
        element.setAttribute(key, "");
        return;
      }
      if (typeof value === "string" && context.templateEngine.hasExpressions(value)) {
        this.setupReactiveAttribute(element, key, value, context);
        return;
      }
      element.setAttribute(key, String(value));
    });
  }
  applyDirections(element, oldDirections, newDirections, context) {
    if (newDirections && "show" in newDirections) {
      element.style.display = newDirections.show ? "" : "none";
    } else if (oldDirections && "show" in oldDirections) {
      element.style.display = "";
    }
    if (!newDirections?.model) {
      this.modelBindings.cleanup(element);
      return;
    }
    this.modelBindings.bind(element, newDirections.model, context.templateEngine.state);
  }
  updateOrdinaryChildren(element, oldChildren, newChildren, context) {
    this.assertNoDuplicateKeys(oldChildren);
    this.assertNoDuplicateKeys(newChildren);
    if (this.hasOnlyKeyedChildren(oldChildren, newChildren)) {
      this.updateKeyedChildren(element, oldChildren, newChildren, context);
      return;
    }
    const sharedLength = Math.min(oldChildren.length, newChildren.length);
    for (let index = 0;index < sharedLength; index += 1) {
      const childNode = element.childNodes[index];
      if (!childNode) {
        element.appendChild(context.renderer.mount(newChildren[index], context));
        continue;
      }
      context.renderer.patch(oldChildren[index], newChildren[index], childNode, context);
    }
    for (let index = sharedLength;index < newChildren.length; index += 1) {
      element.appendChild(context.renderer.mount(newChildren[index], context));
    }
    for (let index = oldChildren.length - 1;index >= newChildren.length; index -= 1) {
      const childNode = element.childNodes[index];
      if (childNode) {
        context.renderer.unmount(oldChildren[index], childNode, context);
        if (childNode.parentNode === element) {
          element.removeChild(childNode);
        }
      }
    }
  }
  updateKeyedChildren(element, oldChildren, newChildren, context) {
    const oldEntries = oldChildren.map((vnode, index) => ({
      vnode,
      node: element.childNodes[index],
      index
    }));
    const keyedOldEntries = new Map;
    const usedOldIndexes = new Set;
    oldEntries.forEach((entry) => {
      const key = this.getVNodeKey(entry.vnode);
      if (key !== undefined && entry.node) {
        keyedOldEntries.set(key, {
          vnode: entry.vnode,
          node: entry.node,
          index: entry.index
        });
      }
    });
    newChildren.forEach((newChild, newIndex) => {
      const key = this.getVNodeKey(newChild);
      const oldEntry = key === undefined ? undefined : keyedOldEntries.get(key);
      let nextNode;
      if (oldEntry) {
        nextNode = context.renderer.patch(oldEntry.vnode, newChild, oldEntry.node, context);
        usedOldIndexes.add(oldEntry.index);
      } else {
        nextNode = context.renderer.mount(newChild, context);
      }
      const referenceNode = element.childNodes[newIndex] ?? null;
      if (nextNode !== referenceNode) {
        element.insertBefore(nextNode, referenceNode);
      }
    });
    oldEntries.forEach((entry) => {
      if (!entry.node || usedOldIndexes.has(entry.index)) {
        return;
      }
      context.renderer.unmount(entry.vnode, entry.node, context);
      if (entry.node.parentNode === element) {
        element.removeChild(entry.node);
      }
    });
  }
  hasOnlyKeyedChildren(oldChildren, newChildren) {
    return [...oldChildren, ...newChildren].every((child) => this.getVNodeKey(child) !== undefined);
  }
  assertNoDuplicateKeys(children) {
    const keys = new Set;
    children.forEach((child) => {
      const key = this.getVNodeKey(child);
      if (key === undefined) {
        return;
      }
      if (keys.has(key)) {
        throw new Error(`Duplicate key "${key}"`);
      }
      keys.add(key);
    });
  }
  getVNodeKey(vnode) {
    if (typeof vnode === "string") {
      return;
    }
    return vnode.key;
  }
  collectListeners(vnode) {
    const listeners = {};
    Object.entries(vnode.props ?? {}).forEach(([key, value]) => {
      if (isEventProp(key) && typeof value === "function") {
        listeners[eventNameFromProp(key)] = value;
      }
    });
    return {
      ...listeners,
      ...vnode.listeners ?? {}
    };
  }
  updateListeners(element, oldListeners, newListeners) {
    const store = this.listeners.get(element) ?? new Map;
    const oldKeys = new Set(Object.keys(oldListeners));
    const newKeys = new Set(Object.keys(newListeners));
    oldKeys.forEach((event) => {
      if (!newKeys.has(event) || oldListeners[event] !== newListeners[event]) {
        const stored = store.get(event);
        if (stored) {
          element.removeEventListener(stored.eventName, stored.listener);
          store.delete(event);
        }
      }
    });
    newKeys.forEach((event) => {
      if (!oldKeys.has(event) || oldListeners[event] !== newListeners[event]) {
        const { eventName, modifiers } = parseEventName(event);
        const listener = wrapEventHandler(newListeners[event], modifiers);
        element.addEventListener(eventName, listener);
        store.set(event, { eventName, listener });
      }
    });
    this.listeners.set(element, store);
  }
  setupReactiveAttribute(element, attrName, attrValue, context) {
    const effectRef = effect(() => {
      element.setAttribute(attrName, context.templateEngine.evaluateTemplateValue(attrValue));
    });
    this.trackEffect(element, effectRef);
  }
  trackEffect(element, effectRef) {
    const effects = this.effects.get(element) ?? new Set;
    effects.add(effectRef);
    this.effects.set(element, effects);
  }
}

// lib/core/animation/list-animation-controller.ts
var ENTER_KEYFRAMES = {
  fade: [{ opacity: 0 }, { opacity: 1 }],
  "slide-up": [
    { opacity: 0, transform: "translateY(12px)" },
    { opacity: 1, transform: "translateY(0)" }
  ],
  "slide-down": [
    { opacity: 0, transform: "translateY(-12px)" },
    { opacity: 1, transform: "translateY(0)" }
  ],
  "slide-left": [
    { opacity: 0, transform: "translateX(12px)" },
    { opacity: 1, transform: "translateX(0)" }
  ],
  "slide-right": [
    { opacity: 0, transform: "translateX(-12px)" },
    { opacity: 1, transform: "translateX(0)" }
  ],
  scale: [
    { opacity: 0, transform: "scale(0.95)" },
    { opacity: 1, transform: "scale(1)" }
  ]
};

class ListAnimationController {
  runs = new WeakMap;
  playEnter(element, options) {
    return this.play(element, options, "enter");
  }
  playExit(element, options) {
    return this.play(element, options, "exit");
  }
  cancel(element) {
    const current = this.runs.get(element);
    if (!current) {
      return;
    }
    this.runs.delete(element);
    current.animation.cancel();
  }
  play(element, transition, phase) {
    this.cancel(element);
    if (!this.canAnimate(element)) {
      return null;
    }
    const enterKeyframes = ENTER_KEYFRAMES[transition.type];
    const keyframes = phase === "enter" ? [...enterKeyframes] : [...enterKeyframes].reverse();
    const options = {
      duration: transition.duration,
      easing: "ease",
      fill: "both"
    };
    const animation = element.animate(keyframes, options);
    const token = Symbol("list-animation");
    const finished = animation.finished.then(() => "finished", () => "cancelled");
    const run = {
      animation,
      token,
      keyframes,
      options,
      finished
    };
    this.runs.set(element, run);
    finished.then((result) => {
      if (this.runs.get(element)?.token !== token) {
        return;
      }
      this.runs.delete(element);
      if (phase === "enter" && result === "finished") {
        animation.cancel();
      }
    });
    return run;
  }
  canAnimate(element) {
    const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return !reduced && typeof element.animate === "function";
  }
}

// lib/core/animation/types.ts
var TRANSITION_ANIMATION_TYPES = [
  "fade",
  "slide-up",
  "slide-down",
  "slide-left",
  "slide-right",
  "scale"
];
function normalizeTransitionGroupProps(props) {
  const tag = (props.tag ?? "div").trim();
  const type = props.type ?? "fade";
  const duration = props.duration ?? 300;
  if (!tag) {
    throw new Error("TransitionGroup tag must not be empty");
  }
  if (!TRANSITION_ANIMATION_TYPES.includes(type)) {
    throw new Error(`Unknown TransitionGroup animation type "${type}"`);
  }
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error("TransitionGroup duration must be a non-negative finite number");
  }
  return { tag, type, duration };
}
function validateTransitionGroupChildren(children) {
  const keys = new Set;
  return children.map((child) => {
    if (typeof child === "string" || child.key === undefined || keys.has(child.key)) {
      throw new Error("TransitionGroup children must have unique keys");
    }
    keys.add(child.key);
    return child;
  });
}
function isTransitionGroupNode(vnode) {
  return typeof vnode === "object" && vnode !== null && "transitionGroup" in vnode && isHTMLNode(vnode);
}

// lib/core/animation/transition-group-strategy.ts
class TransitionGroupRenderStrategy extends ElementRenderStrategy {
  entries = new WeakMap;
  animations = new ListAnimationController;
  matches(vnode) {
    return isTransitionGroupNode(vnode);
  }
  mountChildren(element, groupVNode, context) {
    const keyedChildren = validateTransitionGroupChildren(groupVNode.children ?? []);
    const entries = new Map;
    keyedChildren.forEach((childVNode) => {
      const node = context.renderer.mount(childVNode, context);
      element.appendChild(node);
      const entry = {
        key: childVNode.key,
        vnode: childVNode,
        node,
        status: "active"
      };
      entries.set(entry.key, entry);
      this.playEnter(entry, node, groupVNode.transitionGroup);
    });
    this.entries.set(element, entries);
  }
  updateChildren(element, _oldVNode, newVNode, context) {
    const entries = this.entries.get(element) ?? new Map;
    const nextChildren = validateTransitionGroupChildren(newVNode.children ?? []);
    const nextKeys = new Set(nextChildren.map((child) => child.key));
    const ordered = [];
    nextChildren.forEach((childVNode) => {
      const key = childVNode.key;
      const current = entries.get(key);
      if (current) {
        const wasExiting = current.status === "exiting";
        if (wasExiting && current.node instanceof HTMLElement) {
          this.animations.cancel(current.node);
        }
        current.status = "active";
        current.animationToken = undefined;
        current.node = context.renderer.patch(current.vnode, childVNode, current.node, context);
        current.vnode = childVNode;
        ordered.push(current);
        if (wasExiting) {
          this.playEnter(current, current.node, newVNode.transitionGroup);
        }
        return;
      }
      const node = context.renderer.mount(childVNode, context);
      const entry = {
        key,
        vnode: childVNode,
        node,
        status: "active"
      };
      entries.set(key, entry);
      ordered.push(entry);
      this.playEnter(entry, node, newVNode.transitionGroup);
    });
    entries.forEach((entry, key) => {
      if (nextKeys.has(key) || entry.status !== "active") {
        return;
      }
      this.startExit(element, entry, newVNode.transitionGroup, context);
    });
    this.placeActiveEntries(element, ordered);
    this.entries.set(element, entries);
  }
  unmountChildren(element, vnode, context) {
    const entries = this.entries.get(element);
    if (!entries) {
      super.unmountChildren(element, vnode, context);
      return;
    }
    entries.forEach((entry) => {
      if (entry.node instanceof HTMLElement) {
        this.animations.cancel(entry.node);
      }
      context.renderer.unmount(entry.vnode, entry.node, context);
      if (entry.node.parentNode === element) {
        element.removeChild(entry.node);
      }
    });
    entries.clear();
    this.entries.delete(element);
  }
  playEnter(entry, node, options) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    const run = this.animations.playEnter(node, options);
    entry.animationToken = run?.token;
  }
  startExit(wrapper, entry, options, context) {
    entry.status = "exiting";
    const run = entry.node instanceof HTMLElement ? this.animations.playExit(entry.node, options) : null;
    if (!run) {
      this.finishExit(wrapper, entry, context);
      return;
    }
    entry.animationToken = run.token;
    run.finished.then((result) => {
      if (result === "finished" && entry.status === "exiting" && entry.animationToken === run.token) {
        this.finishExit(wrapper, entry, context);
      }
    });
  }
  finishExit(wrapper, entry, context) {
    const entries = this.entries.get(wrapper);
    if (entries?.get(entry.key) !== entry) {
      return;
    }
    context.renderer.unmount(entry.vnode, entry.node, context);
    if (entry.node.parentNode === wrapper) {
      wrapper.removeChild(entry.node);
    }
    entries.delete(entry.key);
  }
  placeActiveEntries(wrapper, ordered) {
    let reference = null;
    for (let index = ordered.length - 1;index >= 0; index -= 1) {
      wrapper.insertBefore(ordered[index].node, reference);
      reference = ordered[index].node;
    }
  }
}

// lib/core/renderer.ts
class RendererContext {
  strategies;
  constructor() {
    this.strategies = [
      new TextRenderStrategy,
      new ComponentRenderStrategy,
      new SlotRenderStrategy,
      new TransitionGroupRenderStrategy,
      new ElementRenderStrategy
    ];
  }
  mount(vnode, context) {
    return this.findStrategy(vnode).mount(vnode, context);
  }
  patch(oldVNode, newVNode, currentNode, context) {
    const oldStrategy = this.findStrategy(oldVNode);
    const newStrategy = this.findStrategy(newVNode);
    if (oldStrategy !== newStrategy) {
      const nextNode = newStrategy.mount(newVNode, context);
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      oldStrategy.unmount(oldVNode, currentNode, context);
      return nextNode;
    }
    return oldStrategy.patch(oldVNode, newVNode, currentNode, context);
  }
  unmount(vnode, currentNode, context) {
    this.findStrategy(vnode).unmount(vnode, currentNode, context);
  }
  findStrategy(vnode) {
    const strategy = this.strategies.find((item) => item.matches(vnode));
    if (!strategy) {
      throw new Error("No render strategy found for vnode");
    }
    return strategy;
  }
}

class TextRenderStrategy {
  matches(vnode) {
    return typeof vnode === "string";
  }
  mount(vnode, context) {
    return context.templateEngine.parseTemplate(vnode);
  }
  patch(oldVNode, newVNode, currentNode, context) {
    if (oldVNode === newVNode) {
      return currentNode;
    }
    const nextNode = this.mount(newVNode, context);
    currentNode.parentNode?.replaceChild(nextNode, currentNode);
    return nextNode;
  }
  unmount() {}
}

class ComponentRenderStrategy {
  instances = new WeakMap;
  instanceNodes = new Map;
  emitterUnsubscribers = new WeakMap;
  matches(vnode) {
    return typeof vnode === "object" && vnode !== null && isComponentNode(vnode);
  }
  mount(vnode, context) {
    if (vnode.directions?.if === false) {
      return document.createComment("if");
    }
    const ComponentClass = vnode.component;
    const instance = new ComponentClass(this.createProps(vnode));
    if (context.appContext && instance.setAppContext) {
      instance.setAppContext(context.appContext);
    }
    this.syncEmitters(instance, vnode.emitters ?? {});
    context.registerChild(instance);
    const node = instance.mountToNode();
    this.trackInstanceNode(instance, node);
    instance.setElementChangeListener?.((previousNode, nextNode) => {
      this.trackInstanceNode(instance, previousNode);
      this.trackInstanceNode(instance, nextNode);
    });
    return node;
  }
  patch(oldVNode, newVNode, currentNode, context) {
    if (currentNode.nodeType === Node.COMMENT_NODE) {
      const nextNode2 = this.mount(newVNode, context);
      currentNode.parentNode?.replaceChild(nextNode2, currentNode);
      return nextNode2;
    }
    if (newVNode.directions?.if === false) {
      const nextNode2 = document.createComment("if");
      currentNode.parentNode?.replaceChild(nextNode2, currentNode);
      this.unmount(oldVNode, currentNode, context);
      return nextNode2;
    }
    const instance = this.instances.get(currentNode);
    if (instance && oldVNode.component === newVNode.component) {
      this.syncEmitters(instance, newVNode.emitters ?? {});
      instance.setProps(this.createProps(newVNode));
      const nextNode2 = instance.getElement() ?? currentNode;
      this.trackInstanceNode(instance, nextNode2);
      return nextNode2;
    }
    const nextNode = this.mount(newVNode, context);
    currentNode.parentNode?.replaceChild(nextNode, currentNode);
    this.unmount(oldVNode, currentNode, context);
    return nextNode;
  }
  unmount(_vnode, currentNode, context) {
    const instance = this.instances.get(currentNode);
    if (instance) {
      this.clearEmitters(instance);
      instance.unmount();
      this.clearInstanceNodes(instance);
      context.unregisterChild(instance);
    }
  }
  createProps(vnode) {
    return {
      ...vnode.props ?? {},
      children: vnode.children ?? []
    };
  }
  syncEmitters(instance, emitters) {
    const current = this.emitterUnsubscribers.get(instance) ?? new Map;
    current.forEach(({ listener: currentListener, unsubscribe }, eventName) => {
      const listener = emitters[eventName];
      if (!listener || listener !== currentListener) {
        unsubscribe();
        current.delete(eventName);
      }
    });
    Object.entries(emitters).forEach(([eventName, listener]) => {
      if (current.get(eventName)?.listener === listener) {
        return;
      }
      current.set(eventName, {
        listener,
        unsubscribe: instance.on(eventName, listener)
      });
    });
    this.emitterUnsubscribers.set(instance, current);
  }
  clearEmitters(instance) {
    this.emitterUnsubscribers.get(instance)?.forEach(({ unsubscribe }) => {
      unsubscribe();
    });
    this.emitterUnsubscribers.delete(instance);
  }
  trackInstanceNode(instance, node) {
    this.instances.set(node, instance);
    const nodes = this.instanceNodes.get(instance) ?? new Set;
    nodes.add(node);
    this.instanceNodes.set(instance, nodes);
  }
  clearInstanceNodes(instance) {
    this.instanceNodes.get(instance)?.forEach((node) => {
      this.instances.delete(node);
    });
    this.instanceNodes.delete(instance);
  }
}

class SlotRenderStrategy {
  renderedChildren = new WeakMap;
  matches(vnode) {
    return typeof vnode === "object" && vnode !== null && isSlotProvider(vnode);
  }
  mount(vnode, context) {
    if (vnode.directions?.if === false) {
      return document.createComment("if");
    }
    const slotContainer = document.createElement("div");
    slotContainer.setAttribute("data-slot", vnode.props.name);
    this.mountSlotChildren(slotContainer, this.resolveChildren(vnode, context), context);
    return slotContainer;
  }
  patch(oldVNode, newVNode, currentNode, context) {
    if (currentNode.nodeType === Node.COMMENT_NODE) {
      const nextNode = this.mount(newVNode, context);
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      return nextNode;
    }
    if (newVNode.directions?.if === false) {
      const nextNode = document.createComment("if");
      currentNode.parentNode?.replaceChild(nextNode, currentNode);
      this.unmount(oldVNode, currentNode, context);
      return nextNode;
    }
    if (currentNode instanceof HTMLElement) {
      currentNode.setAttribute("data-slot", newVNode.props.name);
      this.replaceSlotChildren(currentNode, oldVNode, newVNode, context);
    }
    return currentNode;
  }
  unmount(_vnode, currentNode, context) {
    if (!(currentNode instanceof HTMLElement)) {
      return;
    }
    this.unmountSlotChildren(currentNode, context);
    this.renderedChildren.delete(currentNode);
  }
  resolveChildren(vnode, context) {
    return context.slots[vnode.props.name] ?? vnode.children ?? [];
  }
  replaceSlotChildren(element, _oldVNode, newVNode, context) {
    this.unmountSlotChildren(element, context);
    element.textContent = "";
    this.mountSlotChildren(element, this.resolveChildren(newVNode, context), context);
  }
  mountSlotChildren(element, children, context) {
    children.forEach((child) => {
      element.appendChild(context.renderer.mount(child, context));
    });
    this.renderedChildren.set(element, children);
  }
  unmountSlotChildren(element, context) {
    const children = this.renderedChildren.get(element) ?? [];
    children.forEach((child, index) => {
      const childNode = element.childNodes[index];
      if (childNode) {
        context.renderer.unmount(child, childNode, context);
      }
    });
  }
}

// lib/core/template.ts
class TemplateEngine {
  state;
  bindings = [];
  templateRegex = /{{(.*?)}}/g;
  constructor(state) {
    this.state = state;
    if (!state || typeof state !== "object") {
      throw new Error("TemplateEngine requires a valid state object");
    }
  }
  parseTemplate(text) {
    if (typeof text !== "string") {
      text = String(text);
    }
    const textNode = document.createTextNode("");
    this.templateRegex.lastIndex = 0;
    const matches = Array.from(text.matchAll(this.templateRegex));
    if (matches && matches.length > 0) {
      this.setupReactiveBindings(textNode, text, matches);
    } else {
      textNode.textContent = text;
    }
    return textNode;
  }
  setupReactiveBindings(node, originalText, matches) {
    const keys = new Set;
    const initialText = this.evaluateTemplate(originalText, matches, keys);
    node.textContent = initialText;
    const effectFn = effect(() => {
      try {
        const updatedText = this.evaluateTemplate(originalText, matches, keys);
        if (node.textContent !== updatedText) {
          node.textContent = updatedText;
        }
      } catch (error) {
        console.error("Template update error:", error);
        node.textContent = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    });
    this.bindings.push({
      node,
      originalText,
      effect: effectFn
    });
  }
  evaluateTemplate(text, matches, keys) {
    let result = text;
    matches.forEach((match) => {
      const key = match[1]?.trim();
      if (key) {
        keys.add(key);
        const value = this.getValueFromState(key);
        const displayValue2 = value === undefined || value === null ? "" : String(value);
        result = result.replace(match[0], displayValue2);
      }
    });
    return result;
  }
  getValueFromState(keyPath) {
    if (!keyPath)
      return;
    const keys = keyPath.split(".");
    let value = this.state;
    for (const key of keys) {
      if (!value || typeof value !== "object") {
        return;
      }
      value = value[key];
    }
    return value;
  }
  clearBindings() {
    this.bindings.forEach((binding) => {
      stop(binding.effect);
    });
    this.bindings = [];
  }
  getBindingCount() {
    return this.bindings.length;
  }
  hasExpressions(text) {
    this.templateRegex.lastIndex = 0;
    return this.templateRegex.test(text);
  }
  extractKeys(text) {
    const keys = [];
    let match;
    const regex = new RegExp(this.templateRegex, "g");
    while ((match = regex.exec(text)) !== null) {
      const key = match[1]?.trim();
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }
  evaluateTemplateValue(text) {
    this.templateRegex.lastIndex = 0;
    const matches = Array.from(text.matchAll(this.templateRegex));
    if (!matches || matches.length === 0) {
      return text;
    }
    const keys = new Set;
    return this.evaluateTemplate(text, matches, keys);
  }
}

// lib/core/component/base.ts
class Component {
  props;
  vnode = null;
  el = null;
  renderer = new RendererContext;
  templateEngine;
  childComponents = new Set;
  eventListeners = {};
  providers = new Map;
  updateEffect;
  appContext = null;
  parentComponent = null;
  elementChangeListener = null;
  styleManager;
  state;
  mounted = false;
  constructor(props = {}) {
    this.props = props;
    this.styleManager = new StyleManager;
    this.state = reactive(this.initState() ?? {});
    this.templateEngine = new TemplateEngine(this.state);
    this.initStyles();
    this.updateEffect = effect(() => {
      this.trackStateProperties();
      if (this.mounted) {
        this.update();
      }
    }, { throwOnError: true });
  }
  mount(container) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error("Invalid container element");
    }
    try {
      container.appendChild(this.mountToNode());
    } catch (error) {
      console.error("组件渲染错误:", error);
      throw error;
    }
  }
  mountToNode() {
    if (this.mounted && this.el) {
      return this.el;
    }
    this.beforeMount();
    this.vnode = this.render();
    this.el = this.renderer.mount(this.vnode, this.createRenderContext());
    this.mounted = true;
    this.onMounted();
    return this.el;
  }
  update() {
    if (!this.el || !this.vnode) {
      return;
    }
    this.beforeUpdate();
    const newVNode = this.render();
    const previousElement = this.el;
    this.el = this.renderer.patch(this.vnode, newVNode, this.el, this.createRenderContext());
    if (previousElement !== this.el) {
      this.elementChangeListener?.(previousElement, this.el);
    }
    this.vnode = newVNode;
    this.onUpdated();
  }
  unmount() {
    if (!this.mounted) {
      return;
    }
    this.beforeUnmount();
    if (this.vnode && this.el) {
      this.renderer.unmount(this.vnode, this.el, this.createRenderContext());
    }
    this.childComponents.clear();
    Object.keys(this.eventListeners).forEach((eventName) => {
      this.eventListeners[eventName].clear();
      delete this.eventListeners[eventName];
    });
    this.providers.clear();
    this.parentComponent = null;
    this.elementChangeListener = null;
    this.templateEngine.clearBindings();
    this.styleManager.destroy();
    stop(this.updateEffect);
    if (this.el?.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
    this.vnode = null;
    this.mounted = false;
    this.onUnmounted();
  }
  setProps(props) {
    this.props = {
      ...this.props,
      ...props
    };
    if (this.mounted) {
      this.update();
    }
  }
  setState(state) {
    Object.assign(this.state, state);
  }
  setAppContext(context) {
    this.appContext = context;
    this.childComponents.forEach((child) => {
      child.setAppContext?.(context);
    });
  }
  setParentComponent(parent) {
    this.parentComponent = parent;
  }
  setElementChangeListener(listener) {
    this.elementChangeListener = listener;
  }
  provide(key, value) {
    this.providers.set(key, value);
  }
  inject(key, fallback) {
    const result = this.resolveInjection(key);
    return result.found ? result.value : fallback;
  }
  resolveInjection(key) {
    if (this.providers.has(key)) {
      return { found: true, value: this.providers.get(key) };
    }
    if (this.parentComponent?.resolveInjection) {
      return this.parentComponent.resolveInjection(key);
    }
    return this.resolveAppInjection(key);
  }
  getElement() {
    return this.el;
  }
  beforeMount() {}
  onMounted() {}
  beforeUpdate() {}
  onUpdated() {}
  beforeUnmount() {}
  onUnmounted() {}
  getContext() {
    return this.appContext;
  }
  get router() {
    return this.getRouterFrom(this.appContext) ?? this.getRouterFromGlobalApp();
  }
  emit(eventName, ...args) {
    this.eventListeners[eventName]?.forEach((listener) => {
      listener(...args);
    });
  }
  on(eventName, listener) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = new Set;
    }
    this.eventListeners[eventName].add(listener);
    return () => this.off(eventName, listener);
  }
  off(eventName, listener) {
    this.eventListeners[eventName]?.delete(listener);
  }
  createRenderContext() {
    return {
      appContext: this.appContext,
      templateEngine: this.templateEngine,
      renderer: this.renderer,
      slots: this.collectSlots(),
      registerChild: (component) => {
        this.childComponents.add(component);
        component.setParentComponent?.(this);
        component.setAppContext?.(this.appContext);
      },
      unregisterChild: (component) => {
        this.childComponents.delete(component);
        component.setParentComponent?.(null);
      }
    };
  }
  collectSlots() {
    const slots = { default: [] };
    const children = this.props.children ?? [];
    children.forEach((child) => {
      const slotName = this.getSlotName(child);
      if (!slots[slotName]) {
        slots[slotName] = [];
      }
      slots[slotName].push(this.normalizeSlotChild(child));
    });
    return slots;
  }
  getSlotName(child) {
    if (typeof child === "string") {
      return "default";
    }
    return "slot" in child && typeof child.slot === "string" ? child.slot : "default";
  }
  normalizeSlotChild(child) {
    if (typeof child === "string" || !("slot" in child)) {
      return child;
    }
    const clone = { ...child };
    delete clone.slot;
    return clone;
  }
  trackStateProperties() {
    this.trackReactiveValue(this.state, new Set);
  }
  getRouterFrom(value) {
    if (!value || typeof value !== "object" || !("router" in value)) {
      return;
    }
    return value.router;
  }
  getRouterFromGlobalApp() {
    const globalApp = globalThis.__APP__;
    return this.getRouterFrom(globalApp);
  }
  resolveAppInjection(key) {
    if (!this.appContext || typeof this.appContext !== "object") {
      return { found: false, value: undefined };
    }
    const app = this.appContext.app;
    return app?.resolveInjection?.(key) ?? { found: false, value: undefined };
  }
  trackReactiveValue(value, seen) {
    if (!value || typeof value !== "object" || seen.has(value)) {
      return;
    }
    seen.add(value);
    if (Array.isArray(value)) {
      value.length;
    }
    Object.keys(value).forEach((key) => {
      const child = value[key];
      this.trackReactiveValue(child, seen);
    });
  }
}
// lib/router/instance.ts
var router = null;
function setRouter(r) {
  if (!r || !(r instanceof Router)) {
    throw new Error("Invalid router instance");
  }
  router = r;
}
function useRouter() {
  if (!router) {
    throw new Error("Router is not initialized. Please make sure you have installed the router plugin.");
  }
  return router;
}

// lib/router/matcher.ts
function normalizePath(path) {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path || "/";
}
function matchRoute(routes, path) {
  const normalizedPath = normalizePath(path.split("?")[0]);
  for (const route of routes) {
    const params = matchRoutePath(route.path, normalizedPath);
    if (params) {
      return { route, params };
    }
  }
  const fallback = routes.find((route) => route.path === "/");
  return fallback ? { route: fallback, params: {} } : null;
}
function matchRoutePath(routePath, currentPath) {
  const routeSegments = getPathSegments(routePath);
  const currentSegments = getPathSegments(currentPath);
  if (routeSegments.length !== currentSegments.length) {
    return null;
  }
  const params = {};
  for (let index = 0;index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const currentSegment = currentSegments[index];
    if (routeSegment.startsWith(":")) {
      const paramName = routeSegment.slice(1);
      if (!paramName) {
        return null;
      }
      params[decodeURIComponent(paramName)] = decodeURIComponent(currentSegment);
      continue;
    }
    if (routeSegment !== currentSegment) {
      return null;
    }
  }
  return params;
}
function getPathSegments(path) {
  const normalizedPath = normalizePath(path);
  if (normalizedPath === "/") {
    return [];
  }
  return normalizedPath.split("/").filter(Boolean);
}

// lib/router/history.ts
function createRouterHref(path, mode, base) {
  const normalizedPath = normalizePath(path);
  const fullPath = base === "/" ? normalizedPath : base + normalizedPath;
  return mode === "hash" ? `#${fullPath}` : fullPath;
}
function getBrowserLocation(mode, base) {
  let path;
  let fullPath;
  let queryString;
  if (mode === "history") {
    fullPath = window.location.pathname + window.location.search;
    path = window.location.pathname;
    queryString = window.location.search;
  } else {
    const hash = window.location.hash;
    fullPath = hash || "#/";
    path = fullPath.startsWith("#") ? fullPath.slice(1) : fullPath;
    const queryStart = path.indexOf("?");
    queryString = queryStart >= 0 ? path.slice(queryStart + 1) : "";
    path = queryStart >= 0 ? path.slice(0, queryStart) : path;
  }
  if (path.startsWith(base) && base !== "/" && path !== "/") {
    path = path.slice(base.length);
  }
  path = normalizePath(path);
  return {
    path,
    fullPath,
    query: parseQuery(queryString),
    params: {}
  };
}
function navigateBrowser(path, replace, mode, base) {
  const normalizedPath = normalizePath(path);
  const fullPath = base === "/" ? normalizedPath : base + normalizedPath;
  if (mode === "history") {
    if (replace) {
      window.history.replaceState({}, "", fullPath);
    } else {
      window.history.pushState({}, "", fullPath);
    }
    return;
  }
  if (replace) {
    const href = window.location.href.split("#")[0];
    window.location.replace(`${href}#${fullPath}`);
    return;
  }
  window.location.hash = fullPath;
}
function parseQuery(queryString) {
  const query = {};
  const normalizedQuery = queryString.startsWith("?") ? queryString.slice(1) : queryString;
  if (!normalizedQuery) {
    return query;
  }
  normalizedQuery.split("&").forEach((param) => {
    const [key, value] = param.split("=");
    if (key) {
      query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
    }
  });
  return query;
}

// lib/router/index.ts
class Router {
  currentRoute = null;
  currentLocation = null;
  routes = [];
  app = null;
  mode;
  base;
  routeChangeListeners = [];
  removeWindowListener;
  constructor(options) {
    const resolvedOptions = Array.isArray(options) ? { routes: options } : options;
    this.routes = resolvedOptions.routes || [];
    this.mode = resolvedOptions.mode || "history";
    this.base = resolvedOptions.base || "/";
    this.validateRoutes();
    this.initEvents();
    this.resolveCurrentRoute();
  }
  install(app) {
    this.app = app;
    app.router = this;
    setRouter(this);
    const context = app.getContext();
    context.router = this;
    this.resolveCurrentRoute();
  }
  push(path) {
    this.navigate(path, false);
  }
  replace(path) {
    this.navigate(path, true);
  }
  forward() {
    window.history.forward();
  }
  back() {
    window.history.back();
  }
  go(delta) {
    window.history.go(delta);
  }
  getCurrentRoute() {
    if (!this.currentLocation) {
      this.resolveCurrentRoute();
    }
    return this.currentLocation;
  }
  getCurrentRouteRecord() {
    if (!this.currentRoute) {
      this.resolveCurrentRoute();
    }
    return this.currentRoute;
  }
  onRouteChange(listener) {
    this.routeChangeListeners.push(listener);
    return () => {
      const index = this.routeChangeListeners.indexOf(listener);
      if (index > -1) {
        this.routeChangeListeners.splice(index, 1);
      }
    };
  }
  getRoutes() {
    return [...this.routes];
  }
  addRoute(route) {
    if (this.routes.some((item) => item.path === route.path)) {
      throw new Error(`Route already exists: ${route.path}`);
    }
    this.routes.push(route);
    const location = this.getCurrentLocation();
    if (location.path === route.path) {
      this.handleRouteChange();
    }
  }
  createHref(path) {
    return createRouterHref(path, this.mode, this.base);
  }
  destroy() {
    this.removeWindowListener?.();
    this.removeWindowListener = undefined;
    if (this.app?.router === this) {
      this.app.router = undefined;
    }
    this.app = null;
  }
  navigate(path, replace) {
    if (!path || typeof path !== "string") {
      throw new Error("Path must be a non-empty string");
    }
    navigateBrowser(path, replace, this.mode, this.base);
    this.handleRouteChange();
  }
  validateRoutes() {
    if (!Array.isArray(this.routes)) {
      throw new Error("Router routes must be an array");
    }
    const paths = new Set;
    this.routes.forEach((route) => {
      if (paths.has(route.path)) {
        throw new Error(`Duplicate route path: ${route.path}`);
      }
      paths.add(route.path);
    });
  }
  initEvents() {
    if (typeof window === "undefined") {
      return;
    }
    const eventName = this.mode === "history" ? "popstate" : "hashchange";
    const listener = () => {
      this.handleRouteChange();
    };
    window.addEventListener(eventName, listener);
    this.removeWindowListener = () => {
      window.removeEventListener(eventName, listener);
    };
  }
  handleRouteChange() {
    const fromLocation = this.currentLocation;
    const nextLocation = this.resolveCurrentRoute();
    if (!this.isSameLocation(fromLocation, nextLocation)) {
      this.triggerRouteChangeListeners(nextLocation, fromLocation);
    }
  }
  resolveCurrentRoute() {
    const location = this.getCurrentLocation();
    const match = matchRoute(this.routes, location.path);
    const route = match?.route ?? null;
    this.currentRoute = route;
    this.currentLocation = {
      ...location,
      params: match?.params ?? {},
      name: route?.name,
      meta: route?.meta
    };
    return this.currentLocation;
  }
  getCurrentLocation() {
    return getBrowserLocation(this.mode, this.base);
  }
  isSameLocation(from, to) {
    return from?.fullPath === to?.fullPath && from?.name === to?.name;
  }
  triggerRouteChangeListeners(to, from) {
    this.routeChangeListeners.forEach((listener) => {
      try {
        listener(to, from);
      } catch (error) {
        console.error("Route change listener error:", error);
      }
    });
  }
}

class RouterLink extends Component {
  unsubscribe;
  initState() {
    const router2 = this.router;
    return {
      currentPath: router2?.getCurrentRoute()?.path ?? window.location.pathname
    };
  }
  initStyles() {}
  onMounted() {
    const router2 = this.router;
    this.unsubscribe = router2?.onRouteChange((to) => {
      this.state.currentPath = to.path;
    });
  }
  onUnmounted() {
    this.unsubscribe?.();
  }
  render() {
    const router2 = this.router;
    const activeClass = this.props.activeClass ?? "active";
    const isActive = this.state.currentPath === this.props.to;
    const className = [this.props.className, isActive ? activeClass : undefined].filter(Boolean).join(" ");
    return {
      tag: "a",
      props: {
        href: router2?.createHref(this.props.to) ?? this.props.to,
        className
      },
      listeners: {
        click: (event) => {
          event.preventDefault();
          if (this.props.replace) {
            router2?.replace(this.props.to);
          } else {
            router2?.push(this.props.to);
          }
        }
      },
      children: this.props.children && this.props.children.length > 0 ? this.props.children : [this.props.to]
    };
  }
}

class RouterView extends Component {
  unsubscribe;
  initState() {
    const router2 = this.router;
    return {
      route: router2?.getCurrentRoute() ?? null,
      record: router2?.getCurrentRouteRecord() ?? null
    };
  }
  initStyles() {}
  onMounted() {
    const router2 = this.router;
    this.unsubscribe = router2?.onRouteChange((to) => {
      this.state.route = to;
      this.state.record = router2.getCurrentRouteRecord();
    });
  }
  onUnmounted() {
    this.unsubscribe?.();
  }
  render() {
    const routeRecord = this.state.record ?? this.router?.getCurrentRouteRecord();
    return {
      tag: "div",
      props: { "data-router-view": "" },
      children: routeRecord ? [{ component: routeRecord.component }] : []
    };
  }
}
function createRouter(options) {
  return new Router(options);
}

export { isComponentNode, isHTMLNode, isSlotProvider, h, Tag, Div, Span, P, Button, Input, Section, Main, Header, Footer, Nav, Article, Aside, H1, H2, H3, H4, H5, H6, Strong, Em, Small, Pre, Code, Blockquote, Ul, Ol, Li, A, Img, Form, Label, Textarea, Select, Option, Table, Thead, Tbody, Tr, Th, Td, createComponent, slot, each, ReactiveSystem, reactive, readonly, effect, computed, ref, isRef, unref, stop, isReactive, isReadonly, modelPath, getModelValue, setModelValue, ModelBindingController, ElementRenderStrategy, normalizeTransitionGroupProps, validateTransitionGroupChildren, RendererContext, TextRenderStrategy, ComponentRenderStrategy, SlotRenderStrategy, TemplateEngine, Component, useRouter, Router, RouterLink, RouterView, createRouter };

//# debugId=91AF0EEFB67A584364756E2164756E21
//# sourceMappingURL=index-wv9gyjqt.js.map
