import type { KrBattleSimRequest } from "@kindrail/protocol";
import { decodeJsonFromUrlParam } from "./share";

const MAP_SLOTS = [0, 1, 6, 7] as const;

/** Default + optional restore from `?q=` share link. */
export function readInitialSquadFromUrl(): Array<string | null> {
  const fallback: Array<string | null> = ["soldier", "archer", null, null];
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q");
    if (!q) return fallback;
    const req = decodeJsonFromUrlParam<KrBattleSimRequest>(q);
    const slots: Array<string | null> = [null, null, null, null];
    for (const u of req.a.units) {
      const slot = (u.slot ?? 0) | 0;
      const idx = MAP_SLOTS.indexOf(slot as (typeof MAP_SLOTS)[number]);
      if (idx >= 0) slots[idx] = u.archetype;
    }
    if (slots.every((s) => !s)) return fallback;
    return slots;
  } catch {
    return fallback;
  }
}
