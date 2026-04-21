import Phaser from 'phaser';
import { TILE_HEIGHT, TILE_WIDTH } from '../config/constants';
import { BUILDING_SPECS } from '../ecs/archetypes/building';
import { TERRAIN_TEXTURE_KEYS, TERRAIN, type TerrainId } from '../map/TerrainTypes';
import type { BuildingType } from '../types';

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

  for (const type of Object.keys(BUILDING_SPECS) as BuildingType[]) {
    const spec = BUILDING_SPECS[type];
    if (!scene.textures.exists(spec.textureKey)) {
      buildPlaceholderBuilding(scene, spec.textureKey, BUILDING_PALETTE[type], spec.width, spec.height);
    }
  }
}

interface BuildingPalette {
  readonly roof: number;
  readonly wall: number;
  readonly accent: number;
}

const BUILDING_PALETTE: Record<BuildingType, BuildingPalette> = {
  town_center: { roof: 0x884b2a, wall: 0xd9b77f, accent: 0xffd85c },
  house: { roof: 0x8a3a2a, wall: 0xcfb37a, accent: 0xffffff },
  farm: { roof: 0x6a4b2a, wall: 0xa67a3a, accent: 0xffd85c },
  lumber_camp: { roof: 0x4a331a, wall: 0x9a6a3a, accent: 0xa67a3a },
  mining_camp: { roof: 0x555555, wall: 0x9a9a9a, accent: 0xffd85c },
  barracks: { roof: 0x6a2222, wall: 0xcfb37a, accent: 0xff4444 },
  archery_range: { roof: 0x2a3a6a, wall: 0xcfb37a, accent: 0x6a9acf },
  stable: { roof: 0x5a4422, wall: 0xcfb37a, accent: 0x8a5a22 },
  blacksmith: { roof: 0x333333, wall: 0x8a7a5a, accent: 0xff8800 },
  tower: { roof: 0x555555, wall: 0x9a9a9a, accent: 0x7a7a7a },
  wall: { roof: 0x555555, wall: 0x7a7a7a, accent: 0x555555 },
  wonder: { roof: 0xcfa93a, wall: 0xfff2cf, accent: 0xffd85c },
};

function buildPlaceholderBuilding(
  scene: Phaser.Scene,
  key: string,
  palette: BuildingPalette,
  footprintW: number,
  footprintH: number,
): void {
  // Render a box sitting on the full iso footprint. The texture extends
  // upward from the base diamond to give the building some height.
  const baseW = TILE_WIDTH * (footprintW + footprintH) / 2;
  const baseH = TILE_HEIGHT * (footprintW + footprintH) / 2;
  const height = Math.max(32, footprintW * 16 + footprintH * 16);
  const texW = Math.ceil(baseW) + 8;
  const texH = Math.ceil(baseH) + height + 8;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const cx = texW / 2;
  const bottomY = texH - 4;
  const topY = bottomY - baseH - height;
  const leftX = cx - baseW / 2;
  const rightX = cx + baseW / 2;
  const baseTopY = bottomY - baseH;
  const wallBaseY = baseTopY + baseH / 2;

  // Base diamond (ground pattern, darker)
  g.fillStyle(palette.wall, 0.4);
  g.beginPath();
  g.moveTo(cx, baseTopY);
  g.lineTo(rightX, wallBaseY);
  g.lineTo(cx, bottomY);
  g.lineTo(leftX, wallBaseY);
  g.closePath();
  g.fillPath();

  // Walls (three visible faces as a simple prism).
  const wallTopY = topY + (baseH + height) * 0.4;
  g.fillStyle(palette.wall, 1);
  g.beginPath();
  g.moveTo(cx, baseTopY);
  g.lineTo(cx, wallTopY);
  g.lineTo(leftX, wallTopY + baseH / 2);
  g.lineTo(leftX, wallBaseY);
  g.closePath();
  g.fillPath();

  g.fillStyle(shade(palette.wall, 0.85), 1);
  g.beginPath();
  g.moveTo(cx, baseTopY);
  g.lineTo(cx, wallTopY);
  g.lineTo(rightX, wallTopY + baseH / 2);
  g.lineTo(rightX, wallBaseY);
  g.closePath();
  g.fillPath();

  // Roof (two triangular faces forming a ridge).
  g.fillStyle(palette.roof, 1);
  g.beginPath();
  g.moveTo(cx, topY);
  g.lineTo(rightX, wallTopY + baseH / 2);
  g.lineTo(cx, wallTopY);
  g.closePath();
  g.fillPath();

  g.fillStyle(shade(palette.roof, 0.8), 1);
  g.beginPath();
  g.moveTo(cx, topY);
  g.lineTo(leftX, wallTopY + baseH / 2);
  g.lineTo(cx, wallTopY);
  g.closePath();
  g.fillPath();

  // Accent (flag).
  g.fillStyle(palette.accent, 1);
  g.fillRect(cx - 1, topY - 12, 2, 12);
  g.fillRect(cx, topY - 12, 6, 5);

  g.lineStyle(1, 0x111111, 0.7);
  g.strokePath();

  g.generateTexture(key, texW, texH);
  g.destroy();
}

function shade(color: number, factor: number): number {
  const r = ((color >> 16) & 0xff) * factor;
  const g = ((color >> 8) & 0xff) * factor;
  const b = (color & 0xff) * factor;
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
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
