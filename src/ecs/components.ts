import type Phaser from 'phaser';
import type { TileCoord } from '../iso/coordinates';
import type {
  BuildingType,
  Direction,
  ResourceType,
  UnitType,
} from '../types';

/**
 * All ECS components. Miniplex entities are plain objects with any
 * subset of these optional fields — the archetype factories and
 * systems assert the shape they need.
 *
 * Components are data-only (no methods). Behaviour lives in systems
 * under src/ecs/systems.
 */

export interface UnitTag {
  readonly unitType: UnitType;
}

export interface Entity {
  id?: number;
  position?: TileCoord;
  renderable?: {
    textureKey: string;
    frame?: string | number;
  };
  sprite?: Phaser.GameObjects.Sprite;
  unit?: UnitTag;
  health?: { current: number; max: number };
  selectable?: { selected: boolean };
  moveIntent?: { target: TileCoord };
  movable?: {
    /** Tiles per second. */
    speed: number;
    /** Remaining path (never includes the current `position`). */
    path: TileCoord[];
    /** 0..1 progress from current tile toward `path[0]`. */
    progress: number;
    facing: Direction;
  };
  resourceNode?: {
    type: ResourceType;
    amount: number;
    maxAmount: number;
  };
  gatherer?: {
    /** Resource currently carried (null when empty). */
    carryingType: ResourceType | null;
    carrying: number;
    capacity: number;
    /** Per-second rate while standing next to a resource node. */
    gatherRate: number;
    /** Which resource node the villager is assigned to (entity id). */
    targetNodeId: number | undefined;
    /** Last-known drop-off building id (town center or camp). */
    dropoffId: number | undefined;
  };
  gatherIntent?: { nodeId: number };
  resourceDropoff?: {
    accepts: readonly ResourceType[];
  };
  building?: {
    type: BuildingType;
    footprint: { width: number; height: number };
  };
  underConstruction?: {
    /** Seconds of builder-effort required in total. */
    totalTime: number;
    /** Elapsed builder-effort so far. One builder adds 1s/s. */
    elapsed: number;
  };
  buildCommand?: { targetId: number };
  trainingQueue?: {
    entries: Array<{ unitType: UnitType; elapsed: number; totalTime: number }>;
    maxQueue: number;
  };
  owner?: { playerId: number };
  populationCost?: { amount: number };
}
