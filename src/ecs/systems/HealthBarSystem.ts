import Phaser from 'phaser';
import { tileToScreen } from '../../iso/coordinates';
import type { Entity } from '../components';
import type { EcsWorld } from '../world';

interface BarRecord {
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
}

const BAR_WIDTH = 28;
const BAR_HEIGHT = 3;

/**
 * Draws a thin HP bar above every entity with a health component,
 * unless HP is full — full-HP bars just add visual noise. Hidden
 * entirely for entities that are dying.
 */
export class HealthBarSystem {
  private readonly scene: Phaser.Scene;
  private readonly world: EcsWorld;
  private readonly bars = new Map<number, BarRecord>();

  constructor(scene: Phaser.Scene, world: EcsWorld) {
    this.scene = scene;
    this.world = world;
  }

  update(): void {
    const alive = new Set<number>();
    for (const entity of this.world.with('position', 'health')) {
      if (entity.id === undefined) continue;
      const full = entity.health.current >= entity.health.max;
      const dying = (entity as Entity).dying !== undefined;
      if (full || dying) continue;
      alive.add(entity.id);

      let record = this.bars.get(entity.id);
      if (!record) {
        record = this.createBar();
        this.bars.set(entity.id, record);
      }
      this.positionBar(record, entity);
    }
    // Cull removed / full-HP / dying bars.
    for (const [id, record] of this.bars) {
      if (!alive.has(id)) {
        record.bg.destroy();
        record.fill.destroy();
        this.bars.delete(id);
      }
    }
  }

  destroyAll(): void {
    for (const record of this.bars.values()) {
      record.bg.destroy();
      record.fill.destroy();
    }
    this.bars.clear();
  }

  private createBar(): BarRecord {
    const bg = this.scene.add.rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, 0x000000, 0.85);
    const fill = this.scene.add.rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, 0x4ad068, 1);
    bg.setOrigin(0, 0.5);
    fill.setOrigin(0, 0.5);
    return { bg, fill };
  }

  private positionBar(record: BarRecord, entity: Entity): void {
    if (!entity.position || !entity.health) return;
    const b = entity.building;
    let sx: number;
    let sy: number;
    let width = BAR_WIDTH;
    if (b) {
      // Buildings: bar above the top corner of the footprint.
      const center = {
        tx: entity.position.tx + (b.footprint.width - 1) / 2,
        ty: entity.position.ty + (b.footprint.height - 1) / 2,
      };
      const topY = (center.tx + center.ty) * 16 - (b.footprint.width + b.footprint.height) * 8 - 12;
      sx = (center.tx - center.ty) * 32;
      sy = topY;
      width = Math.max(BAR_WIDTH, (b.footprint.width + b.footprint.height) * 12);
    } else {
      const { sx: x, sy: y } = tileToScreen(entity.position);
      sx = x;
      sy = y - 30;
    }
    const pct = Math.max(0, entity.health.current / entity.health.max);
    const depth = (entity.position.tx + entity.position.ty) + 5;
    record.bg.setPosition(sx - width / 2, sy);
    record.bg.setSize(width, BAR_HEIGHT);
    record.bg.setDepth(depth);
    record.fill.setPosition(sx - width / 2, sy);
    record.fill.setSize(Math.round(width * pct), BAR_HEIGHT);
    record.fill.setDepth(depth + 0.01);
    record.fill.setFillStyle(hpColor(pct));
  }
}

function hpColor(pct: number): number {
  if (pct > 0.5) return 0x4ad068;
  if (pct > 0.25) return 0xd0c64a;
  return 0xd04a4a;
}
