import { describe, expect, it } from 'vitest';
import { createEcsWorld } from '../world';
import { createResourceNode } from './resource';

describe('createResourceNode', () => {
  it('creates a wood node with default amount', () => {
    const world = createEcsWorld();
    const e = createResourceNode(world, {
      tile: { tx: 3, ty: 4 },
      type: 'wood',
    });
    expect(e.position).toEqual({ tx: 3, ty: 4 });
    expect(e.resourceNode?.type).toBe('wood');
    expect(e.resourceNode?.amount).toBe(100);
    expect(e.resourceNode?.maxAmount).toBe(100);
  });

  it('honors a custom amount', () => {
    const world = createEcsWorld();
    const e = createResourceNode(world, {
      tile: { tx: 0, ty: 0 },
      type: 'gold',
      amount: 42,
    });
    expect(e.resourceNode?.amount).toBe(42);
    expect(e.resourceNode?.maxAmount).toBe(42);
  });

  it('gold and food nodes have expected defaults', () => {
    const world = createEcsWorld();
    const gold = createResourceNode(world, {
      tile: { tx: 1, ty: 1 },
      type: 'gold',
    });
    const food = createResourceNode(world, {
      tile: { tx: 2, ty: 2 },
      type: 'food',
    });
    expect(gold.resourceNode?.amount).toBe(200);
    expect(food.resourceNode?.amount).toBe(80);
  });
});
