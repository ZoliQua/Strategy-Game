import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  AgeId,
  BuildingType,
  Population,
  Resources,
  UnitType,
} from '../types';

export interface TrainingEntryInfo {
  unitType: UnitType;
  progress: number; // 0..1
}

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
  trainable?: readonly UnitType[];
  queue?: readonly TrainingEntryInfo[];
}

export type SelectedEntityInfo = SelectedUnitInfo | SelectedBuildingInfo;

export interface UiState {
  resources: Resources;
  population: Population;
  currentAge: AgeId;
  selectedEntity: SelectedEntityInfo | null;
  placementBuilding: BuildingType | null;
}

export interface UiActions {
  setResources: (r: Partial<Resources>) => void;
  setPopulation: (p: Partial<Population>) => void;
  setAge: (age: AgeId) => void;
  setSelectedEntity: (info: SelectedEntityInfo | null) => void;
  setPlacementBuilding: (type: BuildingType | null) => void;
}

export type UiStore = UiState & UiActions;

const INITIAL: UiState = {
  resources: { food: 200, wood: 200, gold: 100 },
  population: { current: 3, cap: 10 },
  currentAge: 1,
  selectedEntity: null,
  placementBuilding: null,
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
    setPlacementBuilding: (type) => set({ placementBuilding: type }),
  }));
}

/**
 * Default singleton store used by GameScene and HUDScene. Pinned on
 * globalThis so Vite HMR re-evaluations share a single instance
 * across both the game bundle and dynamic `import()` calls (this is
 * a dev-only quality-of-life; in the production bundle the module
 * is evaluated once anyway).
 */
const STORE_KEY = '__isorts_uiStore__';
interface GlobalHolder {
  [STORE_KEY]?: StoreApi<UiStore>;
}
const holder = globalThis as unknown as GlobalHolder;
export const uiStore: StoreApi<UiStore> = holder[STORE_KEY] ?? createUiStore();
holder[STORE_KEY] = uiStore;
