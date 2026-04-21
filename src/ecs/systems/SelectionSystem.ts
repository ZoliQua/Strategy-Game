import Phaser from 'phaser';
import type { With } from 'miniplex';
import { tileToScreen } from '../../iso/coordinates';
import { tileDepth } from '../../iso/depth';
import type { UnitType } from '../../types';
import { uiStore, type SelectedEntityInfo } from '../../ui/store';
import { UNIT_SPECS } from '../archetypes/unit';
import type { Entity } from '../components';
import type { EcsWorld } from '../world';

type SelectableWithPos = With<Entity, 'position' | 'selectable'>;

function toSelectedInfo(entity: SelectableWithPos): SelectedEntityInfo | null {
  if (entity.id === undefined || !entity.health) return null;
  if (entity.unit) {
    return {
      kind: 'unit',
      id: entity.id,
      unitType: entity.unit.unitType,
      hp: { current: entity.health.current, max: entity.health.max },
      tile: { tx: entity.position.tx, ty: entity.position.ty },
      ...(entity.gatherer?.carryingType
        ? {
            carrying: {
              type: entity.gatherer.carryingType,
              amount: entity.gatherer.carrying,
            },
          }
        : {}),
    };
  }
  if (entity.building) {
    const info: SelectedEntityInfo = {
      kind: 'building',
      id: entity.id,
      buildingType: entity.building.type,
      hp: { current: entity.health.current, max: entity.health.max },
      tile: { tx: entity.position.tx, ty: entity.position.ty },
    };
    if (entity.trainingQueue) {
      const trainable = (Object.keys(UNIT_SPECS) as UnitType[]).filter(
        (u) => UNIT_SPECS[u].trainers.includes(entity.building!.type),
      );
      info.trainable = trainable;
      info.queue = entity.trainingQueue.entries.map((e) => ({
        unitType: e.unitType,
        progress: Math.min(1, e.elapsed / e.totalTime),
      }));
    }
    return info;
  }
  return null;
}

/**
 * Manages a single-entity selection for the human player (M0 scope —
 * multi-select arrives in M1). Selection is stored on the entity via
 * `selectable.selected`; the system renders a circle under the
 * selected unit and keeps it in sync with the entity's tile position.
 */
export class SelectionSystem {
  private readonly scene: Phaser.Scene;
  private readonly world: EcsWorld;
  private indicators: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, world: EcsWorld) {
    this.scene = scene;
    this.world = world;
  }

  /**
   * Selects a unit on the tile if any; otherwise selects a building
   * whose footprint covers the tile. Clears selection otherwise.
   */
  selectAtTile(tx: number, ty: number): Entity | null {
    this.clearSelection();
    const candidates = this.world.with('position', 'selectable');
    let building: Entity | null = null;
    for (const entity of candidates) {
      if (entity.unit && entity.position.tx === tx && entity.position.ty === ty) {
        entity.selectable.selected = true;
        return entity;
      }
      if (entity.building) {
        const fp = entity.building.footprint;
        if (
          tx >= entity.position.tx &&
          tx < entity.position.tx + fp.width &&
          ty >= entity.position.ty &&
          ty < entity.position.ty + fp.height
        ) {
          building = entity;
        }
      }
    }
    if (building?.selectable) {
      building.selectable.selected = true;
      return building;
    }
    return null;
  }

  /**
   * Selects all own units whose tile lies inside the given world
   * rectangle. Buildings are excluded — drag-selecting town centres
   * together with villagers is almost never what the player wants.
   */
  selectUnitsInWorldRect(
    minSx: number,
    minSy: number,
    maxSx: number,
    maxSy: number,
    playerId: number,
    additive = false,
  ): number {
    if (!additive) this.clearSelection();
    const [x0, x1] = minSx < maxSx ? [minSx, maxSx] : [maxSx, minSx];
    const [y0, y1] = minSy < maxSy ? [minSy, maxSy] : [maxSy, minSy];
    let count = 0;
    const candidates = this.world.with('position', 'selectable', 'unit');
    for (const entity of candidates) {
      if (entity.owner?.playerId !== playerId) continue;
      const sx = (entity.position.tx - entity.position.ty) * 32;
      const sy = (entity.position.tx + entity.position.ty) * 16;
      if (sx < x0 || sx > x1 || sy < y0 || sy > y1) continue;
      entity.selectable.selected = true;
      count++;
    }
    return count;
  }

  getAllSelected(): Entity[] {
    const out: Entity[] = [];
    for (const entity of this.world.with('selectable', 'position')) {
      if (entity.selectable.selected) out.push(entity as Entity);
    }
    return out;
  }

  clearSelection(): void {
    const all = this.world.with('selectable');
    for (const entity of all) {
      entity.selectable.selected = false;
    }
  }

  getSelected(): SelectableWithPos | undefined {
    const all = this.world.with('selectable', 'position');
    for (const entity of all) {
      if (entity.selectable.selected) return entity;
    }
    return undefined;
  }

  update(): void {
    const selected = this.getAllSelected();
    this.ensureIndicators(selected.length);
    if (selected.length === 0) {
      uiStore.getState().setSelectedEntity(null);
      return;
    }
    selected.forEach((entity, i) => {
      this.drawIndicator(this.indicators[i]!, entity as SelectableWithPos);
    });
    // Primary selection for the HUD = first (works for single-select
    // and gives a meaningful panel for groups).
    uiStore.getState().setSelectedEntity(
      toSelectedInfo(selected[0] as SelectableWithPos),
    );
  }

  private ensureIndicators(count: number): void {
    while (this.indicators.length < count) {
      this.indicators.push(this.scene.add.graphics());
    }
    for (let i = count; i < this.indicators.length; i++) {
      this.indicators[i]!.setVisible(false);
    }
  }

  private drawIndicator(
    g: Phaser.GameObjects.Graphics,
    selected: SelectableWithPos,
  ): void {
    g.clear();
    g.lineStyle(2, 0x8bc34a, 1);
    const e = selected as Entity;
    if (e.building) {
      const w = e.building.footprint.width;
      const h = e.building.footprint.height;
      const centerTile = {
        tx: selected.position.tx + (w - 1) / 2,
        ty: selected.position.ty + (h - 1) / 2,
      };
      const { sx, sy } = tileToScreen(centerTile);
      const halfW = ((w + h) * 32) / 2;
      const halfH = ((w + h) * 16) / 2;
      g.beginPath();
      g.moveTo(sx, sy - halfH);
      g.lineTo(sx + halfW, sy);
      g.lineTo(sx, sy + halfH);
      g.lineTo(sx - halfW, sy);
      g.closePath();
      g.strokePath();
      g.setDepth(
        selected.position.tx + w - 1 + (selected.position.ty + h - 1) - 0.1,
      );
    } else {
      const { sx, sy } = tileToScreen(selected.position);
      g.strokeEllipse(sx, sy, 36, 18);
      g.setDepth(tileDepth(selected.position) - 0.1);
    }
    g.setVisible(true);
  }
}
