import { describe, expect, it } from 'vitest';
import { isInsideMap, screenToTileFloor } from './coordinates';

/**
 * `pickTile` is a thin wrapper over `camera.getWorldPoint` +
 * `screenToTileFloor` + `isInsideMap`. Phaser's camera math is covered
 * by Phaser's own tests, so here we exercise the pure-math pipeline
 * that we own.
 */

interface FakeCamera {
  scrollX: number;
  scrollY: number;
  zoom: number;
}

function toWorld(
  pointerX: number,
  pointerY: number,
  cam: FakeCamera,
): { x: number; y: number } {
  return {
    x: cam.scrollX + pointerX / cam.zoom,
    y: cam.scrollY + pointerY / cam.zoom,
  };
}

function pick(
  pointerX: number,
  pointerY: number,
  cam: FakeCamera,
  w: number,
  h: number,
) {
  const wp = toWorld(pointerX, pointerY, cam);
  const tile = screenToTileFloor({ sx: wp.x, sy: wp.y });
  return isInsideMap(tile, w, h) ? tile : null;
}

describe('pickTile pipeline', () => {
  it('picks (0,0) when pointer is on origin tile, no scroll', () => {
    expect(pick(0, 0, { scrollX: 0, scrollY: 0, zoom: 1 }, 64, 64)).toEqual({
      tx: 0,
      ty: 0,
    });
  });

  it('returns null for negative tiles', () => {
    expect(
      pick(-200, -200, { scrollX: 0, scrollY: 0, zoom: 1 }, 64, 64),
    ).toBeNull();
  });

  it('returns null for tiles past the edge', () => {
    expect(
      pick(0, 2200, { scrollX: 0, scrollY: 0, zoom: 1 }, 64, 64),
    ).toBeNull();
  });

  it('picks correctly after horizontal pan', () => {
    const tile = pick(
      640,
      360,
      { scrollX: -640, scrollY: 0, zoom: 1 },
      64,
      64,
    );
    expect(tile).toEqual({ tx: 11, ty: 11 });
  });

  it('picks correctly under zoom', () => {
    const tile = pick(
      640,
      360,
      { scrollX: 0, scrollY: 0, zoom: 2 },
      64,
      64,
    );
    expect(tile?.tx).toBeGreaterThanOrEqual(0);
    expect(tile?.ty).toBeGreaterThanOrEqual(0);
  });

  it('floors nearby points into the expected tile', () => {
    const cam = { scrollX: 0, scrollY: 0, zoom: 1 };
    // Points within the same floor-bucket of tile (1,0). Diamond-exact
    // picking is not a requirement at M0 — flooring is sufficient.
    const samples = [
      { sx: 33, sy: 17 },
      { sx: 40, sy: 24 },
      { sx: 36, sy: 20 },
    ];
    for (const c of samples) {
      expect(pick(c.sx, c.sy, cam, 64, 64)).toEqual({ tx: 1, ty: 0 });
    }
  });

  it('handles composite pan + zoom', () => {
    const tile = pick(
      100,
      100,
      { scrollX: 100, scrollY: 200, zoom: 1.5 },
      64,
      64,
    );
    expect(tile).not.toBeNull();
    expect(tile!.tx).toBeGreaterThanOrEqual(0);
    expect(tile!.ty).toBeGreaterThanOrEqual(0);
  });

  it('pick at world origin after big scroll → outside map', () => {
    expect(
      pick(
        10000,
        10000,
        { scrollX: 0, scrollY: 0, zoom: 1 },
        64,
        64,
      ),
    ).toBeNull();
  });

  it('picks a specific interior tile with pan', () => {
    const cam = { scrollX: -640, scrollY: 0, zoom: 1 };
    expect(pick(0, 0, cam, 64, 64)).toBeNull();
    expect(pick(640, 0, cam, 64, 64)).toEqual({ tx: 0, ty: 0 });
  });

  it('stays on the same tile across pointer jitter', () => {
    const cam = { scrollX: 0, scrollY: 0, zoom: 1 };
    const base = pick(100, 100, cam, 64, 64);
    expect(base).not.toBeNull();
    expect(pick(101, 100, cam, 64, 64)).toEqual(base);
    expect(pick(100, 101, cam, 64, 64)).toEqual(base);
  });
});
