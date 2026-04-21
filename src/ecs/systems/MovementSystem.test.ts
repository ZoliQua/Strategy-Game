import { describe, expect, it } from 'vitest';
import { createEcsWorld } from '../world';
import { assignEntityId } from '../world';
import { MovementSystem } from './MovementSystem';

function makeMover() {
  const world = createEcsWorld();
  const entity = assignEntityId({
    position: { tx: 0, ty: 0 },
    movable: {
      speed: 2,
      path: [
        { tx: 1, ty: 0 },
        { tx: 2, ty: 0 },
        { tx: 2, ty: 1 },
      ],
      progress: 0,
      facing: 'S' as const,
    },
  });
  world.add(entity);
  return { world, entity };
}

describe('MovementSystem', () => {
  it('advances progress without changing tile mid-step', () => {
    const { world, entity } = makeMover();
    const system = new MovementSystem(world);
    system.update(200); // 0.2s * 2 tiles/s = 0.4 progress
    expect(entity.position).toEqual({ tx: 0, ty: 0 });
    expect(entity.movable!.progress).toBeCloseTo(0.4, 5);
    expect(entity.movable!.path.length).toBe(3);
  });

  it('snaps to next tile when progress crosses 1', () => {
    const { world, entity } = makeMover();
    const system = new MovementSystem(world);
    system.update(600); // 1.2 progress → cross one tile, 0.2 remaining
    expect(entity.position).toEqual({ tx: 1, ty: 0 });
    expect(entity.movable!.path.length).toBe(2);
    expect(entity.movable!.progress).toBeCloseTo(0.2, 5);
  });

  it('can cross multiple tiles in one large delta', () => {
    const { world, entity } = makeMover();
    const system = new MovementSystem(world);
    system.update(1500); // 3.0 progress → consumes all 3 steps
    expect(entity.position).toEqual({ tx: 2, ty: 1 });
    expect(entity.movable!.path.length).toBe(0);
    expect(entity.movable!.progress).toBe(0);
  });

  it('updates facing based on next-tile delta', () => {
    const { world, entity } = makeMover();
    const system = new MovementSystem(world);
    system.update(100);
    expect(entity.movable!.facing).toBe('E');
    system.update(600);
    // After moving to (1,0) the next step is (2,0) → still E.
    expect(entity.movable!.facing).toBe('E');
    system.update(600);
    // After moving to (2,0) the next step is (2,1) → S.
    expect(entity.movable!.facing).toBe('S');
  });

  it('no-ops when the path is empty', () => {
    const world = createEcsWorld();
    const entity = assignEntityId({
      position: { tx: 5, ty: 5 },
      movable: { speed: 2, path: [], progress: 0, facing: 'S' as const },
    });
    world.add(entity);
    const system = new MovementSystem(world);
    system.update(500);
    expect(entity.position).toEqual({ tx: 5, ty: 5 });
    expect(entity.movable!.progress).toBe(0);
  });
});
