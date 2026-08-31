import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  DomOneOverlayHost,
  OneOverlayContainerError,
  OneOverlayEnvironmentError,
  OneOverlayMountController,
  resolveOneOverlayContainer,
} from '../lib/overlay';

describe('One overlay infrastructure', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves body and a connected custom container', () => {
    const custom = document.createElement('section');
    custom.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 320,
      bottom: 240,
      width: 320,
      height: 240,
      toJSON: () => ({}),
    });
    document.body.appendChild(custom);

    expect(resolveOneOverlayContainer(undefined, document)).toBe(document.body);
    expect(resolveOneOverlayContainer(() => custom, document)).toBe(custom);
  });

  it('rejects missing, detached and foreign containers with stable errors', () => {
    const detached = document.createElement('div');
    const foreign = document.implementation.createHTMLDocument('foreign');

    expect(() => resolveOneOverlayContainer(() => null, document)).toThrow(
      OneOverlayContainerError
    );
    expect(() => resolveOneOverlayContainer(detached, document)).toThrow(
      'One overlay container must be connected'
    );
    expect(() => resolveOneOverlayContainer(foreign.body, document)).toThrow(
      'One overlay container must belong to the current document'
    );
    expect(() => resolveOneOverlayContainer(undefined, null)).toThrow(
      OneOverlayEnvironmentError
    );
  });

  it('creates one host per container and removes it after the last record closes', () => {
    const host = new DomOneOverlayHost(document);
    const first = host.open({
      kind: 'message',
      group: 'top',
      factory: ({ slot }) => {
        slot.textContent = 'Saved';
        return { update: () => {}, destroy: () => {} };
      },
    });
    const second = host.open({
      kind: 'message',
      group: 'top',
      factory: ({ slot }) => {
        slot.textContent = 'Updated';
        return { update: () => {}, destroy: () => {} };
      },
    });

    expect(document.querySelectorAll('[data-one-overlay-host]')).toHaveLength(
      1
    );
    expect(
      document.querySelectorAll('[data-one-overlay-group="top"]')
    ).toHaveLength(1);
    expect(document.body.textContent).toContain('Saved');
    first.close();
    first.close();
    expect(document.querySelector('[data-one-overlay-host]')).toBeTruthy();
    second.close();
    expect(document.querySelector('[data-one-overlay-host]')).toBeNull();
  });

  it('lets a mount controller own one private view without moving its anchor', () => {
    const anchor = document.createElement('span');
    document.body.appendChild(anchor);
    const host = new DomOneOverlayHost(document);
    const controller = new OneOverlayMountController<object>(
      host,
      'dialog',
      ({ slot }) => {
        slot.textContent = 'Dialog body';
        return { update: () => {}, destroy: () => {} };
      }
    );

    controller.open();

    expect(anchor.parentElement).toBe(document.body);
    expect(
      document.querySelector('[data-one-overlay-kind="dialog"]')
    ).toBeTruthy();
    controller.close();
    expect(
      document.querySelector('[data-one-overlay-kind="dialog"]')
    ).toBeNull();
  });
});
