import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  AgeId,
  BuildingType,
  Population,
  Resources,
  UnitType,
} from '../types';

export interface SelectedUnitInfo {
  kind: 'unit';
  id: number;
  unitType: UnitType;
  hp: { current: number; max: number };
  tile: { tx: number; ty: number };
  carrying?: { type: 'food' | 'wood' | 'gold'; amount: number };
}

export interface SelectedBuildingInfo {
  kind: 'building';
  id: number;
  buildingType: BuildingType;
  hp: { current: number; max: number };
  tile: { tx: number; ty: number };
  constructionProgress?: number;
}

export type SelectedEntityInfo = SelectedUnitInfo | SelectedBuildingInfo;

export interface UiState {
  resources: Resources;
  population: Population;
  currentAge: AgeId;
  selectedEntity: SelectedEntityInfo | null;
}

export interface UiActions {
  setResources: (r: Partial<Resources>) => void;
  setPopulation: (p: Partial<Population>) => void;
  setAge: (age: AgeId) => void;
  setSelectedEntity: (info: SelectedEntityInfo | null) => void;
}

export type UiStore = UiState & UiActions;

const INITIAL: UiState = {
  resources: { food: 200, wood: 200, gold: 100 },
  population: { current: 3, cap: 10 },
  currentAge: 1,
  selectedEntity: null,
};

export function createUiStore(): StoreApi<UiStore> {
  return createStore<UiStore>((set) => ({
    ...INITIAL,
    setResources: (r) =>
      set((state) => ({ resources: { ...state.resources, ...r } })),
    setPopulation: (p) =>
      set((state) => ({ population: { ...state.population, ...p } })),
    setAge: (age) => set({ currentAge: age }),
    setSelectedEntity: (info) => set({ selectedEntity: info }),
  }));
}

/** Default singleton store used by GameScene and HUDScene. */
export const uiStore = createUiStore();
