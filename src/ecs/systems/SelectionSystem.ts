import Phaser from 'phaser';
import type { With } from 'miniplex';
import { tileToScreen } from '../../iso/coordinates';
import { tileDepth } from '../../iso/depth';
import type { Entity } from '../components';
import type { EcsWorld } from '../world';

type SelectableWithPos = With<Entity, 'position' | 'selectable'>;

/**
 * Manages a single-entity selection for the human player (M0 scope —
 * multi-select arrives in M1). Selection is stored on the entity via
 * `selectable.selected`; the system renders a circle under the
 * selected unit and keeps it in sync with the entity's tile position.
 */
export class SelectionSystem {
  private readonly scene: Phaser.Scene;
  private readonly world: EcsWorld;
  private indicator: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, world: EcsWorld) {
    this.scene = scene;
    this.world = world;
  }

  /** Selects the first selectable entity at the given tile, or clears. */
  selectAtTile(tx: number, ty: number): Entity | null {
    this.clearSelection();
    const candidates = this.world.with('position', 'selectable');
    for (const entity of candidates) {
      if (entity.position.tx === tx && entity.position.ty === ty) {
        entity.selectable.selected = true;
        return entity;
      }
    }
    return null;
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
    const selected = this.getSelected();
    if (!selected) {
      this.indicator?.setVisible(false);
      return;
    }
    if (!this.indicator) {
      this.indicator = this.scene.add.graphics();
      this.indicator.lineStyle(2, 0x8bc34a, 1);
      this.indicator.strokeEllipse(0, 0, 36, 18);
    }
    const { sx, sy } = tileToScreen(selected.position);
    this.indicator.setPosition(sx, sy);
    this.indicator.setDepth(tileDepth(selected.position) - 0.1);
    this.indicator.setVisible(true);
  }
}
