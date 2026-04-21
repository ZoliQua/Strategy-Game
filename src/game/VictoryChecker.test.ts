import { describe, expect, it } from 'vitest';
import { createBuilding } from '../ecs/archetypes/building';
import { createEcsWorld } from '../ecs/world';
import { MapData } from '../map/MapData';
import { TERRAIN } from '../map/TerrainTypes';
import { createPlayer } from './Player';
import { PlayerManager } from './PlayerManager';
import { VictoryChecker } from './VictoryChecker';

function setup() {
  const map = new MapData(20, 20, TERRAIN.grass);
  const world = createEcsWorld();
  const players = new PlayerManager([
    createPlayer({ id: 1, isHuman: true }),
    createPlayer({ id: 2 }),
  ]);
  createBuilding(world, {
    type: 'town_center',
    origin: { tx: 3, ty: 3 },
    playerId: 1,
    mapData: map,
  });
  createBuilding(world, {
    type: 'town_center',
    origin: { tx: 15, ty: 15 },
    playerId: 2,
    mapData: map,
  });
  return { map, world, players, vc: new VictoryChecker(world, players) };
}

describe('VictoryChecker', () => {
  it('reports playing while both sides have TCs', () => {
    const { vc } = setup();
    expect(vc.check().kind).toBe('playing');
  });

  it('marks a player defeated when their TC dies', () => {
    const { vc, world, players } = setup();
    const aiTc = world.entities.find(
      (e) => e.building?.type === 'town_center' && e.owner?.playerId === 2,
    )!;
    world.addComponent(aiTc, 'dying', { ttlMs: 0 });
    const result = vc.check();
    expect(result.kind).toBe('victory');
    expect(players.get(2)?.defeated).toBe(true);
  });

  it('human loss reports defeat', () => {
    const { vc, world } = setup();
    const humanTc = world.entities.find(
      (e) => e.building?.type === 'town_center' && e.owner?.playerId === 1,
    )!;
    world.addComponent(humanTc, 'dying', { ttlMs: 0 });
    const result = vc.check();
    expect(result.kind).toBe('defeat');
  });
});
