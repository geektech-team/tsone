import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { ONE_NAME, ONE_VERSION } from '../lib';
import {
  normalizeOneSize,
  oneStylesToSheet,
} from '../lib/styles/shared';

const packageRoot = join(import.meta.dir, '..');

describe('One UI package contract', () => {
  it('uses the approved package identity and peer range', () => {
    const manifest = JSON.parse(
      readFileSync(join(packageRoot, 'package.json'), 'utf8')
    ) as {
      name: string;
      version: string;
      peerDependencies: Record<string, string>;
      dependencies?: Record<string, string>;
    };

    expect(manifest.name).toBe('@geektech/one');
    expect(manifest.version).toBe('0.0.1');
    expect(manifest.peerDependencies['@geektech/tsone']).toBe(
      '>=0.0.2 <0.1.0'
    );
    expect(manifest.dependencies ?? {}).toEqual({});
    expect(ONE_NAME).toBe(manifest.name);
    expect(ONE_VERSION).toBe(manifest.version);
  });

  it('normalizes component sizes to md at runtime', () => {
    expect(normalizeOneSize('sm')).toBe('sm');
    expect(normalizeOneSize('lg')).toBe('lg');
    expect(normalizeOneSize('unexpected')).toBe('md');
  });

  it('converts component styles for static document rendering', () => {
    expect(
      oneStylesToSheet([
        {
          name: 'sample',
          selector: '.one-sample',
          properties: { color: 'red' },
          hover: { color: 'blue' },
        },
      ])
    ).toEqual([
      { selector: '.one-sample', properties: { color: 'red' } },
      { selector: '.one-sample:hover', properties: { color: 'blue' } },
    ]);
  });
});
