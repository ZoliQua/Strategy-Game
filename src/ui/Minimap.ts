import Phaser from 'phaser';
import { TERRAIN, type TerrainId } from '../map/TerrainTypes';
import type { Entity } from '../ecs/components';
import type { EcsWorld } from '../ecs/world';
import type { MapData } from '../map/MapData';
import { PLAYER_COLORS } from '../game/Player';

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
 * 200×200 overview pinned to the bottom-right. Renders terrain once,
 * then re-projects building / unit positions every 500ms. Clicking
 * on the minimap centers the main camera on the corresponding tile.
 */
export class Minimap {
  private readonly rt: Phaser.GameObjects.Graphics;
  private readonly viewportRect: Phaser.GameObjects.Rectangle;
  private readonly cellSize: number;
  private elapsedSinceBuildMs = Number.MAX_SAFE_INTEGER;

  constructor(
    scene: Phaser.Scene,
    private readonly world: EcsWorld,
    private readonly mapData: MapData,
    private readonly gameCamera: Phaser.Cameras.Scene2D.Camera,
    onJumpTo: (tx: number, ty: number) => void,
  ) {
    this.cellSize = MINIMAP_SIZE / mapData.width;
    const x = scene.scale.width - MINIMAP_SIZE - 16;
    const y = 16 + 48; // below the top bar

    const frame = scene.add
      .rectangle(x, y, MINIMAP_SIZE, MINIMAP_SIZE, 0x000000, 0.8)
      .setStrokeStyle(1, 0x4a5565)
      .setOrigin(0, 0);
    frame.setScrollFactor(0);
    frame.setDepth(10_000);

    this.rt = scene.add.graphics();
    this.rt.setScrollFactor(0);
    this.rt.setDepth(10_001);
    this.rt.setPosition(x, y);

    this.viewportRect = scene.add
      .rectangle(x, y, 20, 20, 0, 0)
      .setStrokeStyle(1, 0xffffff, 0.85)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(10_002);

    frame.setInteractive({ useHandCursor: true });
    frame.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const localX = p.x - x;
      const localY = p.y - y;
      const tx = Math.floor(localX / this.cellSize);
      const ty = Math.floor(localY / this.cellSize);
      if (tx < 0 || ty < 0 || tx >= mapData.width || ty >= mapData.height) return;
      onJumpTo(tx, ty);
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

  private rebuild(): void {
    this.rt.clear();
    const cell = this.cellSize;
    // Terrain.
    for (let ty = 0; ty < this.mapData.height; ty++) {
      for (let tx = 0; tx < this.mapData.width; tx++) {
        const terrain = this.mapData.getTile(tx, ty);
        this.rt.fillStyle(TERRAIN_COLOR[terrain], 1);
        this.rt.fillRect(tx * cell, ty * cell, cell + 0.5, cell + 0.5);
      }
    }
    // Buildings (bigger dots).
    for (const entity of this.world.with('building', 'owner', 'position') as Iterable<Entity>) {
      if (!entity.position || !entity.owner || !entity.building) continue;
      const c = PLAYER_COLORS[(entity.owner.playerId - 1) % PLAYER_COLORS.length] ?? 0xffffff;
      this.rt.fillStyle(c, 1);
      const w = entity.building.footprint.width * cell + 1;
      const h = entity.building.footprint.height * cell + 1;
      this.rt.fillRect(entity.position.tx * cell, entity.position.ty * cell, w, h);
    }
    // Units.
    for (const entity of this.world.with('unit', 'owner', 'position') as Iterable<Entity>) {
      if (!entity.position || !entity.owner) continue;
      const c = PLAYER_COLORS[(entity.owner.playerId - 1) % PLAYER_COLORS.length] ?? 0xffffff;
      this.rt.fillStyle(c, 1);
      this.rt.fillRect(entity.position.tx * cell, entity.position.ty * cell, 2.5, 2.5);
    }
  }

  private updateViewport(): void {
    const cam = this.gameCamera;
    const zoom = cam.zoom;
    const viewWidthWorld = cam.width / zoom;
    const viewHeightWorld = cam.height / zoom;
    // Convert camera corners (world/screen coords) → tile approximations.
    const corner = { sx: cam.scrollX, sy: cam.scrollY };
    const center = {
      sx: corner.sx + viewWidthWorld / 2,
      sy: corner.sy + viewHeightWorld / 2,
    };
    const tx = center.sx / 32 + center.sy / 16;
    const ty = center.sy / 16 - center.sx / 32;
    const centerTx = tx / 2;
    const centerTy = ty / 2;

    const cell = this.cellSize;
    const viewW = Math.max(2, Math.min(MINIMAP_SIZE, (viewWidthWorld / 32) * cell));
    const viewH = Math.max(2, Math.min(MINIMAP_SIZE, (viewHeightWorld / 16) * cell));
    const baseX = this.rt.x;
    const baseY = this.rt.y;
    this.viewportRect.setPosition(
      baseX + Math.max(0, centerTx * cell - viewW / 2),
      baseY + Math.max(0, centerTy * cell - viewH / 2),
    );
    this.viewportRect.setSize(viewW, viewH);
  }

  destroy(): void {
    this.rt.destroy();
    this.viewportRect.destroy();
  }
}
