import Phaser from 'phaser';
import {
  isInsideMap,
  screenToTileFloor,
  type TileCoord,
} from './coordinates';

/**
 * Converts a pointer position (in screen/page coords) into the tile the
 * cursor currently hovers. Returns `null` if outside the given map
 * bounds. Uses the camera's world-point conversion so panning and
 * zooming are handled correctly.
 */
export function pickTile(
  pointerX: number,
  pointerY: number,
  camera: Phaser.Cameras.Scene2D.Camera,
  mapWidth: number,
  mapHeight: number,
): TileCoord | null {
  const worldPoint = camera.getWorldPoint(pointerX, pointerY);
  const tile = screenToTileFloor({ sx: worldPoint.x, sy: worldPoint.y });
  return isInsideMap(tile, mapWidth, mapHeight) ? tile : null;
}
