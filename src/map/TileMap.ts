import Phaser from 'phaser';
import { TILE_HEIGHT, TILE_WIDTH } from '../config/constants';
import { tileToScreen, type TileCoord } from '../iso/coordinates';
import { tileDepth } from '../iso/depth';

export const TERRAIN_TEXTURE = 'terrain_grass';
const HIGHLIGHT_DEPTH_OFFSET = 0.5;

export interface TileMapOptions {
  readonly width: number;
  readonly height: number;
}

/**
 * Renders a flat grid of grass tiles in isometric projection.
 * M0 placeholder — terrain types and variation land in M1.
 */
export class TileMap {
  public readonly width: number;
  public readonly height: number;

  private readonly scene: Phaser.Scene;
  private readonly layer: Phaser.GameObjects.Layer;
  private highlight: Phaser.GameObjects.Graphics | null = null;
  private selection: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, options: TileMapOptions) {
    this.scene = scene;
    this.width = options.width;
    this.height = options.height;
    this.layer = scene.add.layer();
    this.build();
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

  private build(): void {
    for (let ty = 0; ty < this.height; ty++) {
      for (let tx = 0; tx < this.width; tx++) {
        const { sx, sy } = tileToScreen({ tx, ty });
        const sprite = this.scene.add
          .image(sx, sy, TERRAIN_TEXTURE)
          .setOrigin(0.5, 0.5)
          .setDepth(tileDepth({ tx, ty }));
        this.layer.add(sprite);
      }
    }
  }

  /** World-coord bounds (sx_min, sy_min, sx_max, sy_max). Useful for camera clamp. */
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

  destroy(): void {
    this.layer.destroy();
  }
}
