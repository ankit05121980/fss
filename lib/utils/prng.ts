/**
 * Deterministic pseudo-random number generator utilities.
 *
 * `mulberry32` is a tiny, fast, well-distributed 32-bit PRNG. Seeding it with a
 * fixed value makes the entire generated dataset reproducible — a hard
 * requirement for the deterministic demo.
 */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer in [min, max] inclusive. */
export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Random float in [min, max). */
export function randFloat(rng: Rng, min: number, max: number): number {
  return rng() * (max - min) + min;
}

/** Pick a single element. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick `count` distinct elements (or fewer if the array is smaller). */
export function pickMany<T>(rng: Rng, arr: readonly T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i += 1) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

/** True with probability `p`. */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Approximate normal distribution via Box-Muller, clamped to [min, max]. */
export function gaussian(rng: Rng, mean: number, stdDev: number, min: number, max: number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.min(max, Math.max(min, mean + z * stdDev));
}

export function round(value: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
