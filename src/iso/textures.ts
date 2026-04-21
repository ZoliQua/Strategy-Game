import Phaser from 'phaser';
import { TILE_HEIGHT, TILE_WIDTH } from '../config/constants';
import { TERRAIN_TEXTURE_KEYS, TERRAIN, type TerrainId } from '../map/TerrainTypes';

/**
 * Generates placeholder textures procedurally so M0/M1 need no binary
 * assets in git. Real sprites replace these in M2+ via the atlas
 * pipeline (CLAUDE.md 8).
 */
export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  for (const [key, id] of Object.entries(TERRAIN) as Array<[
    keyof typeof TERRAIN,
    TerrainId,
  ]>) {
    const textureKey = TERRAIN_TEXTURE_KEYS[id];
    if (scene.textures.exists(textureKey)) continue;
    buildDiamondTile(scene, textureKey, TERRAIN_PALETTE[key]);
  }

  if (!scene.textures.exists('villager_placeholder')) {
    buildVillagerPlaceholder(scene);
  }
}

interface Palette {
  readonly fill: number;
  readonly stroke: number;
  readonly accent?: number;
  readonly variant?: 'diamond' | 'forest' | 'gold' | 'berries' | 'water' | 'cliff';
}

const TERRAIN_PALETTE: Record<keyof typeof TERRAIN, Palette> = {
  grass: { fill: 0x4a7a34, stroke: 0x2d4d20, variant: 'diamond' },
  forest: { fill: 0x1f4a2a, stroke: 0x0d2414, accent: 0x2d6638, variant: 'forest' },
  gold_mine: { fill: 0x8a6a2a, stroke: 0x4a3914, accent: 0xffd85c, variant: 'gold' },
  berries: { fill: 0x5c8a3a, stroke: 0x2d4d20, accent: 0xd24747, variant: 'berries' },
  water: { fill: 0x2e5a8a, stroke: 0x1a3a5c, accent: 0x6aa0d0, variant: 'water' },
  cliff: { fill: 0x5a5a5a, stroke: 0x2e2e2e, accent: 0x8a8a8a, variant: 'cliff' },
};

function buildDiamondTile(
  scene: Phaser.Scene,
  key: string,
  palette: Palette,
): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = TILE_WIDTH;
  const h = TILE_HEIGHT;
  const halfW = w / 2;
  const halfH = h / 2;

  g.fillStyle(palette.fill, 1);
  g.beginPath();
  g.moveTo(halfW, 0);
  g.lineTo(w, halfH);
  g.lineTo(halfW, h);
  g.lineTo(0, halfH);
  g.closePath();
  g.fillPath();

  switch (palette.variant) {
    case 'forest':
      g.fillStyle(palette.accent ?? palette.fill, 1);
      g.fillTriangle(halfW, 4, halfW - 7, halfH + 2, halfW + 7, halfH + 2);
      g.fillStyle(0x1a1f14, 1);
      g.fillRect(halfW - 1, halfH + 1, 2, 4);
      break;
    case 'gold':
      g.fillStyle(palette.accent ?? 0xffd85c, 1);
      g.fillCircle(halfW - 6, halfH, 3);
      g.fillCircle(halfW + 6, halfH - 2, 2);
      g.fillCircle(halfW + 2, halfH + 4, 2);
      break;
    case 'berries':
      if (palette.accent !== undefined) {
        g.fillStyle(palette.accent, 1);
        for (const [dx, dy] of [
          [-8, 0],
          [-4, 3],
          [0, -2],
          [4, 3],
          [8, 0],
        ] as const) {
          g.fillCircle(halfW + dx, halfH + dy, 2);
        }
      }
      break;
    case 'water': {
      g.lineStyle(1, palette.accent ?? 0x6aa0d0, 0.9);
      g.beginPath();
      g.moveTo(halfW - 10, halfH);
      g.lineTo(halfW - 4, halfH - 2);
      g.lineTo(halfW + 4, halfH + 2);
      g.lineTo(halfW + 10, halfH);
      g.strokePath();
      break;
    }
    case 'cliff':
      g.fillStyle(palette.accent ?? 0x8a8a8a, 1);
      g.fillRect(halfW - 10, halfH - 2, 6, 4);
      g.fillRect(halfW + 2, halfH - 4, 5, 6);
      break;
    case 'diamond':
    default:
      break;
  }

  g.lineStyle(1, palette.stroke, 0.85);
  g.beginPath();
  g.moveTo(halfW, 0);
  g.lineTo(w, halfH);
  g.lineTo(halfW, h);
  g.lineTo(0, halfH);
  g.closePath();
  g.strokePath();

  g.generateTexture(key, w, h);
  g.destroy();
}

function buildVillagerPlaceholder(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = 24;
  const h = 40;

  g.fillStyle(0xeec07b, 1);
  g.fillCircle(w / 2, 8, 7);

  g.fillStyle(0x3a6ab0, 1);
  g.fillRect(w / 2 - 6, 15, 12, 16);

  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(w / 2 - 5, 31, 4, 8);
  g.fillRect(w / 2 + 1, 31, 4, 8);

  g.lineStyle(1, 0x000000, 0.6);
  g.strokeCircle(w / 2, 8, 7);

  g.generateTexture('villager_placeholder', w, h);
  g.destroy();
}
