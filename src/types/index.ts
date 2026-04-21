/** Globális játékbeli típusok. Lásd CLAUDE.md 4. szekció. */

export type AgeId = 1 | 2 | 3;

export const AGES: readonly { id: AgeId; nameKey: 'roman' | 'medieval' | 'enlightenment' }[] = [
  { id: 1, nameKey: 'roman' },
  { id: 2, nameKey: 'medieval' },
  { id: 3, nameKey: 'enlightenment' },
] as const;

export type CivId =
  | 'hungarian'
  | 'english'
  | 'german'
  | 'french'
  | 'spanish'
  | 'italian'
  | 'russian'
  | 'finnish';

export type ResourceType = 'food' | 'wood' | 'gold';

export interface Resources {
  food: number;
  wood: number;
  gold: number;
}

export type UnitType =
  | 'villager'
  | 'scout'
  | 'swordsman'
  | 'archer'
  | 'knight'
  | 'pikeman'
  | 'crossbowman'
  | 'musketeer'
  | 'cannon'
  | 'cavalry';

export type BuildingType =
  | 'town_center'
  | 'house'
  | 'farm'
  | 'lumber_camp'
  | 'mining_camp'
  | 'barracks'
  | 'archery_range'
  | 'stable'
  | 'blacksmith'
  | 'tower'
  | 'wall'
  | 'wonder';

export interface Population {
  current: number;
  cap: number;
}
