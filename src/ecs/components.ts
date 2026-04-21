import type Phaser from 'phaser';
import type { TileCoord } from '../iso/coordinates';
import type { Direction } from '../types';

/**
 * All ECS components. Miniplex entities are plain objects with any
 * subset of these optional fields — the archetype factories and
 * systems assert the shape they need.
 *
 * Components are data-only (no methods). Behaviour lives in systems
 * under src/ecs/systems.
 */

export interface UnitTag {
  readonly unitType: 'villager' | 'swordsman' | 'archer';
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
}
