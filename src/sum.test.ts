import { describe, expect, it } from 'vitest';

function sum(a: number, b: number): number {
  return a + b;
}

describe('sum', () => {
  it('adds two positive numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });

  it('handles negatives', () => {
    expect(sum(-1, 1)).toBe(0);
  });
});
