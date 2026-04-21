import { describe, expect, it } from 'vitest';
import { FogOfWarData } from '../../map/FogOfWarData';
import { createVillager } from '../archetypes/villager';
import { createEcsWorld } from '../world';
import { FogOfWarSystem } from './FogOfWarSystem';

describe('FogOfWarSystem', () => {
  it('marks a disc of tiles visible around a villager', () => {
    const world = createEcsWorld();
    const fog = new FogOfWarData(30, 30);
    createVillager(world, { tile: { tx: 10, ty: 10 }, playerId: 1 });
    const system = new FogOfWarSystem(world, fog, 1);

    system.update(300);

    expect(fog.isVisible(10, 10)).toBe(true);
    expect(fog.isVisible(12, 10)).toBe(true);
    expect(fog.isVisible(10, 14)).toBe(true);
    // Outside the ~5-tile sight radius.
    expect(fog.isVisible(18, 10)).toBe(false);
  });

  it('demotes visible → explored when the unit moves away', () => {
    const world = createEcsWorld();
    const fog = new FogOfWarData(30, 30);
    const v = createVillager(world, { tile: { tx: 10, ty: 10 }, playerId: 1 });
    const system = new FogOfWarSystem(world, fog, 1);

    system.update(300);
    expect(fog.isVisible(10, 10)).toBe(true);

    v.position = { tx: 25, ty: 25 };
    system.update(300);
    expect(fog.isVisible(10, 10)).toBe(false);
    // But tile state is now `explored` (1), not `unexplored` (0).
    expect(fog.get(10, 10)).toBe(1);
  });

  it('ignores emitters from other players', () => {
    const world = createEcsWorld();
    const fog = new FogOfWarData(30, 30);
    createVillager(world, { tile: { tx: 10, ty: 10 }, playerId: 2 });
    const system = new FogOfWarSystem(world, fog, 1);

    system.update(300);
    expect(fog.isVisible(10, 10)).toBe(false);
  });
});
