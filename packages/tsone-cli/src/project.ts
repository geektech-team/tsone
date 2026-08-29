import { pathToFileURL } from 'node:url';
import { Window } from 'happy-dom';
import type { AppDocumentRenderOptions, OneApp } from '@geektech/tsone';
import type { ResolvedConfig } from './types';

const DOM_GLOBAL_KEYS = [
  'window',
  'document',
  'Node',
  'Text',
  'Comment',
  'Element',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'HTMLSelectElement',
  'HTMLButtonElement',
  'DocumentFragment',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'CustomEvent',
  'EventTarget',
  'history',
  'location',
  'navigator',
  'localStorage',
] as const;

type DomGlobalKey = (typeof DOM_GLOBAL_KEYS)[number];
type GlobalDescriptorMap = Map<DomGlobalKey, PropertyDescriptor | undefined>;

interface ProjectEntryModule {
  app?: unknown;
}

let projectDomQueue: Promise<void> = Promise.resolve();

export async function renderProjectHtml(
  config: ResolvedConfig,
  options: AppDocumentRenderOptions
): Promise<string> {
  return withProjectDom(async () => {
    const module = await importProjectEntry(config.entry);
    const app = module.app as Partial<OneApp> | undefined;
    if (!app || typeof app.renderHtmlDocument !== 'function') {
      throw new Error(
        `TSone entry ${config.entry} must export an app with renderHtmlDocument()`
      );
    }

    return app.renderHtmlDocument(options);
  });
}

async function withProjectDom<T>(callback: () => Promise<T>): Promise<T> {
  const task = projectDomQueue.then(() => runWithProjectDom(callback));
  projectDomQueue = task.then(
    () => undefined,
    () => undefined
  );

  return task;
}

async function runWithProjectDom<T>(callback: () => Promise<T>): Promise<T> {
  const descriptors = captureGlobalDescriptors();
  const window = new Window({ url: 'http://127.0.0.1/' });

  try {
    installProjectDom(window);
    return await callback();
  } finally {
    try {
      restoreGlobalDescriptors(descriptors);
    } finally {
      window.close();
    }
  }
}

async function importProjectEntry(entry: string): Promise<ProjectEntryModule> {
  const entryUrl = pathToFileURL(entry);
  return (await import(
    `${entryUrl.href}?tsone_entry=${Date.now()}`
  )) as ProjectEntryModule;
}

function captureGlobalDescriptors(): GlobalDescriptorMap {
  return new Map(
    DOM_GLOBAL_KEYS.map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ])
  );
}

function installProjectDom(window: Window): void {
  Object.assign(window, {
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
  });
  const windowRecord = window as unknown as Record<DomGlobalKey, unknown>;

  DOM_GLOBAL_KEYS.forEach((key) => {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: windowRecord[key],
    });
  });
}

function restoreGlobalDescriptors(descriptors: GlobalDescriptorMap): void {
  DOM_GLOBAL_KEYS.forEach((key) => {
    const descriptor = descriptors.get(key);
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
      return;
    }

    delete (globalThis as Record<string, unknown>)[key];
  });
}
