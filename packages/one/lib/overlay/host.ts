import { OneOverlayEnvironmentError } from './errors';
import { resolveOneOverlayContainer } from './container';
import type {
  OneManagedOverlay,
  OneOverlayHandle,
  OneOverlayHost,
  OneOverlayKind,
  OneOverlayOpenRequest,
} from './types';

interface HostEntry {
  element: HTMLElement;
  groups: Map<string, HTMLElement>;
}

interface OverlayRecord {
  id: string;
  kind: OneOverlayKind;
  container: HTMLElement;
  groupKey?: string;
  slot: HTMLElement;
  managed?: OneManagedOverlay<object>;
  closed: boolean;
}

export class DomOneOverlayHost implements OneOverlayHost {
  private readonly entries = new Map<HTMLElement, HostEntry>();
  private readonly records = new Map<string, OverlayRecord>();
  private sequence = 0;

  public constructor(private readonly targetDocument: Document) {}

  public open<TOptions extends object>(
    request: OneOverlayOpenRequest<TOptions>
  ): OneOverlayHandle<TOptions> {
    const container = resolveOneOverlayContainer(
      request.container,
      this.targetDocument
    );
    const entry = this.getOrCreateEntry(container);
    const groupKey = request.group
      ? `${request.kind}:${request.group}`
      : undefined;
    const parent = groupKey
      ? this.getOrCreateGroup(entry, groupKey, request.kind, request.group!)
      : entry.element;
    const id = `one-${request.kind}-${++this.sequence}`;
    const slot = this.targetDocument.createElement('div');
    slot.dataset.oneOverlayId = id;
    slot.dataset.oneOverlayKind = request.kind;
    parent.appendChild(slot);

    const record: OverlayRecord = {
      id,
      kind: request.kind,
      container,
      groupKey,
      slot,
      closed: false,
    };
    this.records.set(id, record);

    try {
      record.managed = request.factory({
        id,
        slot,
        requestClose: () => this.close(id),
        isTop: () => this.isTop(id),
      }) as OneManagedOverlay<object>;
    } catch (error) {
      this.removeRecord(record, false);
      throw error;
    }

    return {
      id,
      update: (options) => {
        const current = this.records.get(id);
        if (!current || current.closed) {
          return;
        }
        current.managed?.update(options);
      },
      close: () => this.close(id),
    };
  }

  public close(id: string): void {
    const record = this.records.get(id);
    if (!record || record.closed) {
      return;
    }
    this.removeRecord(record, true);
  }

  public closeAll(kind?: OneOverlayKind): void {
    [...this.records.values()].forEach((record) => {
      if (!kind || record.kind === kind) {
        this.close(record.id);
      }
    });
  }

  public isTop(id: string): boolean {
    const record = this.records.get(id);
    if (!record || record.closed) {
      return false;
    }
    const matching = [...this.records.values()].filter(
      (candidate) =>
        !candidate.closed &&
        candidate.kind === record.kind &&
        candidate.container === record.container
    );
    return matching[matching.length - 1]?.id === id;
  }

  private getOrCreateEntry(container: HTMLElement): HostEntry {
    const existing = this.entries.get(container);
    if (existing) {
      return existing;
    }
    const element = this.targetDocument.createElement('div');
    element.dataset.oneOverlayHost = '';
    container.appendChild(element);
    const entry = { element, groups: new Map<string, HTMLElement>() };
    this.entries.set(container, entry);
    return entry;
  }

  private getOrCreateGroup(
    entry: HostEntry,
    key: string,
    kind: OneOverlayKind,
    group: string
  ): HTMLElement {
    const existing = entry.groups.get(key);
    if (existing) {
      return existing;
    }
    const element = this.targetDocument.createElement('div');
    element.dataset.oneOverlayGroup = group;
    element.dataset.oneOverlayKind = kind;
    entry.element.appendChild(element);
    entry.groups.set(key, element);
    return element;
  }

  private removeRecord(record: OverlayRecord, destroy: boolean): void {
    record.closed = true;
    this.records.delete(record.id);
    if (destroy) {
      record.managed?.destroy();
    }
    record.slot.remove();

    const entry = this.entries.get(record.container);
    if (!entry) {
      return;
    }
    if (record.groupKey) {
      const group = entry.groups.get(record.groupKey);
      if (group && group.childElementCount === 0) {
        group.remove();
        entry.groups.delete(record.groupKey);
      }
    }
    if (entry.element.childElementCount === 0) {
      entry.element.remove();
      this.entries.delete(record.container);
    }
  }
}

const defaultHosts = new WeakMap<Document, OneOverlayHost>();

export function getDefaultOneOverlayHost(
  targetDocument?: Document
): OneOverlayHost {
  const resolved =
    targetDocument ?? (typeof document === 'undefined' ? null : document);
  if (!resolved) {
    throw new OneOverlayEnvironmentError();
  }
  const existing = defaultHosts.get(resolved);
  if (existing) {
    return existing;
  }
  const host = new DomOneOverlayHost(resolved);
  defaultHosts.set(resolved, host);
  return host;
}
