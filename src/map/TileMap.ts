import Phaser from 'phaser';
import { TILE_HEIGHT, TILE_WIDTH } from '../config/constants';
import { tileToScreen, type TileCoord } from '../iso/coordinates';
import { tileDepth } from '../iso/depth';
import type { MapData } from './MapData';
import { TERRAIN_TEXTURE_KEYS } from './TerrainTypes';
import { FOG_UNEXPLORED, type FogOfWarData } from './FogOfWarData';

const FOG_VISIBLE_STATE = 2;

const HIGHLIGHT_DEPTH_OFFSET = 0.5;
const TERRAIN_DEPTH = -1000;
const FOG_DEPTH = 10_000;

/**
 * Renders terrain tiles from a MapData in isometric projection.
 *
 * Performance-wise we can't afford to keep thousands of live tile
 * objects on a 64x64+ map (Phaser re-sorts the scene list by depth
 * every frame). Instead we bake the whole terrain into a single
 * RenderTexture on build and redraw individual tiles into it on
 * demand via refreshTile(). Fog of war is rendered the same way.
 */
export class TileMap {
  public readonly width: number;
  public readonly height: number;

  private readonly scene: Phaser.Scene;
  private readonly mapData: MapData;
  private readonly terrainRt: Phaser.GameObjects.RenderTexture;
  private readonly fogRt: Phaser.GameObjects.RenderTexture;
  private readonly originOffsetX: number;
  private readonly originOffsetY: number;
  private lastFogRevision = -1;
  private highlight: Phaser.GameObjects.Graphics | null = null;
  private selection: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, mapData: MapData) {
    this.scene = scene;
    this.mapData = mapData;
    this.width = mapData.width;
    this.height = mapData.height;

    const bounds = this.computeWorldBounds();
    // Pad a bit so the edge diamonds don't clip.
    const padding = TILE_WIDTH;
    const rtWidth = bounds.maxX - bounds.minX + TILE_WIDTH + padding * 2;
    const rtHeight = bounds.maxY - bounds.minY + TILE_HEIGHT + padding * 2;
    this.originOffsetX = -bounds.minX + TILE_WIDTH / 2 + padding;
    this.originOffsetY = -bounds.minY + TILE_HEIGHT / 2 + padding;

    this.terrainRt = scene.add
      .renderTexture(bounds.minX - padding, bounds.minY - padding, rtWidth, rtHeight)
      .setOrigin(0, 0)
      .setDepth(TERRAIN_DEPTH);
    this.fogRt = scene.add
      .renderTexture(bounds.minX - padding, bounds.minY - padding, rtWidth, rtHeight)
      .setOrigin(0, 0)
      .setDepth(FOG_DEPTH);

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
    // Clear the tile area first (transparent) then draw the new one.
    this.terrainRt.erase(
      this.makeEraseRect(),
      x,
      y,
    );
    this.terrainRt.drawFrame(TERRAIN_TEXTURE_KEYS[terrain], undefined, x, y);
  }

  private eraseStamp: Phaser.GameObjects.Graphics | null = null;
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
   * Repaints the fog layer whenever the scanner bumps revision (every
   * 250 ms). Full clear + redraw is fine at this cadence and avoids
   * blend-mode complexity of partial erase+draw.
   */
  applyFog(fog: FogOfWarData): void {
    if (this.lastFogRevision === fog.revision) return;
    this.fogRt.clear();
    const raw = fog.raw();
    const full = this.fogQuad(1);
    const dim = this.fogQuad(0.55);
    for (let ty = 0; ty < fog.height; ty++) {
      for (let tx = 0; tx < fog.width; tx++) {
        const idx = ty * fog.width + tx;
        const state = raw[idx]!;
        if (state === FOG_VISIBLE_STATE) continue;
        const { sx, sy } = tileToScreen({ tx, ty });
        const x = sx + this.originOffsetX - TILE_WIDTH / 2;
        const y = sy + this.originOffsetY - TILE_HEIGHT / 2;
        this.fogRt.draw(state === FOG_UNEXPLORED ? full : dim, x, y);
      }
    }
    fog.clearDirty();
    this.lastFogRevision = fog.revision;
  }

  private cachedFogQuadFull: Phaser.GameObjects.Graphics | null = null;
  private cachedFogQuadDim: Phaser.GameObjects.Graphics | null = null;
  private fogQuad(alpha: number): Phaser.GameObjects.Graphics {
    if (alpha === 1) {
      if (!this.cachedFogQuadFull) {
        const g = this.scene.add.graphics().setVisible(false);
        g.fillStyle(0x000000, 1);
        g.fillRect(0, 0, TILE_WIDTH, TILE_HEIGHT);
        this.cachedFogQuadFull = g;
      }
      return this.cachedFogQuadFull;
    }
    if (!this.cachedFogQuadDim) {
      const g = this.scene.add.graphics().setVisible(false);
      g.fillStyle(0x000000, 0.55);
      g.fillRect(0, 0, TILE_WIDTH, TILE_HEIGHT);
      this.cachedFogQuadDim = g;
    }
    return this.cachedFogQuadDim;
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
    this.fogRt.destroy();
    this.highlight?.destroy();
    this.selection?.destroy();
    this.cachedFogQuadFull?.destroy();
    this.cachedFogQuadDim?.destroy();
    this.eraseStamp?.destroy();
  }
}
