import Phaser from 'phaser';
import { TERRAIN, type TerrainId } from '../map/TerrainTypes';
import type { Entity } from '../ecs/components';
import type { EcsWorld } from '../ecs/world';
import type { MapData } from '../map/MapData';
import { PLAYER_COLORS } from '../game/Player';
import { TILE_HEIGHT, TILE_WIDTH } from '../config/constants';

const MINIMAP_SIZE = 200;
const REBUILD_INTERVAL_MS = 500;

const TERRAIN_COLOR: Record<TerrainId, number> = {
  [TERRAIN.grass]: 0x4a7a34,
  [TERRAIN.forest]: 0x1f4a2a,
  [TERRAIN.gold_mine]: 0xd0a84a,
  [TERRAIN.berries]: 0xd24747,
  [TERRAIN.water]: 0x2e5a8a,
  [TERRAIN.cliff]: 0x5a5a5a,
};

/**
 * 200×200 isometric overview. The minimap renders tiles + entities
 * in the same iso projection as the main view, just scaled down,
 * so the viewport rectangle is a faithful 1:1 axis-aligned subset of
 * the iso diamond. Clicking anywhere jumps the main camera there.
 */
export class Minimap {
  private readonly frame: Phaser.GameObjects.Rectangle;
  private readonly rt: Phaser.GameObjects.Graphics;
  private readonly viewportRect: Phaser.GameObjects.Rectangle;
  private readonly scale: number;
  private readonly offsetX: number;
  private readonly offsetY: number;
  private readonly minWorldX: number;
  private readonly minWorldY: number;
  private readonly worldWidth: number;
  private readonly worldHeight: number;
  private readonly x: number;
  private readonly y: number;
  private elapsedSinceBuildMs = Number.MAX_SAFE_INTEGER;

  constructor(
    scene: Phaser.Scene,
    private readonly world: EcsWorld,
    private readonly mapData: MapData,
    private readonly gameCamera: Phaser.Cameras.Scene2D.Camera,
    onJumpTo: (tx: number, ty: number) => void,
  ) {
    this.x = scene.scale.width - MINIMAP_SIZE - 16;
    this.y = 64;

    // World-space bounding box of the iso map.
    const W = mapData.width;
    const H = mapData.height;
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;
    this.minWorldX = -(H - 1) * halfW;
    const maxWorldX = (W - 1) * halfW;
    this.minWorldY = 0;
    const maxWorldY = (W + H - 2) * halfH;
    this.worldWidth = maxWorldX - this.minWorldX + TILE_WIDTH;
    this.worldHeight = maxWorldY - this.minWorldY + TILE_HEIGHT;

    this.scale = Math.min(
      MINIMAP_SIZE / this.worldWidth,
      MINIMAP_SIZE / this.worldHeight,
    );
    this.offsetX = (MINIMAP_SIZE - this.worldWidth * this.scale) / 2;
    this.offsetY = (MINIMAP_SIZE - this.worldHeight * this.scale) / 2;

    this.frame = scene.add
      .rectangle(this.x, this.y, MINIMAP_SIZE, MINIMAP_SIZE, 0x000000, 0.8)
      .setStrokeStyle(1, 0x4a5565)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(10_000);

    this.rt = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(10_001)
      .setPosition(this.x, this.y);

    this.viewportRect = scene.add
      .rectangle(this.x, this.y, 20, 20, 0, 0)
      .setStrokeStyle(1, 0xffffff, 0.9)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(10_002);

    this.frame.setInteractive({ useHandCursor: true });
    this.frame.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const localX = p.x - this.x - this.offsetX;
      const localY = p.y - this.y - this.offsetY;
      const worldX = localX / this.scale + this.minWorldX;
      const worldY = localY / this.scale + this.minWorldY;
      // Inverse iso projection (world → tile).
      const tx = worldX / halfW + worldY / halfH;
      const ty = worldY / halfH - worldX / halfW;
      const clampedTx = Math.max(0, Math.min(W - 1, Math.floor(tx / 2)));
      const clampedTy = Math.max(0, Math.min(H - 1, Math.floor(ty / 2)));
      onJumpTo(clampedTx, clampedTy);
    });
  }

  update(deltaMs: number): void {
    this.elapsedSinceBuildMs += deltaMs;
    if (this.elapsedSinceBuildMs >= REBUILD_INTERVAL_MS) {
      this.rebuild();
      this.elapsedSinceBuildMs = 0;
    }
    this.updateViewport();
  }

  private worldToMini(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.minWorldX) * this.scale + this.offsetX,
      y: (sy - this.minWorldY) * this.scale + this.offsetY,
    };
  }

  private rebuild(): void {
    this.rt.clear();
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;
    const tileSize = Math.max(1.2, this.scale * TILE_WIDTH);

    // Terrain — one colored pixel per tile projected in iso.
    for (let ty = 0; ty < this.mapData.height; ty++) {
      for (let tx = 0; tx < this.mapData.width; tx++) {
        const terrain = this.mapData.getTile(tx, ty);
        const sx = (tx - ty) * halfW;
        const sy = (tx + ty) * halfH;
        const p = this.worldToMini(sx, sy);
        this.rt.fillStyle(TERRAIN_COLOR[terrain], 1);
        this.rt.fillRect(p.x, p.y, tileSize, tileSize);
      }
    }

    // Buildings — larger dot.
    for (const entity of this.world.with('building', 'owner', 'position') as Iterable<Entity>) {
      if (!entity.position || !entity.owner || !entity.building) continue;
      const bx = entity.position.tx + (entity.building.footprint.width - 1) / 2;
      const by = entity.position.ty + (entity.building.footprint.height - 1) / 2;
      const sx = (bx - by) * halfW;
      const sy = (bx + by) * halfH;
      const p = this.worldToMini(sx, sy);
      const c = PLAYER_COLORS[(entity.owner.playerId - 1) % PLAYER_COLORS.length] ?? 0xffffff;
      this.rt.fillStyle(c, 1);
      const size = Math.max(4, tileSize * 2);
      this.rt.fillRect(p.x - size / 2 + tileSize / 2, p.y - size / 2 + tileSize / 2, size, size);
    }

    // Units — small dot.
    for (const entity of this.world.with('unit', 'owner', 'position') as Iterable<Entity>) {
      if (!entity.position || !entity.owner) continue;
      const { tx, ty } = entity.position;
      const sx = (tx - ty) * halfW;
      const sy = (tx + ty) * halfH;
      const p = this.worldToMini(sx, sy);
      const c = PLAYER_COLORS[(entity.owner.playerId - 1) % PLAYER_COLORS.length] ?? 0xffffff;
      this.rt.fillStyle(c, 1);
      const size = Math.max(2.5, tileSize);
      this.rt.fillRect(p.x, p.y, size, size);
    }
  }

  private updateViewport(): void {
    const cam = this.gameCamera;
    const zoom = cam.zoom;
    const viewW = cam.width / zoom;
    const viewH = cam.height / zoom;
    const p0 = this.worldToMini(cam.scrollX, cam.scrollY);
    const w = viewW * this.scale;
    const h = viewH * this.scale;
    const clampedX = Math.max(0, Math.min(MINIMAP_SIZE - 4, p0.x));
    const clampedY = Math.max(0, Math.min(MINIMAP_SIZE - 4, p0.y));
    const clampedW = Math.min(MINIMAP_SIZE - clampedX, Math.max(4, w));
    const clampedH = Math.min(MINIMAP_SIZE - clampedY, Math.max(4, h));
    this.viewportRect.setPosition(this.x + clampedX, this.y + clampedY);
    this.viewportRect.setSize(clampedW, clampedH);
  }

  destroy(): void {
    this.frame.destroy();
    this.rt.destroy();
    this.viewportRect.destroy();
  }
}
