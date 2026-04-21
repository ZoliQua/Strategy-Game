import type { BuildingType, UnitType } from '../../types';

export interface UnitSpec {
  readonly type: UnitType;
  readonly cost: { food: number; wood: number; gold: number };
  readonly trainTime: number;
  /** Buildings that can train this unit. */
  readonly trainers: readonly BuildingType[];
  readonly populationCost: number;
  readonly maxHp: number;
  /** Tiles per second. */
  readonly speed: number;
  /** Melee / ranged damage; 0 = can't fight. */
  readonly damage: number;
  /** Tile range for attacks; 1 = melee. */
  readonly range: number;
  readonly textureKey: string;
}

export const UNIT_SPECS: Record<UnitType, UnitSpec> = {
  villager: {
    type: 'villager',
    cost: { food: 50, wood: 0, gold: 0 },
    trainTime: 25,
    trainers: ['town_center'],
    populationCost: 1,
    maxHp: 25,
    speed: 2.5,
    damage: 3,
    range: 1,
    textureKey: 'villager_placeholder',
  },
  scout: {
    type: 'scout',
    cost: { food: 80, wood: 0, gold: 0 },
    trainTime: 20,
    trainers: ['barracks'],
    populationCost: 1,
    maxHp: 30,
    speed: 4,
    damage: 4,
    range: 1,
    textureKey: 'unit_scout',
  },
  swordsman: {
    type: 'swordsman',
    cost: { food: 60, wood: 0, gold: 20 },
    trainTime: 20,
    trainers: ['barracks'],
    populationCost: 1,
    maxHp: 50,
    speed: 2.2,
    damage: 7,
    range: 1,
    textureKey: 'unit_swordsman',
  },
  archer: {
    type: 'archer',
    cost: { food: 40, wood: 30, gold: 0 },
    trainTime: 25,
    trainers: ['archery_range', 'barracks'],
    populationCost: 1,
    maxHp: 30,
    speed: 2.4,
    damage: 5,
    range: 4,
    textureKey: 'unit_archer',
  },
  knight: {
    type: 'knight',
    cost: { food: 60, wood: 0, gold: 75 },
    trainTime: 30,
    trainers: ['stable'],
    populationCost: 1,
    maxHp: 110,
    speed: 3.5,
    damage: 12,
    range: 1,
    textureKey: 'unit_knight',
  },
  pikeman: {
    type: 'pikeman',
    cost: { food: 35, wood: 25, gold: 0 },
    trainTime: 22,
    trainers: ['barracks'],
    populationCost: 1,
    maxHp: 55,
    speed: 2.2,
    damage: 8,
    range: 1,
    textureKey: 'unit_pikeman',
  },
  crossbowman: {
    type: 'crossbowman',
    cost: { food: 25, wood: 45, gold: 0 },
    trainTime: 27,
    trainers: ['archery_range'],
    populationCost: 1,
    maxHp: 35,
    speed: 2.2,
    damage: 7,
    range: 5,
    textureKey: 'unit_crossbowman',
  },
  musketeer: {
    type: 'musketeer',
    cost: { food: 60, wood: 0, gold: 20 },
    trainTime: 30,
    trainers: ['barracks'],
    populationCost: 1,
    maxHp: 60,
    speed: 2.2,
    damage: 12,
    range: 6,
    textureKey: 'unit_musketeer',
  },
  cannon: {
    type: 'cannon',
    cost: { food: 60, wood: 100, gold: 200 },
    trainTime: 65,
    trainers: ['blacksmith'],
    populationCost: 2,
    maxHp: 120,
    speed: 1.2,
    damage: 40,
    range: 7,
    textureKey: 'unit_cannon',
  },
  cavalry: {
    type: 'cavalry',
    cost: { food: 70, wood: 0, gold: 75 },
    trainTime: 30,
    trainers: ['stable'],
    populationCost: 1,
    maxHp: 120,
    speed: 4,
    damage: 13,
    range: 1,
    textureKey: 'unit_cavalry',
  },
};
