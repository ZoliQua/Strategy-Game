/**
 * Mulberry32: a compact, deterministic 32-bit PRNG. Seed fully
 * determines the sequence, which matches the "same seed → same map"
 * requirement (PROGRAM_TERV.md 11.6).
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(
  rng: () => number,
  minInclusive: number,
  maxExclusive: number,
): number {
  return minInclusive + Math.floor(rng() * (maxExclusive - minInclusive));
}

export function randRange(
  rng: () => number,
  min: number,
  max: number,
): number {
  return min + rng() * (max - min);
}
