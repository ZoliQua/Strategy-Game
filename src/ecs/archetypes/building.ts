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
  readonly cost: { food: number; wood: number; gold: number };
  /** Builder-seconds required to complete (one villager = 1s/s). */
  readonly buildTime: number;
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  town_center: {
    type: 'town_center',
    width: 3, height: 3, maxHp: 600,
    textureKey: 'building_town_center',
    dropoffAccepts: ['food', 'wood', 'gold'],
    cost: { food: 0, wood: 275, gold: 0 },
    buildTime: 120,
  },
  house: {
    type: 'house',
    width: 2, height: 2, maxHp: 200,
    textureKey: 'building_house',
    cost: { food: 0, wood: 30, gold: 0 },
    buildTime: 25,
  },
  farm: {
    type: 'farm',
    width: 2, height: 2, maxHp: 100,
    textureKey: 'building_farm',
    cost: { food: 0, wood: 60, gold: 0 },
    buildTime: 20,
  },
  lumber_camp: {
    type: 'lumber_camp',
    width: 2, height: 2, maxHp: 180,
    textureKey: 'building_lumber_camp',
    dropoffAccepts: ['wood'],
    cost: { food: 0, wood: 80, gold: 0 },
    buildTime: 35,
  },
  mining_camp: {
    type: 'mining_camp',
    width: 2, height: 2, maxHp: 180,
    textureKey: 'building_mining_camp',
    dropoffAccepts: ['gold'],
    cost: { food: 0, wood: 80, gold: 0 },
    buildTime: 35,
  },
  barracks: {
    type: 'barracks',
    width: 3, height: 3, maxHp: 400,
    textureKey: 'building_barracks',
    cost: { food: 0, wood: 150, gold: 0 },
    buildTime: 50,
  },
  archery_range: {
    type: 'archery_range',
    width: 3, height: 3, maxHp: 400,
    textureKey: 'building_archery_range',
    cost: { food: 0, wood: 175, gold: 0 },
    buildTime: 50,
  },
  stable: {
    type: 'stable',
    width: 3, height: 3, maxHp: 400,
    textureKey: 'building_stable',
    cost: { food: 0, wood: 175, gold: 0 },
    buildTime: 50,
  },
  blacksmith: {
    type: 'blacksmith',
    width: 2, height: 2, maxHp: 200,
    textureKey: 'building_blacksmith',
    cost: { food: 0, wood: 150, gold: 0 },
    buildTime: 40,
  },
  tower: {
    type: 'tower',
    width: 1, height: 1, maxHp: 300,
    textureKey: 'building_tower',
    cost: { food: 0, wood: 50, gold: 125 },
    buildTime: 40,
  },
  wall: {
    type: 'wall',
    width: 1, height: 1, maxHp: 400,
    textureKey: 'building_wall',
    cost: { food: 0, wood: 5, gold: 0 },
    buildTime: 10,
  },
  wonder: {
    type: 'wonder',
    width: 4, height: 4, maxHp: 2000,
    textureKey: 'building_wonder',
    cost: { food: 0, wood: 1000, gold: 1000 },
    buildTime: 600,
  },
};

export interface CreateBuildingOptions {
  readonly type: BuildingType;
  readonly origin: TileCoord;
  readonly playerId: number;
  readonly mapData: MapData;
  /** When true, the building starts under construction at 1 HP. */
  readonly underConstruction?: boolean;
}

/**
 * Creates a building at `origin` (top tile of the footprint). Blocks
 * the affected tiles in the MapData so pathfinding routes around it.
 * With `underConstruction: true` the building starts at 1 HP and is
 * tagged for ConstructionSystem; HP scales up as progress advances.
 */
export function createBuilding(
  world: EcsWorld,
  options: CreateBuildingOptions,
): Entity {
  const spec = BUILDING_SPECS[options.type];
  blockFootprint(options.mapData, options.origin, spec, true);

  const underConstruction = options.underConstruction ?? false;
  const entity: Entity = assignEntityId({
    position: { tx: options.origin.tx, ty: options.origin.ty },
    renderable: { textureKey: spec.textureKey },
    building: {
      type: spec.type,
      footprint: { width: spec.width, height: spec.height },
    },
    health: {
      current: underConstruction ? 1 : spec.maxHp,
      max: spec.maxHp,
    },
    selectable: { selected: false },
    owner: { playerId: options.playerId },
  });
  if (underConstruction) {
    entity.underConstruction = {
      totalTime: spec.buildTime,
      elapsed: 0,
    };
  }
  if (spec.dropoffAccepts && !underConstruction) {
    entity.resourceDropoff = { accepts: spec.dropoffAccepts };
  }
  if (TRAINERS.has(spec.type) && !underConstruction) {
    entity.trainingQueue = { entries: [], maxQueue: 5 };
  }
  entity.fogEmitter = {
    sightRange: spec.type === 'tower' ? 9 : 4,
  };
  world.add(entity);
  return entity;
}

const TRAINERS: ReadonlySet<BuildingType> = new Set<BuildingType>([
  'town_center',
  'barracks',
  'archery_range',
  'stable',
  'blacksmith',
]);

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
