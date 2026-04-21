export const FOG_UNEXPLORED = 0;
export const FOG_EXPLORED = 1;
export const FOG_VISIBLE = 2;

export type FogState = 0 | 1 | 2;

/**
 * Per-tile fog state for a single player. Uint8Array-backed so a
 * 128x128 map is 16 KB and serialises cheaply into save files.
 */
export class FogOfWarData {
  public readonly width: number;
  public readonly height: number;
  private readonly states: Uint8Array;
  public readonly dirtyTiles = new Set<number>();
  public revision = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.states = new Uint8Array(width * height);
  }

  get(tx: number, ty: number): FogState {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) {
      return FOG_UNEXPLORED as FogState;
    }
    return this.states[ty * this.width + tx] as FogState;
  }

  isVisible(tx: number, ty: number): boolean {
    return this.get(tx, ty) === FOG_VISIBLE;
  }

  /** Drops visible tiles back to explored before the next scan. */
  dimVisibleToExplored(): void {
    for (let i = 0; i < this.states.length; i++) {
      if (this.states[i] === FOG_VISIBLE) {
        this.states[i] = FOG_EXPLORED;
        this.dirtyTiles.add(i);
      }
    }
  }

  markVisible(tx: number, ty: number): void {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return;
    const idx = ty * this.width + tx;
    if (this.states[idx] === FOG_VISIBLE) return;
    this.states[idx] = FOG_VISIBLE;
    this.dirtyTiles.add(idx);
  }

  clearDirty(): void {
    this.dirtyTiles.clear();
    this.revision++;
  }

  /** Expose raw buffer for save-file serialisation. */
  raw(): Readonly<Uint8Array> {
    return this.states;
  }
}
