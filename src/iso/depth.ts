import type { TileCoord } from './coordinates';

/**
 * Rajzolási mélység egy csempén. Nagyobb érték = előrébb.
 * Izometrikus nézetben a hátrébb lévő csempéket rajzoljuk először.
 */
export function tileDepth(t: TileCoord): number {
  return t.tx + t.ty;
}

/**
 * Többmezős épület depth-je: a legelőrébb lévő csempe.
 */
export function footprintDepth(
  origin: TileCoord,
  width: number,
  height: number,
): number {
  return origin.tx + width - 1 + (origin.ty + height - 1);
}
