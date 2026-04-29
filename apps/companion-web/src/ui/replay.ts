import type { KrBattleSimRequest, KrBattleSimResult } from "@kindrail/protocol";

export type ReplayFrame = {
  t: number;
  hp: Record<string, number>;
  maxHp: Record<string, number>;
  alive: Record<string, boolean>;
  log: string[];
  /** Unit ids that took damage or died this tick (UI flash). */
  flashIds: string[];
};

/**
 * Deterministic forward replay from events + initial request stats.
 * Events must be stable-sorted by (tick, original index).
 */
export function buildReplayFrames(req: KrBattleSimRequest, result: KrBattleSimResult): ReplayFrame[] {
  const hp: Record<string, number> = {};
  const maxHp: Record<string, number> = {};
  const alive: Record<string, boolean> = {};

  for (const u of req.a.units) {
    hp[u.id] = u.hp | 0;
    maxHp[u.id] = u.hp | 0;
    alive[u.id] = true;
  }
  for (const u of req.b.units) {
    hp[u.id] = u.hp | 0;
    maxHp[u.id] = u.hp | 0;
    alive[u.id] = true;
  }

  const evSorted = result.events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.t - b.e.t || a.i - b.i)
    .map((x) => x.e);

  const frames: ReplayFrame[] = [];
  const ticks = Math.max(0, result.ticks);
  let evi = 0;

  for (let t = 0; t <= ticks; t++) {
    const log: string[] = [];
    const flashIds: string[] = [];

    while (evi < evSorted.length && evSorted[evi].t === t) {
      const e = evSorted[evi++];
      if (e.kind === "hit" && e.dst && typeof e.dmg === "number") {
        const cur = hp[e.dst] ?? 0;
        const next = Math.max(0, (cur - (e.dmg | 0)) | 0);
        hp[e.dst] = next;
        flashIds.push(e.dst);
        log.push(`${e.src ?? "?"} → ${e.dst}  dmg=${e.dmg}${e.crit ? " CRIT" : ""}`);
      } else if (e.kind === "death" && e.dst) {
        hp[e.dst] = 0;
        alive[e.dst] = false;
        flashIds.push(e.dst);
        log.push(`${e.dst} died`);
      } else if (e.kind === "status_apply") {
        log.push(`${e.src} applied ${e.status?.kind}(${e.status?.mag ?? 0}) to ${e.dst} for ${e.status?.dur}t`);
      } else if (e.kind === "status_tick") {
        log.push(`${e.status?.kind} tick on ${e.dst}: ${e.status?.mag ?? 0}`);
      } else if (e.kind === "ability") {
        log.push(`${e.src} ability ${e.abilityId}${e.dst ? ` → ${e.dst}` : ""}`);
      } else if (e.kind === "end") {
        log.push("END");
      }
    }

    frames.push({
      t,
      hp: { ...hp },
      maxHp: { ...maxHp },
      alive: { ...alive },
      log,
      flashIds
    });
  }

  return frames;
}
