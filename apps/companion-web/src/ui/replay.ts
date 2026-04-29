import type { KrBattleSimResult } from "@kindrail/protocol";

export type ReplayFrame = {
  t: number;
  hp: Record<string, number>;
  alive: Record<string, boolean>;
  log: string[];
};

export function buildReplayFrames(result: KrBattleSimResult): ReplayFrame[] {
  // init from remaining snapshot is end-state; we rebuild forward from events, so start from max hp is not available.
  // v1: we reconstruct relative changes only; display is event-driven.
  const frames: ReplayFrame[] = [];
  const hp: Record<string, number> = {};
  const alive: Record<string, boolean> = {};

  // seed initial hp by taking max of remaining and observed damage deltas is non-trivial;
  // for v1 UI, we track alive state and "damage events" only and show running HP if we can.
  // We'll initialize using remaining as baseline and then replay backwards isn't worth it.
  // So: show HP deltas and deaths; keep hp as "unknown" -> treat missing as 0.
  for (const [id, v] of Object.entries(result.remaining.a)) {
    hp[id] = v;
    alive[id] = v > 0;
  }
  for (const [id, v] of Object.entries(result.remaining.b)) {
    hp[id] = v;
    alive[id] = v > 0;
  }

  const byTick = new Map<number, KrBattleSimResult["events"]>();
  for (const e of result.events) {
    const arr = byTick.get(e.t) ?? [];
    arr.push(e);
    byTick.set(e.t, arr);
  }

  const ticks = Math.max(0, result.ticks);
  for (let t = 0; t <= ticks; t++) {
    const log: string[] = [];
    const evs = byTick.get(t) ?? [];
    for (const e of evs) {
      if (e.kind === "hit") {
        log.push(`${e.src} → ${e.dst}  dmg=${e.dmg ?? 0}${e.crit ? " CRIT" : ""}`);
        // cannot reliably update hp forward; keep as-is for now
      } else if (e.kind === "death") {
        log.push(`${e.dst} died`);
        if (e.dst) alive[e.dst] = false;
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

    frames.push({ t, hp: { ...hp }, alive: { ...alive }, log });
  }

  return frames;
}

