import type { EcsWorld } from '../ecs/world';
import type { PlayerManager } from './PlayerManager';

export type VictoryState =
  | { kind: 'playing' }
  | { kind: 'victory'; winnerId: number }
  | { kind: 'defeat'; winnerId: number };

/**
 * Conquest victory: a player is defeated once they own zero active
 * (non-dying) town centres. When only one undefeated player remains,
 * the match ends — victory for the human if it's them, defeat
 * otherwise.
 */
export class VictoryChecker {
  constructor(
    private readonly world: EcsWorld,
    private readonly players: PlayerManager,
  ) {}

  check(): VictoryState {
    for (const player of this.players.all()) {
      if (player.defeated) continue;
      const hasTc = this.hasLiveTownCenter(player.id);
      if (!hasTc) this.players.markDefeated(player.id);
    }
    const alive = this.players.all().filter((p) => !p.defeated);
    if (alive.length <= 1) {
      const winner = alive[0] ?? this.players.all()[0]!;
      const human = this.players.human();
      if (!human) return { kind: 'playing' };
      if (winner.id === human.id) {
        return { kind: 'victory', winnerId: winner.id };
      }
      return { kind: 'defeat', winnerId: winner.id };
    }
    return { kind: 'playing' };
  }

  private hasLiveTownCenter(playerId: number): boolean {
    for (const entity of this.world.with('building', 'owner')) {
      if (entity.owner.playerId !== playerId) continue;
      if (entity.building.type !== 'town_center') continue;
      if (entity.dying) continue;
      return true;
    }
    return false;
  }
}
