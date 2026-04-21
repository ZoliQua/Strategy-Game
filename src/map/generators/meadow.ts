import type { TileCoord } from '../../iso/coordinates';
import { MapData } from '../MapData';
import { createRng, randInt } from '../random';
import { TERRAIN, type TerrainId } from '../TerrainTypes';

export interface MeadowOptions {
  readonly width: number;
  readonly height: number;
  readonly seed: number;
  readonly playerCount: number;
}

export interface GeneratedMap {
  readonly map: MapData;
  readonly playerStarts: readonly TileCoord[];
}

const MAX_PLAYER_SLOTS = 6;

/**
 * AoE2 "Arabia"-style map. 90% grass, forest clusters near the edges
 * and center, one gold lode + 4-6 berry bushes + a small forest next
 * to every player start.
 */
export function generateMeadow(options: MeadowOptions): GeneratedMap {
  const { width, height, seed, playerCount } = options;
  if (playerCount < 1 || playerCount > MAX_PLAYER_SLOTS) {
    throw new RangeError(
      `playerCount must be 1..${MAX_PLAYER_SLOTS}, got ${playerCount}`,
    );
  }

  const rng = createRng(seed);
  const map = new MapData(width, height, TERRAIN.grass);

  const playerStarts = placePlayerStarts(width, height, playerCount);
  const reservedByStart = buildReservedSet(playerStarts, 6);

  scatterForestClusters(map, rng, reservedByStart, 0.1);
  seedCenterGoodies(map, rng);

  for (const start of playerStarts) {
    placeStartingResources(map, rng, start);
  }

  return { map, playerStarts };
}

function placePlayerStarts(
  width: number,
  height: number,
  playerCount: number,
): TileCoord[] {
  const margin = 8;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - margin;
  const starts: TileCoord[] = [];
  for (let i = 0; i < playerCount; i++) {
    const angle = (i / playerCount) * Math.PI * 2 - Math.PI / 2;
    const tx = Math.round(cx + Math.cos(angle) * radius);
    const ty = Math.round(cy + Math.sin(angle) * radius);
    starts.push({ tx, ty });
  }
  return starts;
}

function buildReservedSet(
  starts: readonly TileCoord[],
  radius: number,
): (tx: number, ty: number) => boolean {
  return (tx, ty) => {
    for (const s of starts) {
      if (Math.abs(s.tx - tx) <= radius && Math.abs(s.ty - ty) <= radius) {
        return true;
      }
    }
    return false;
  };
}

function scatterForestClusters(
  map: MapData,
  rng: () => number,
  isReserved: (tx: number, ty: number) => boolean,
  targetDensity: number,
): void {
  const target = Math.floor(map.width * map.height * targetDensity);
  let placed = 0;
  const maxAttempts = target * 8;
  let attempts = 0;
  while (placed < target && attempts < maxAttempts) {
    attempts++;
    const cx = randInt(rng, 2, map.width - 2);
    const cy = randInt(rng, 2, map.height - 2);
    if (isReserved(cx, cy)) continue;
    const clusterSize = randInt(rng, 3, 9);
    for (let i = 0; i < clusterSize && placed < target; i++) {
      const dx = randInt(rng, -2, 3);
      const dy = randInt(rng, -2, 3);
      const tx = cx + dx;
      const ty = cy + dy;
      if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
      if (isReserved(tx, ty)) continue;
      if (map.getTile(tx, ty) !== TERRAIN.grass) continue;
      map.setTile(tx, ty, TERRAIN.forest);
      placed++;
    }
  }
}

function seedCenterGoodies(map: MapData, rng: () => number): void {
  const cx = Math.floor(map.width / 2);
  const cy = Math.floor(map.height / 2);
  const radius = 4;
  const goldCount = randInt(rng, 2, 4);
  for (let i = 0; i < goldCount; i++) {
    const tx = cx + randInt(rng, -radius, radius + 1);
    const ty = cy + randInt(rng, -radius, radius + 1);
    if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
    if (map.getTile(tx, ty) === TERRAIN.grass) {
      map.setTile(tx, ty, TERRAIN.gold_mine);
    }
  }
  for (let i = 0; i < 6; i++) {
    const tx = cx + randInt(rng, -radius - 1, radius + 2);
    const ty = cy + randInt(rng, -radius - 1, radius + 2);
    if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
    if (map.getTile(tx, ty) === TERRAIN.grass) {
      map.setTile(tx, ty, TERRAIN.forest);
    }
  }
}

function placeStartingResources(
  map: MapData,
  rng: () => number,
  start: TileCoord,
): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const tx = start.tx + dx;
      const ty = start.ty + dy;
      if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
      map.setTile(tx, ty, TERRAIN.grass);
    }
  }

  placeOneResource(map, rng, start, TERRAIN.gold_mine, 3, 5);

  const berryCount = randInt(rng, 4, 7);
  for (let i = 0; i < berryCount; i++) {
    placeOneResource(map, rng, start, TERRAIN.berries, 3, 5);
  }

  const treeCount = randInt(rng, 10, 16);
  for (let i = 0; i < treeCount; i++) {
    placeOneResource(map, rng, start, TERRAIN.forest, 4, 7);
  }
}

function placeOneResource(
  map: MapData,
  rng: () => number,
  start: TileCoord,
  terrain: TerrainId,
  minRadius: number,
  maxRadius: number,
): void {
  for (let attempt = 0; attempt < 24; attempt++) {
    const angle = rng() * Math.PI * 2;
    const radius = minRadius + rng() * (maxRadius - minRadius);
    const tx = Math.round(start.tx + Math.cos(angle) * radius);
    const ty = Math.round(start.ty + Math.sin(angle) * radius);
    if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
    if (map.getTile(tx, ty) !== TERRAIN.grass) continue;
    map.setTile(tx, ty, terrain);
    return;
  }
}
