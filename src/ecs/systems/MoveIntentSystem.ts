import type { Entity } from '../components';
import type { EcsWorld } from '../world';

/**
 * M0 scope: no pathfinding. If an entity has a `moveIntent`,
 * teleport its position to the target tile and drop the intent.
 * PathfindingSystem + MovementSystem replace this in M1.
 */
export class MoveIntentSystem {
  private readonly world: EcsWorld;

  constructor(world: EcsWorld) {
    this.world = world;
  }

  update(): void {
    const movers = this.world.with('position', 'moveIntent');
    for (const entity of movers) {
      entity.position = {
        tx: entity.moveIntent.target.tx,
        ty: entity.moveIntent.target.ty,
      };
      this.world.removeComponent(entity as Entity, 'moveIntent');
    }
  }
}
