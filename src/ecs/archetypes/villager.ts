import type { TileCoord } from '../../iso/coordinates';
import type { Entity } from '../components';
import { assignEntityId, type EcsWorld } from '../world';

export interface CreateVillagerOptions {
  readonly tile: TileCoord;
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
  });
  world.add(entity);
  return entity;
}
