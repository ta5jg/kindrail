import { z } from "zod";
import { KrUserId } from "./account.js";

export const KrCurrency = z
  .object({
    gold: z.number().int().nonnegative(),
    shards: z.number().int().nonnegative(),
    keys: z.number().int().nonnegative()
  })
  .strict();
export type KrCurrency = z.infer<typeof KrCurrency>;

export const KrInventory = z
  .object({
    v: z.literal(1),
    userId: KrUserId,
    currency: KrCurrency
  })
  .strict();
export type KrInventory = z.infer<typeof KrInventory>;

export const KrInventoryResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    inventory: KrInventory
  })
  .strict();
export type KrInventoryResponse = z.infer<typeof KrInventoryResponse>;

export const KrDailyClaimResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    claimed: z.boolean(),
    // if claimed just now, includes delta
    delta: KrCurrency.optional(),
    inventory: KrInventory
  })
  .strict();
export type KrDailyClaimResponse = z.infer<typeof KrDailyClaimResponse>;

