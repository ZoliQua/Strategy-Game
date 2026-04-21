import { describe, expect, it } from 'vitest';
import {
  isInsideMap,
  screenToTile,
  screenToTileFloor,
  tileEquals,
  tileToScreen,
} from './coordinates';

describe('tileToScreen', () => {
  it('maps origin to origin', () => {
    expect(tileToScreen({ tx: 0, ty: 0 })).toEqual({ sx: 0, sy: 0 });
  });

  it('maps (1,0) to (32,16)', () => {
    expect(tileToScreen({ tx: 1, ty: 0 })).toEqual({ sx: 32, sy: 16 });
  });

  it('maps (0,1) to (-32,16)', () => {
    expect(tileToScreen({ tx: 0, ty: 1 })).toEqual({ sx: -32, sy: 16 });
  });

  it('maps (1,1) to (0,32)', () => {
    expect(tileToScreen({ tx: 1, ty: 1 })).toEqual({ sx: 0, sy: 32 });
  });

  it('maps (2,0) to (64,32)', () => {
    expect(tileToScreen({ tx: 2, ty: 0 })).toEqual({ sx: 64, sy: 32 });
  });

  it('handles negative coords', () => {
    expect(tileToScreen({ tx: -1, ty: 0 })).toEqual({ sx: -32, sy: -16 });
    expect(tileToScreen({ tx: 0, ty: -1 })).toEqual({ sx: 32, sy: -16 });
  });
});

describe('screenToTile', () => {
  it('maps origin back to origin', () => {
    expect(screenToTile({ sx: 0, sy: 0 })).toEqual({ tx: 0, ty: 0 });
  });

  it('maps (32,16) back to (1,0)', () => {
    const t = screenToTile({ sx: 32, sy: 16 });
    expect(t.tx).toBeCloseTo(1, 5);
    expect(t.ty).toBeCloseTo(0, 5);
  });

  it('maps (-32,16) back to (0,1)', () => {
    const t = screenToTile({ sx: -32, sy: 16 });
    expect(t.tx).toBeCloseTo(0, 5);
    expect(t.ty).toBeCloseTo(1, 5);
  });
});

describe('round-trip tile→screen→tile', () => {
  const cases: Array<[number, number]> = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [5, 7],
    [10, 10],
    [63, 63],
    [-3, 4],
    [-10, -10],
    [42, -17],
    [100, 0],
    [0, 100],
  ];
  for (const [tx, ty] of cases) {
    it(`preserves (${tx},${ty}) through round-trip`, () => {
      const s = tileToScreen({ tx, ty });
      const back = screenToTile(s);
      expect(back.tx).toBeCloseTo(tx, 5);
      expect(back.ty).toBeCloseTo(ty, 5);
    });
  }
});

describe('screenToTileFloor (diamond-accurate pick)', () => {
  it('exact tile centre picks that tile', () => {
    const s = tileToScreen({ tx: 2, ty: 3 });
    expect(screenToTileFloor(s)).toEqual({ tx: 2, ty: 3 });
  });

  it('small offsets from centre stay on the same tile', () => {
    const s = tileToScreen({ tx: 2, ty: 3 });
    expect(screenToTileFloor({ sx: s.sx + 4, sy: s.sy + 2 })).toEqual({ tx: 2, ty: 3 });
    expect(screenToTileFloor({ sx: s.sx - 4, sy: s.sy - 2 })).toEqual({ tx: 2, ty: 3 });
  });

  it('origin maps to (0,0)', () => {
    expect(screenToTileFloor({ sx: 0, sy: 0 })).toEqual({ tx: 0, ty: 0 });
  });

  it('a point inside tile (0,0) near its right edge still snaps to (0,0)', () => {
    // (20, 5) lies inside tile (0,0)'s diamond (|20|/32 + |5|/16 = 0.94).
    // Flooring the fractional tile coord used to misidentify this as
    // (0, -1) — diamond-accurate picking returns (0, 0).
    expect(screenToTileFloor({ sx: 20, sy: 5 })).toEqual({ tx: 0, ty: 0 });
  });

  it('handles negative tiles', () => {
    const s = tileToScreen({ tx: -1, ty: -1 });
    expect(screenToTileFloor(s)).toEqual({ tx: -1, ty: -1 });
  });
});

describe('tileEquals', () => {
  it('equal tiles', () => {
    expect(tileEquals({ tx: 3, ty: 4 }, { tx: 3, ty: 4 })).toBe(true);
  });
  it('unequal tiles', () => {
    expect(tileEquals({ tx: 3, ty: 4 }, { tx: 4, ty: 3 })).toBe(false);
  });
});

describe('isInsideMap', () => {
  it('includes min corner', () => {
    expect(isInsideMap({ tx: 0, ty: 0 }, 64, 64)).toBe(true);
  });
  it('excludes max corner', () => {
    expect(isInsideMap({ tx: 64, ty: 0 }, 64, 64)).toBe(false);
    expect(isInsideMap({ tx: 0, ty: 64 }, 64, 64)).toBe(false);
  });
  it('excludes negatives', () => {
    expect(isInsideMap({ tx: -1, ty: 0 }, 64, 64)).toBe(false);
  });
});
