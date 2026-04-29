type Bucket = {
  resetAtMs: number;
  count: number;
};

export class FixedWindowRateLimiter {
  private readonly windowMs: number;
  private readonly buckets = new Map<string, Bucket>();

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  allow(key: string, maxPerWindow: number, nowMs = Date.now()): { ok: boolean; remaining: number; resetAtMs: number } {
    const b = this.buckets.get(key);
    if (!b || nowMs >= b.resetAtMs) {
      const nb: Bucket = { resetAtMs: nowMs + this.windowMs, count: 1 };
      this.buckets.set(key, nb);
      return { ok: true, remaining: Math.max(0, maxPerWindow - 1), resetAtMs: nb.resetAtMs };
    }

    if (b.count >= maxPerWindow) {
      return { ok: false, remaining: 0, resetAtMs: b.resetAtMs };
    }

    b.count += 1;
    return { ok: true, remaining: Math.max(0, maxPerWindow - b.count), resetAtMs: b.resetAtMs };
  }

  // opportunistic cleanup
  sweep(nowMs = Date.now()) {
    for (const [k, b] of this.buckets) {
      if (nowMs >= b.resetAtMs) this.buckets.delete(k);
    }
  }
}

