import Phaser from 'phaser';
import { TILE_HEIGHT, TILE_WIDTH } from '../config/constants';
import { tileToScreen, type TileCoord } from '../iso/coordinates';
import { tileDepth } from '../iso/depth';
import type { MapData } from './MapData';
import { TERRAIN_TEXTURE_KEYS } from './TerrainTypes';
import { FOG_UNEXPLORED, FOG_EXPLORED, type FogOfWarData } from './FogOfWarData';

const HIGHLIGHT_DEPTH_OFFSET = 0.5;

/**
 * Renders terrain tiles from a MapData in isometric projection and
 * owns the hover / selection overlays.
 */
export class TileMap {
  public readonly width: number;
  public readonly height: number;

  private readonly scene: Phaser.Scene;
  private readonly layer: Phaser.GameObjects.Layer;
  private readonly mapData: MapData;
  private readonly tileSprites: Phaser.GameObjects.Image[] = [];
  private readonly fogOverlays: Phaser.GameObjects.Rectangle[] = [];
  private lastFogRevision = -1;
  private highlight: Phaser.GameObjects.Graphics | null = null;
  private selection: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, mapData: MapData) {
    this.scene = scene;
    this.mapData = mapData;
    this.width = mapData.width;
    this.height = mapData.height;
    this.layer = scene.add.layer();
    this.build();
  }

  private build(): void {
    this.mapData.forEachTile(({ tx, ty }, terrain) => {
      const { sx, sy } = tileToScreen({ tx, ty });
      const sprite = this.scene.add
        .image(sx, sy, TERRAIN_TEXTURE_KEYS[terrain])
        .setOrigin(0.5, 0.5)
        .setDepth(tileDepth({ tx, ty }));
      this.layer.add(sprite);
      this.tileSprites[ty * this.width + tx] = sprite;
    });
  }

  /**
   * Lazily allocate + position fog overlays. Called once the fog data
   * is available. Each overlay is a filled diamond via Rectangle +
   * scaled transform, but a simple alpha Rectangle is fine at M2 —
   * it covers a bit of the neighbour, which visually reads as fog.
   */
  private ensureFogOverlays(fog: FogOfWarData): void {
    if (this.fogOverlays.length > 0) return;
    for (let ty = 0; ty < fog.height; ty++) {
      for (let tx = 0; tx < fog.width; tx++) {
        const { sx, sy } = tileToScreen({ tx, ty });
        const rect = this.scene.add
          .rectangle(sx, sy, TILE_WIDTH, TILE_HEIGHT, 0x000000, 1)
          .setOrigin(0.5, 0.5)
          .setDepth(tileDepth({ tx, ty }) + 0.9);
        this.layer.add(rect);
        this.fogOverlays[ty * fog.width + tx] = rect;
      }
    }
  }

  /**
   * Called each tick. Redraws overlays only for tiles whose fog
   * state changed since the last revision.
   */
  applyFog(fog: FogOfWarData): void {
    this.ensureFogOverlays(fog);
    if (this.lastFogRevision === fog.revision && fog.dirtyTiles.size === 0) return;
    // First frame: redraw all tiles.
    const tiles = this.lastFogRevision === -1
      ? indices(fog.width * fog.height)
      : fog.dirtyTiles;
    for (const idx of tiles) {
      const overlay = this.fogOverlays[idx];
      if (!overlay) continue;
      const state = fog.raw()[idx]!;
      if (state === FOG_UNEXPLORED) {
        overlay.setAlpha(1);
        overlay.setFillStyle(0x000000);
      } else if (state === FOG_EXPLORED) {
        overlay.setAlpha(0.55);
        overlay.setFillStyle(0x000000);
      } else {
        overlay.setAlpha(0);
      }
    }
    fog.clearDirty();
    this.lastFogRevision = fog.revision;
  }

  /** Re-reads terrain for a single tile from MapData and updates the sprite. */
  refreshTile(tx: number, ty: number): void {
    const idx = ty * this.width + tx;
    const sprite = this.tileSprites[idx];
    if (!sprite) return;
    const terrain = this.mapData.getTile(tx, ty);
    sprite.setTexture(TERRAIN_TEXTURE_KEYS[terrain]);
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
    this.layer.destroy();
  }
}

function* indices(n: number): IterableIterator<number> {
  for (let i = 0; i < n; i++) yield i;
}
