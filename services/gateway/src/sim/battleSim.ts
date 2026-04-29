import {
  KrBattleOutcome,
  KrBattleSimRequest,
  KrBattleSimResult,
  type KrBattleEvent,
  type KrUnit
} from "@kindrail/protocol";
import { seedToU32, XorShift32 } from "./rng.js";

type LiveUnit = {
  team: "a" | "b";
  base: KrUnit;
  hp: number;
  cd: number; // cooldown accumulator (ticks)
  alive: boolean;
};

function aliveUnits(units: LiveUnit[], team: "a" | "b"): LiveUnit[] {
  return units.filter((u) => u.team === team && u.alive);
}

function pickTarget(rng: XorShift32, units: LiveUnit[], team: "a" | "b"): LiveUnit | null {
  const enemies = aliveUnits(units, team);
  if (enemies.length === 0) return null;
  // v0 targeting: random alive enemy
  return enemies[rng.nextInt(0, enemies.length - 1)] ?? null;
}

function damageRoll(rng: XorShift32, src: LiveUnit, dst: LiveUnit): { dmg: number; crit: boolean } {
  const atk = src.base.atk | 0;
  const def = dst.base.def | 0;
  let dmg = Math.max(1, atk - def);

  const critPct = src.base.critPct | 0;
  const critMulPct = src.base.critMulPct | 0;
  const crit = critPct > 0 ? rng.nextInt(1, 100) <= critPct : false;
  if (crit) dmg = Math.max(1, Math.floor((dmg * critMulPct) / 100));

  return { dmg, crit };
}

export function runBattleSim(input: unknown): KrBattleSimResult {
  const req = KrBattleSimRequest.parse(input);
  const rng = new XorShift32(seedToU32(req.seed.seed));

  const units: LiveUnit[] = [
    ...req.a.units.map((u) => ({ team: "a" as const, base: u, hp: u.hp | 0, cd: 0, alive: true })),
    ...req.b.units.map((u) => ({ team: "b" as const, base: u, hp: u.hp | 0, cd: 0, alive: true }))
  ];

  const events: KrBattleEvent[] = [];

  // v0 tick model:
  // - every tick, units accumulate cd += spd
  // - when cd >= 100, unit acts once and cd -= 100
  const ACT_THRESHOLD = 100;
  const MAX_EVENTS = 5000;

  let t = 0;
  for (; t < req.maxTicks; t++) {
    const aAlive = aliveUnits(units, "a");
    const bAlive = aliveUnits(units, "b");
    if (aAlive.length === 0 || bAlive.length === 0) break;

    for (const u of units) {
      if (!u.alive) continue;
      u.cd = (u.cd + (u.base.spd | 0)) | 0;
      if (u.cd < ACT_THRESHOLD) continue;

      u.cd -= ACT_THRESHOLD;

      const enemyTeam = u.team === "a" ? "b" : "a";
      const dst = pickTarget(rng, units, enemyTeam);
      if (!dst) continue;

      const { dmg, crit } = damageRoll(rng, u, dst);
      dst.hp = Math.max(0, (dst.hp - dmg) | 0);

      events.push({ t, kind: "hit", src: u.base.id, dst: dst.base.id, dmg, crit });
      if (events.length >= MAX_EVENTS) break;

      if (dst.hp === 0 && dst.alive) {
        dst.alive = false;
        events.push({ t, kind: "death", src: u.base.id, dst: dst.base.id });
        if (events.length >= MAX_EVENTS) break;
      }
    }

    if (events.length >= MAX_EVENTS) break;
  }

  const aAliveEnd = aliveUnits(units, "a").length;
  const bAliveEnd = aliveUnits(units, "b").length;
  const outcome: KrBattleOutcome =
    aAliveEnd > 0 && bAliveEnd === 0 ? "a" : bAliveEnd > 0 && aAliveEnd === 0 ? "b" : "draw";

  events.push({ t, kind: "end" });

  const remainingA: Record<string, number> = {};
  const remainingB: Record<string, number> = {};
  for (const u of units) {
    if (u.team === "a") remainingA[u.base.id] = u.hp | 0;
    else remainingB[u.base.id] = u.hp | 0;
  }

  return KrBattleSimResult.parse({
    v: 1,
    seed: req.seed,
    outcome,
    ticks: t,
    remaining: { a: remainingA, b: remainingB },
    events
  });
}

