import { uiStore } from '../../ui/store';
import type { EcsWorld } from '../world';

const TC_CAP_BONUS = 5;
const HOUSE_CAP_BONUS = 5;
const MAX_CAP = 200;

/**
 * Recomputes the player's population count (sum of populationCost on
 * all owned units) and cap (town centres + houses). Runs every tick;
 * it's cheap because the queries iterate only owned entities.
 */
export class PopulationSystem {
  private readonly world: EcsWorld;
  private readonly playerId: number;

  constructor(world: EcsWorld, playerId: number) {
    this.world = world;
    this.playerId = playerId;
  }

  update(): void {
    let current = 0;
    for (const entity of this.world.with('populationCost', 'owner')) {
      if (entity.owner.playerId !== this.playerId) continue;
      current += entity.populationCost.amount;
    }
    let cap = 0;
    for (const b of this.world.with('building', 'owner')) {
      if (b.owner.playerId !== this.playerId) continue;
      if ((b as { underConstruction?: unknown }).underConstruction) continue;
      if (b.building.type === 'town_center') cap += TC_CAP_BONUS;
      else if (b.building.type === 'house') cap += HOUSE_CAP_BONUS;
    }
    cap = Math.min(cap, MAX_CAP);

    const state = uiStore.getState();
    if (
      state.population.current !== current ||
      state.population.cap !== cap
    ) {
      state.setPopulation({ current, cap });
    }
  }
}
