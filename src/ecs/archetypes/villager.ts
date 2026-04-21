import type { TileCoord } from '../../iso/coordinates';
import type { Entity } from '../components';
import { assignEntityId, type EcsWorld } from '../world';

export interface CreateVillagerOptions {
  readonly tile: TileCoord;
  readonly playerId?: number;
}

export function createVillager(
  world: EcsWorld,
  options: CreateVillagerOptions,
): Entity {
  const entity: Entity = assignEntityId({
    position: { tx: options.tile.tx, ty: options.tile.ty },
    renderable: { textureKey: 'villager_placeholder' },
    unit: { unitType: 'villager' },
    health: { current: 25, max: 25 },
    selectable: { selected: false },
    movable: { speed: 2.5, path: [], progress: 0, facing: 'S' },
    owner: { playerId: options.playerId ?? 1 },
    gatherer: {
      carryingType: null,
      carrying: 0,
      capacity: 10,
      gatherRate: 0.6,
      targetNodeId: undefined,
      dropoffId: undefined,
    },
  });
  world.add(entity);
  return entity;
}
