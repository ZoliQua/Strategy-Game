import type { FogOfWarData } from '../../map/FogOfWarData';
import type { EcsWorld } from '../world';

const SCAN_INTERVAL_MS = 250;

/**
 * Recomputes per-tile visibility for the human player. On each scan:
 *   1) All currently-visible tiles drop to 'explored'.
 *   2) Every player-owned entity with a fogEmitter stamps a circular
 *      Chebyshev-distance area back to 'visible'.
 * Runs every 250ms — more than enough for unit motion at 2.5 tiles/s.
 */
export class FogOfWarSystem {
  private elapsedMs = SCAN_INTERVAL_MS;

  constructor(
    private readonly world: EcsWorld,
    private readonly fog: FogOfWarData,
    private readonly viewerPlayerId: number,
  ) {}

  update(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    if (this.elapsedMs < SCAN_INTERVAL_MS) return;
    this.elapsedMs = 0;

    this.fog.dimVisibleToExplored();
    const emitters = this.world.with('position', 'fogEmitter', 'owner');
    for (const e of emitters) {
      if (e.owner.playerId !== this.viewerPlayerId) continue;
      const range = e.fogEmitter.sightRange;
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          if (dx * dx + dy * dy > range * range + range) continue;
          this.fog.markVisible(e.position.tx + dx, e.position.ty + dy);
        }
      }
    }
  }
}
