import { describe, expect, it } from 'bun:test';
import {
  OneButton,
  OneCard,
  OneInput,
  type OneButtonProps,
  type OneCardProps,
  type OneInputProps,
} from '../lib';

const buttonProps: OneButtonProps = { variant: 'danger', size: 'lg' };
const inputProps: OneInputProps = { value: 'one', invalid: true };
const cardProps: OneCardProps = { title: 'One', children: ['Body'] };

// @ts-expect-error unsupported variant
const invalidButton: OneButtonProps = { variant: 'ghost' };
// @ts-expect-error unsupported size
const invalidInput: OneInputProps = { size: 'xl' };

describe('public component types', () => {
  it('exports constructors and approved prop shapes', () => {
    expect(typeof OneButton).toBe('function');
    expect(typeof OneInput).toBe('function');
    expect(typeof OneCard).toBe('function');
    expect(buttonProps.variant).toBe('danger');
    expect(inputProps.value).toBe('one');
    expect(cardProps.title).toBe('One');
    void invalidButton;
    void invalidInput;
  });
});
