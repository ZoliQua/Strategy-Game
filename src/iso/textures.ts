import Phaser from 'phaser';
import { TILE_HEIGHT, TILE_WIDTH } from '../config/constants';
import { TERRAIN_TEXTURE } from '../map/TileMap';

/**
 * Generates placeholder textures procedurally so M0 needs no binary
 * assets in git. Real sprites replace these in M1+ via the atlas
 * pipeline (CLAUDE.md 8).
 */
export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(TERRAIN_TEXTURE)) {
    buildGrassTile(scene);
  }
  if (!scene.textures.exists('villager_placeholder')) {
    buildVillagerPlaceholder(scene);
  }
}

function buildGrassTile(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = TILE_WIDTH;
  const h = TILE_HEIGHT;
  const halfW = w / 2;
  const halfH = h / 2;

  g.fillStyle(0x4a7a34, 1);
  g.beginPath();
  g.moveTo(halfW, 0);
  g.lineTo(w, halfH);
  g.lineTo(halfW, h);
  g.lineTo(0, halfH);
  g.closePath();
  g.fillPath();

  g.lineStyle(1, 0x2d4d20, 0.8);
  g.beginPath();
  g.moveTo(halfW, 0);
  g.lineTo(w, halfH);
  g.lineTo(halfW, h);
  g.lineTo(0, halfH);
  g.closePath();
  g.strokePath();

  g.generateTexture(TERRAIN_TEXTURE, w, h);
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
