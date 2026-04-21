import type { TileCoord } from '../../iso/coordinates';
import type { UnitType } from '../../types';
import type { Entity } from '../components';
import { assignEntityId, type EcsWorld } from '../world';
import { UNIT_SPECS } from './unit';

export interface CreateUnitOptions {
  readonly type: UnitType;
  readonly tile: TileCoord;
  readonly playerId: number;
}

/**
 * Generic unit factory. Villagers get a gatherer component; military
 * units get an attacker component (M2 adds combat). All units get
 * owner + health + movable + selectable + position + renderable.
 */
export function createUnit(
  world: EcsWorld,
  options: CreateUnitOptions,
): Entity {
  const spec = UNIT_SPECS[options.type];
  const entity: Entity = assignEntityId({
    position: { tx: options.tile.tx, ty: options.tile.ty },
    renderable: { textureKey: spec.textureKey },
    unit: { unitType: options.type },
    health: { current: spec.maxHp, max: spec.maxHp },
    selectable: { selected: false },
    movable: { speed: spec.speed, path: [], progress: 0, facing: 'S' },
    owner: { playerId: options.playerId },
    populationCost: { amount: spec.populationCost },
  });
  if (options.type === 'villager') {
    entity.gatherer = {
      carryingType: null,
      carrying: 0,
      capacity: 10,
      gatherRate: 0.6,
      targetNodeId: undefined,
      dropoffId: undefined,
    };
  }
  world.add(entity);
  return entity;
}
