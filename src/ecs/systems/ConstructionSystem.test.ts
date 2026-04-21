import { describe, expect, it } from 'vitest';
import { MapData } from '../../map/MapData';
import { TERRAIN } from '../../map/TerrainTypes';
import { createBuilding } from '../archetypes/building';
import { createVillager } from '../archetypes/villager';
import { createEcsWorld } from '../world';
import { ConstructionSystem } from './ConstructionSystem';

function setup() {
  const map = new MapData(10, 10, TERRAIN.grass);
  const world = createEcsWorld();
  const site = createBuilding(world, {
    type: 'house',
    origin: { tx: 3, ty: 3 },
    playerId: 1,
    mapData: map,
    underConstruction: true,
  });
  const v = createVillager(world, { tile: { tx: 2, ty: 3 } });
  world.addComponent(v, 'buildCommand', { targetId: site.id! });
  const system = new ConstructionSystem(world, map);
  return { map, world, site, villager: v, system };
}

describe('ConstructionSystem', () => {
  it('advances construction when a villager is adjacent', () => {
    const { system, site, villager } = setup();
    const startElapsed = site.underConstruction!.elapsed;
    system.update(2000); // +2s builder time
    expect(site.underConstruction!.elapsed).toBeCloseTo(startElapsed + 2, 3);
    expect(villager.buildCommand).toBeDefined();
  });

  it('HP scales with progress', () => {
    const { system, site } = setup();
    system.update(site.underConstruction!.totalTime * 500); // 50% time
    expect(site.health!.current).toBeGreaterThan(0);
    expect(site.health!.current).toBeLessThan(site.health!.max);
  });

  it('completes and drops tags at 100%', () => {
    const { system, site, villager, world } = setup();
    system.update(site.underConstruction!.totalTime * 1000 + 100);
    const resolved = world.entities.find((e) => e.id === site.id)!;
    expect(resolved.underConstruction).toBeUndefined();
    expect(resolved.health!.current).toBe(resolved.health!.max);
    // buildCommand dropped from villager.
    const v = world.entities.find((e) => e.id === villager.id)!;
    expect(v.buildCommand).toBeUndefined();
  });

  it('three builders finish in roughly one-third the time', () => {
    const { system, site, map, world } = setup();
    // Add two more villagers on other adjacent tiles.
    const v2 = createVillager(world, { tile: { tx: 4, ty: 2 } });
    const v3 = createVillager(world, { tile: { tx: 5, ty: 3 } });
    world.addComponent(v2, 'buildCommand', { targetId: site.id! });
    world.addComponent(v3, 'buildCommand', { targetId: site.id! });
    const totalSec = site.underConstruction!.totalTime;
    // ~1/3 of total time with 3 builders should finish.
    const step = 200;
    const neededTicks = Math.ceil(((totalSec / 3) * 1000) / step) + 2;
    for (let i = 0; i < neededTicks; i++) system.update(step);
    const resolved = world.entities.find((e) => e.id === site.id)!;
    expect(resolved.underConstruction).toBeUndefined();
    void map; // silence unused
  });
});
