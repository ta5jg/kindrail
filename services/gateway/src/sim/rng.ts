/**
 * Deterministic PRNG (xorshift32) for gameplay simulation.
 * - Stable across JS engines
 * - Uses only 32-bit integer ops
 */
export class XorShift32 {
  private s: number;

  constructor(seed32: number) {
    this.s = seed32 | 0;
    if (this.s === 0) this.s = 0x6d2b79f5; // avoid zero-lock
  }

  nextU32(): number {
    // xorshift32
    let x = this.s | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.s = x | 0;
    return x >>> 0;
  }

  next01(): number {
    // [0,1)
    return (this.nextU32() >>> 0) / 0x1_0000_0000;
  }

  nextInt(minInclusive: number, maxInclusive: number): number {
    const min = minInclusive | 0;
    const max = maxInclusive | 0;
    if (max < min) throw new Error("nextInt: max < min");
    const span = (max - min + 1) >>> 0;
    // modulo bias is acceptable for v0; can upgrade later
    return min + (this.nextU32() % span);
  }
}

export function seedToU32(seed: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i) & 0xff;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

