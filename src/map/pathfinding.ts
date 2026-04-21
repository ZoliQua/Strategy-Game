import PF from 'pathfinding';
import type { TileCoord } from '../iso/coordinates';
import type { MapData } from './MapData';

/**
 * A* wrapper over the `pathfinding` library. Converts MapData into a
 * PF.Grid (walkable = isPassable) once per call; for M1 this is
 * acceptable, but in M2+ we'll cache the grid and invalidate on
 * terrain/building changes.
 *
 * Returns the full path including both endpoints, or `null` if no
 * path exists. Start and goal are always considered walkable to let
 * units step onto e.g. a resource drop-off; the caller is responsible
 * for interpreting "standing on a workable tile" vs actually entering
 * it.
 */
export function findPath(
  map: MapData,
  start: TileCoord,
  goal: TileCoord,
): TileCoord[] | null {
  if (start.tx === goal.tx && start.ty === goal.ty) return [start];

  const grid = buildGrid(map);
  grid.setWalkableAt(start.tx, start.ty, true);
  grid.setWalkableAt(goal.tx, goal.ty, true);

  const finder = new PF.AStarFinder({
    diagonalMovement: PF.DiagonalMovement.OnlyWhenNoObstacles,
  });
  const raw = finder.findPath(start.tx, start.ty, goal.tx, goal.ty, grid);
  if (raw.length === 0) return null;
  return raw.map(([tx, ty]) => ({ tx: tx as number, ty: ty as number }));
}

function buildGrid(map: MapData): PF.Grid {
  const grid = new PF.Grid(map.width, map.height);
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      grid.setWalkableAt(tx, ty, map.isPassable(tx, ty));
    }
  }
  return grid;
}
