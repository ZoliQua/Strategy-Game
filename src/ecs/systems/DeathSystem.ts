import { unblockBuilding } from '../archetypes/building';
import type { Entity } from '../components';
import type { EcsWorld } from '../world';
import type { MapData } from '../../map/MapData';

/**
 * Ticks the `dying` timer. When it expires, unblocks the footprint
 * (for buildings) and removes the entity from the world. The sprite
 * fades out via RenderSystem, driven by the same timer.
 */
export class DeathSystem {
  private readonly world: EcsWorld;
  private readonly mapData: MapData;

  constructor(world: EcsWorld, mapData: MapData) {
    this.world = world;
    this.mapData = mapData;
  }

  update(deltaMs: number): void {
    const dying = this.world.with('dying');
    const toRemove: Entity[] = [];
    for (const entity of dying) {
      entity.dying.ttlMs -= deltaMs;
      if (entity.dying.ttlMs <= 0) toRemove.push(entity);
    }
    for (const entity of toRemove) {
      if (entity.building) unblockBuilding(this.mapData, entity);
      this.world.remove(entity);
    }
  }
}
