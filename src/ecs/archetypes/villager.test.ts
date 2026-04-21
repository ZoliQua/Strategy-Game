import { describe, expect, it } from 'vitest';
import { createEcsWorld } from '../world';
import { createVillager } from './villager';

describe('createVillager', () => {
  it('adds an entity with position, renderable, unit and selectable', () => {
    const world = createEcsWorld();
    const entity = createVillager(world, { tile: { tx: 10, ty: 10 } });

    expect(entity.position).toEqual({ tx: 10, ty: 10 });
    expect(entity.renderable?.textureKey).toBe('villager_placeholder');
    expect(entity.unit?.unitType).toBe('villager');
    expect(entity.selectable?.selected).toBe(false);
    expect(entity.id).toBeGreaterThan(0);
  });

  it('separate entities get distinct ids', () => {
    const world = createEcsWorld();
    const a = createVillager(world, { tile: { tx: 0, ty: 0 } });
    const b = createVillager(world, { tile: { tx: 1, ty: 1 } });
    expect(a.id).not.toBe(b.id);
  });

  it('each call adds the entity to the world', () => {
    const world = createEcsWorld();
    createVillager(world, { tile: { tx: 0, ty: 0 } });
    createVillager(world, { tile: { tx: 1, ty: 1 } });
    const all = world.with('position', 'unit');
    expect(all.entities.length).toBe(2);
  });
});
