import type { TileCoord } from '../iso/coordinates';
import { isInsideMap } from '../iso/coordinates';
import { isPassable, TERRAIN, type TerrainId } from './TerrainTypes';

/**
 * Flat 2D grid of terrain ids. Tile `(tx, ty)` lives at
 * `tiles[ty * width + tx]`. `tiles` is a `Uint8Array` so the whole
 * map serialises cheaply into save files (CLAUDE.md 5.4).
 */
export class MapData {
  public readonly width: number;
  public readonly height: number;
  private readonly tiles: Uint8Array;

  constructor(width: number, height: number, fill: TerrainId = TERRAIN.grass) {
    this.width = width;
    this.height = height;
    this.tiles = new Uint8Array(width * height);
    if (fill !== 0) this.tiles.fill(fill);
  }

  getTile(tx: number, ty: number): TerrainId {
    if (!isInsideMap({ tx, ty }, this.width, this.height)) {
      throw new RangeError(
        `Tile (${tx}, ${ty}) is outside map ${this.width}x${this.height}`,
      );
    }
    return this.tiles[ty * this.width + tx] as TerrainId;
  }

  setTile(tx: number, ty: number, terrain: TerrainId): void {
    if (!isInsideMap({ tx, ty }, this.width, this.height)) {
      throw new RangeError(
        `Tile (${tx}, ${ty}) is outside map ${this.width}x${this.height}`,
      );
    }
    this.tiles[ty * this.width + tx] = terrain;
  }

  isPassable(tx: number, ty: number): boolean {
    if (!isInsideMap({ tx, ty }, this.width, this.height)) return false;
    return isPassable(this.tiles[ty * this.width + tx] as TerrainId);
  }

  /** Raw backing array, intended for renderers and save serialisation. */
  getRawTiles(): Readonly<Uint8Array> {
    return this.tiles;
  }

  forEachTile(
    fn: (tile: TileCoord, terrain: TerrainId) => void,
  ): void {
    for (let ty = 0; ty < this.height; ty++) {
      for (let tx = 0; tx < this.width; tx++) {
        fn({ tx, ty }, this.tiles[ty * this.width + tx] as TerrainId);
      }
    }
  }
}
