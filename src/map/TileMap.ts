import Phaser from 'phaser';
import { tileToScreen } from '../iso/coordinates';
import { tileDepth } from '../iso/depth';

export const TERRAIN_TEXTURE = 'terrain_grass';

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

  constructor(scene: Phaser.Scene, options: TileMapOptions) {
    this.scene = scene;
    this.width = options.width;
    this.height = options.height;
    this.layer = scene.add.layer();
    this.build();
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
