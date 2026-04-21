import type { TileCoord } from '../../iso/coordinates';
import type { Entity } from '../components';
import { type EcsWorld } from '../world';
import { createUnit } from './createUnit';

export interface CreateVillagerOptions {
  readonly tile: TileCoord;
  readonly playerId?: number;
}

export function createVillager(
  world: EcsWorld,
  options: CreateVillagerOptions,
): Entity {
  return createUnit(world, {
    type: 'villager',
    tile: options.tile,
    playerId: options.playerId ?? 1,
  });
}
