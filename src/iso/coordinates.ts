import { TILE_HEIGHT, TILE_WIDTH } from '../config/constants';

export interface TileCoord {
  readonly tx: number;
  readonly ty: number;
}

export interface ScreenCoord {
  readonly sx: number;
  readonly sy: number;
}

const HALF_W = TILE_WIDTH / 2;
const HALF_H = TILE_HEIGHT / 2;

export function tileToScreen(t: TileCoord): ScreenCoord {
  return {
    sx: (t.tx - t.ty) * HALF_W,
    sy: (t.tx + t.ty) * HALF_H,
  };
}

export function screenToTile(s: ScreenCoord): TileCoord {
  const tx = s.sx / HALF_W + s.sy / HALF_H;
  const ty = s.sy / HALF_H - s.sx / HALF_W;
  return { tx: tx / 2, ty: ty / 2 };
}

export function screenToTileFloor(s: ScreenCoord): TileCoord {
  const t = screenToTile(s);
  return { tx: Math.floor(t.tx), ty: Math.floor(t.ty) };
}

export function tileEquals(a: TileCoord, b: TileCoord): boolean {
  return a.tx === b.tx && a.ty === b.ty;
}

export function isInsideMap(
  t: TileCoord,
  width: number,
  height: number,
): boolean {
  return t.tx >= 0 && t.ty >= 0 && t.tx < width && t.ty < height;
}
