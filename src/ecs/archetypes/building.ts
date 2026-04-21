import type { TileCoord } from '../../iso/coordinates';
import type { MapData } from '../../map/MapData';
import type { BuildingType, ResourceType } from '../../types';
import type { Entity } from '../components';
import { assignEntityId, type EcsWorld } from '../world';

export interface BuildingSpec {
  readonly type: BuildingType;
  readonly width: number;
  readonly height: number;
  readonly maxHp: number;
  readonly textureKey: string;
  readonly dropoffAccepts?: readonly ResourceType[];
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  town_center: {
    type: 'town_center',
    width: 3,
    height: 3,
    maxHp: 600,
    textureKey: 'building_town_center',
    dropoffAccepts: ['food', 'wood', 'gold'],
  },
  house: {
    type: 'house',
    width: 2,
    height: 2,
    maxHp: 200,
    textureKey: 'building_house',
  },
  farm: {
    type: 'farm',
    width: 2,
    height: 2,
    maxHp: 100,
    textureKey: 'building_farm',
  },
  lumber_camp: {
    type: 'lumber_camp',
    width: 2,
    height: 2,
    maxHp: 180,
    textureKey: 'building_lumber_camp',
    dropoffAccepts: ['wood'],
  },
  mining_camp: {
    type: 'mining_camp',
    width: 2,
    height: 2,
    maxHp: 180,
    textureKey: 'building_mining_camp',
    dropoffAccepts: ['gold'],
  },
  barracks: {
    type: 'barracks',
    width: 3,
    height: 3,
    maxHp: 400,
    textureKey: 'building_barracks',
  },
  archery_range: {
    type: 'archery_range',
    width: 3,
    height: 3,
    maxHp: 400,
    textureKey: 'building_archery_range',
  },
  stable: {
    type: 'stable',
    width: 3,
    height: 3,
    maxHp: 400,
    textureKey: 'building_stable',
  },
  blacksmith: {
    type: 'blacksmith',
    width: 2,
    height: 2,
    maxHp: 200,
    textureKey: 'building_blacksmith',
  },
  tower: {
    type: 'tower',
    width: 1,
    height: 1,
    maxHp: 300,
    textureKey: 'building_tower',
  },
  wall: {
    type: 'wall',
    width: 1,
    height: 1,
    maxHp: 400,
    textureKey: 'building_wall',
  },
  wonder: {
    type: 'wonder',
    width: 4,
    height: 4,
    maxHp: 2000,
    textureKey: 'building_wonder',
  },
};

export interface CreateBuildingOptions {
  readonly type: BuildingType;
  readonly origin: TileCoord;
  readonly playerId: number;
  readonly mapData: MapData;
}

/**
 * Creates a fully-built building at `origin` (top tile of the
 * footprint). Blocks the affected tiles in the MapData so pathfinding
 * routes around it.
 */
export function createBuilding(
  world: EcsWorld,
  options: CreateBuildingOptions,
): Entity {
  const spec = BUILDING_SPECS[options.type];
  blockFootprint(options.mapData, options.origin, spec, true);

  const entity: Entity = assignEntityId({
    position: { tx: options.origin.tx, ty: options.origin.ty },
    renderable: { textureKey: spec.textureKey },
    building: {
      type: spec.type,
      footprint: { width: spec.width, height: spec.height },
    },
    health: { current: spec.maxHp, max: spec.maxHp },
    selectable: { selected: false },
    owner: { playerId: options.playerId },
  });
  if (spec.dropoffAccepts) {
    entity.resourceDropoff = { accepts: spec.dropoffAccepts };
  }
  world.add(entity);
  return entity;
}

function blockFootprint(
  map: MapData,
  origin: TileCoord,
  spec: BuildingSpec,
  blocked: boolean,
): void {
  for (let dy = 0; dy < spec.height; dy++) {
    for (let dx = 0; dx < spec.width; dx++) {
      map.setBlocked(origin.tx + dx, origin.ty + dy, blocked);
    }
  }
}

export function unblockBuilding(map: MapData, entity: Entity): void {
  if (!entity.position || !entity.building) return;
  const { width, height } = entity.building.footprint;
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      map.setBlocked(entity.position.tx + dx, entity.position.ty + dy, false);
    }
  }
}
