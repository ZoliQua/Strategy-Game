import Phaser from 'phaser';
import type { With } from 'miniplex';
import { tileToScreen } from '../../iso/coordinates';
import { footprintDepth, tileDepth } from '../../iso/depth';
import type { Entity } from '../components';
import type { EcsWorld } from '../world';

type Renderable = With<Entity, 'position' | 'renderable'>;

/**
 * Syncs ECS entities that have `position` + `renderable` into Phaser
 * sprites. Creates sprites on first sync and updates screen position +
 * depth each tick.
 *
 * The system keeps the sprite in the entity's `sprite` field; on
 * entity removal the scene owner should destroy the sprite (handled
 * here via a world listener).
 */
export class RenderSystem {
  private readonly scene: Phaser.Scene;
  private readonly world: EcsWorld;
  private readonly renderable: ReturnType<EcsWorld['with']>;

  constructor(scene: Phaser.Scene, world: EcsWorld) {
    this.scene = scene;
    this.world = world;
    this.renderable = this.world.with('position', 'renderable');

    this.renderable.onEntityRemoved.subscribe((entity: Renderable) => {
      entity.sprite?.destroy();
      delete entity.sprite;
    });
  }

  update(): void {
    for (const entity of this.renderable) {
      const sprite = entity.sprite ?? this.ensureSprite(entity);
      const { sx, sy } = renderScreenPos(entity);
      sprite.setPosition(sx, sy);
      sprite.setDepth(renderDepth(entity));
      applyFacing(sprite, entity);
      applyConstructionAlpha(sprite, entity);
    }
  }

  private ensureSprite(entity: Renderable): Phaser.GameObjects.Sprite {
    const sprite = this.scene.add.sprite(0, 0, entity.renderable.textureKey);
    if (entity.building) {
      sprite.setOrigin(0.5, 1 - 4 / sprite.height);
    } else {
      sprite.setOrigin(0.5, 0.85);
    }
    entity.sprite = sprite;
    return sprite;
  }
}

function renderScreenPos(entity: Renderable): { sx: number; sy: number } {
  const current = entity.position;
  if (entity.building) {
    // Buildings render at the bottom-most corner of the footprint so
    // the sprite's bottom edge sits on the ground at the front of the
    // 3x3 (or other) diamond.
    const bottom = {
      tx: current.tx + entity.building.footprint.width - 1,
      ty: current.ty + entity.building.footprint.height - 1,
    };
    return tileToScreen(bottom);
  }
  const mv = entity.movable;
  if (!mv || mv.path.length === 0 || mv.progress === 0) {
    return tileToScreen(current);
  }
  const next = mv.path[0]!;
  const t = Math.min(Math.max(mv.progress, 0), 1);
  const from = tileToScreen(current);
  const to = tileToScreen(next);
  return {
    sx: from.sx + (to.sx - from.sx) * t,
    sy: from.sy + (to.sy - from.sy) * t,
  };
}

function applyConstructionAlpha(
  sprite: Phaser.GameObjects.Sprite,
  entity: Renderable,
): void {
  if (entity.underConstruction) {
    const t = Math.min(
      1,
      entity.underConstruction.elapsed /
        entity.underConstruction.totalTime,
    );
    sprite.setAlpha(0.3 + 0.6 * t);
  } else if (entity.building) {
    sprite.setAlpha(1);
  }
}

function applyFacing(
  sprite: Phaser.GameObjects.Sprite,
  entity: Renderable,
): void {
  const mv = entity.movable;
  if (!mv) return;
  // M1.7 placeholder: flip the sprite for westward facings. Real
  // 8-direction sprites arrive with the art pipeline in M4+.
  sprite.setFlipX(mv.facing === 'W' || mv.facing === 'NW' || mv.facing === 'SW');
}

function renderDepth(entity: Renderable): number {
  if (entity.building) {
    return footprintDepth(
      entity.position,
      entity.building.footprint.width,
      entity.building.footprint.height,
    ) + 0.2;
  }
  const mv = entity.movable;
  if (!mv || mv.path.length === 0) return tileDepth(entity.position);
  const next = mv.path[0]!;
  const t = Math.min(Math.max(mv.progress, 0), 1);
  return (
    tileDepth(entity.position) +
    (tileDepth(next) - tileDepth(entity.position)) * t
  );
}
