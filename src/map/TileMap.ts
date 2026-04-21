import Phaser from 'phaser';
import { TILE_HEIGHT, TILE_WIDTH } from '../config/constants';
import { tileToScreen, type TileCoord } from '../iso/coordinates';
import { tileDepth } from '../iso/depth';
import type { MapData } from './MapData';
import { TERRAIN_TEXTURE_KEYS } from './TerrainTypes';
import { FOG_UNEXPLORED, type FogOfWarData } from './FogOfWarData';

const HIGHLIGHT_DEPTH_OFFSET = 0.5;
const TERRAIN_DEPTH = -1000;
const FOG_DEPTH = 10_000;

/**
 * Renders terrain tiles from a MapData in isometric projection.
 *
 * Terrain is baked once into a RenderTexture on build — a single
 * scene object regardless of map size. refreshTile(tx, ty) repaints
 * one cell (used when a resource tile gets depleted).
 *
 * Fog of war uses a single Phaser.GameObjects.Graphics that we clear
 * + refill on every FogOfWarSystem scan (≤4×/sec). fillRect is cheap;
 * the whole fog overlay is still a single scene object.
 */
export class TileMap {
  public readonly width: number;
  public readonly height: number;

  private readonly scene: Phaser.Scene;
  private readonly mapData: MapData;
  private readonly terrainRt: Phaser.GameObjects.RenderTexture;
  private readonly fogGfx: Phaser.GameObjects.Graphics;
  private readonly originOffsetX: number;
  private readonly originOffsetY: number;
  private lastFogRevision = -1;
  private highlight: Phaser.GameObjects.Graphics | null = null;
  private selection: Phaser.GameObjects.Graphics | null = null;
  private eraseStamp: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, mapData: MapData) {
    this.scene = scene;
    this.mapData = mapData;
    this.width = mapData.width;
    this.height = mapData.height;

    const bounds = this.computeWorldBounds();
    const padding = TILE_WIDTH;
    const rtWidth = bounds.maxX - bounds.minX + TILE_WIDTH + padding * 2;
    const rtHeight = bounds.maxY - bounds.minY + TILE_HEIGHT + padding * 2;
    this.originOffsetX = -bounds.minX + TILE_WIDTH / 2 + padding;
    this.originOffsetY = -bounds.minY + TILE_HEIGHT / 2 + padding;

    this.terrainRt = scene.add
      .renderTexture(bounds.minX - padding, bounds.minY - padding, rtWidth, rtHeight)
      .setOrigin(0, 0)
      .setDepth(TERRAIN_DEPTH);

    this.fogGfx = scene.add.graphics();
    this.fogGfx.setDepth(FOG_DEPTH);

    this.bakeTerrain();
  }

  private bakeTerrain(): void {
    this.terrainRt.clear();
    this.mapData.forEachTile(({ tx, ty }, terrain) => {
      const { sx, sy } = tileToScreen({ tx, ty });
      this.terrainRt.drawFrame(
        TERRAIN_TEXTURE_KEYS[terrain],
        undefined,
        sx + this.originOffsetX - TILE_WIDTH / 2,
        sy + this.originOffsetY - TILE_HEIGHT / 2,
      );
    });
  }

  /** Re-reads terrain for a single tile from MapData and repaints it. */
  refreshTile(tx: number, ty: number): void {
    const terrain = this.mapData.getTile(tx, ty);
    const { sx, sy } = tileToScreen({ tx, ty });
    const x = sx + this.originOffsetX - TILE_WIDTH / 2;
    const y = sy + this.originOffsetY - TILE_HEIGHT / 2;
    this.terrainRt.erase(this.makeEraseRect(), x, y);
    this.terrainRt.drawFrame(TERRAIN_TEXTURE_KEYS[terrain], undefined, x, y);
  }

  private makeEraseRect(): Phaser.GameObjects.Graphics {
    if (!this.eraseStamp) {
      const g = this.scene.add.graphics().setVisible(false);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, TILE_WIDTH, TILE_HEIGHT);
      this.eraseStamp = g;
    }
    return this.eraseStamp;
  }

  /**
   * Repaints the fog layer when the scanner bumps revision (every
   * 250 ms). Single Graphics + batched fillRect calls — a lot cheaper
   * than thousands of RenderTexture.draw() invocations.
   */
  applyFog(fog: FogOfWarData): void {
    if (this.lastFogRevision === fog.revision && this.lastFogRevision !== -1) {
      return;
    }
    const raw = fog.raw();
    this.fogGfx.clear();

    // Batch by state so we only flip fillStyle twice instead of per-tile.
    this.fogGfx.fillStyle(0x000000, 1);
    for (let ty = 0; ty < fog.height; ty++) {
      for (let tx = 0; tx < fog.width; tx++) {
        if (raw[ty * fog.width + tx] !== FOG_UNEXPLORED) continue;
        const { sx, sy } = tileToScreen({ tx, ty });
        this.fogGfx.fillRect(sx - TILE_WIDTH / 2, sy - TILE_HEIGHT / 2, TILE_WIDTH, TILE_HEIGHT);
      }
    }
    this.fogGfx.fillStyle(0x000000, 0.55);
    for (let ty = 0; ty < fog.height; ty++) {
      for (let tx = 0; tx < fog.width; tx++) {
        if (raw[ty * fog.width + tx] !== 1) continue;
        const { sx, sy } = tileToScreen({ tx, ty });
        this.fogGfx.fillRect(sx - TILE_WIDTH / 2, sy - TILE_HEIGHT / 2, TILE_WIDTH, TILE_HEIGHT);
      }
    }
    this.lastFogRevision = fog.revision;
  }

  setHoverTile(tile: TileCoord | null): void {
    if (!tile) {
      this.highlight?.setVisible(false);
      return;
    }
    if (!this.highlight) {
      this.highlight = this.drawDiamondOutline(0xffe066, 0.95);
    }
    this.placeOverlay(this.highlight, tile);
  }

  setSelectedTile(tile: TileCoord | null): void {
    if (!tile) {
      this.selection?.setVisible(false);
      return;
    }
    if (!this.selection) {
      this.selection = this.drawDiamondOutline(0xffffff, 1);
    }
    this.placeOverlay(this.selection, tile);
  }

  /** World-coord bounds (sx_min, sy_min, sx_max, sy_max). */
  getWorldBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    return this.computeWorldBounds();
  }

  private computeWorldBounds(): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    const corners = [
      tileToScreen({ tx: 0, ty: 0 }),
      tileToScreen({ tx: this.width - 1, ty: 0 }),
      tileToScreen({ tx: 0, ty: this.height - 1 }),
      tileToScreen({ tx: this.width - 1, ty: this.height - 1 }),
    ];
    const xs = corners.map((c) => c.sx);
    const ys = corners.map((c) => c.sy);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  }

  private placeOverlay(
    overlay: Phaser.GameObjects.Graphics,
    tile: TileCoord,
  ): void {
    const { sx, sy } = tileToScreen(tile);
    overlay.setPosition(sx, sy);
    overlay.setDepth(tileDepth(tile) + HIGHLIGHT_DEPTH_OFFSET);
    overlay.setVisible(true);
  }

  private drawDiamondOutline(
    color: number,
    alpha: number,
  ): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.lineStyle(2, color, alpha);
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    g.beginPath();
    g.moveTo(0, -hh);
    g.lineTo(hw, 0);
    g.lineTo(0, hh);
    g.lineTo(-hw, 0);
    g.closePath();
    g.strokePath();
    g.setVisible(false);
    return g;
  }

  destroy(): void {
    this.terrainRt.destroy();
    this.fogGfx.destroy();
    this.highlight?.destroy();
    this.selection?.destroy();
    this.eraseStamp?.destroy();
  }
}
