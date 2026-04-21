import type { With } from 'miniplex';
import type { MapData } from '../../map/MapData';
import { findPath } from '../../map/pathfinding';
import type { Entity } from '../components';
import type { EcsWorld } from '../world';

type PathableEntity = With<Entity, 'position' | 'moveIntent' | 'movable'>;

/**
 * Turns a `moveIntent` into a `movable.path` via A*. Runs once per
 * tick; if the target is unreachable the intent is dropped silently.
 */
export class PathfindingSystem {
  private readonly world: EcsWorld;
  private readonly mapData: MapData;

  constructor(world: EcsWorld, mapData: MapData) {
    this.world = world;
    this.mapData = mapData;
  }

  update(): void {
    const pending = this.world.with('position', 'moveIntent', 'movable');
    for (const entity of pending) {
      this.resolve(entity);
    }
  }

  private resolve(entity: PathableEntity): void {
    const target = entity.moveIntent.target;
    if (target.tx === entity.position.tx && target.ty === entity.position.ty) {
      this.world.removeComponent(entity as Entity, 'moveIntent');
      return;
    }
    const path = findPath(this.mapData, entity.position, target);
    if (!path || path.length < 2) {
      this.world.removeComponent(entity as Entity, 'moveIntent');
      return;
    }
    // path[0] is the current tile; drop it — `movable.path` only holds
    // upcoming steps.
    entity.movable.path = path.slice(1);
    entity.movable.progress = 0;
    this.world.removeComponent(entity as Entity, 'moveIntent');
  }
}
