import { z } from "zod";

export const KrInternalPushDailyRequest = z
  .object({
    v: z.literal(1),
    dateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dryRun: z.boolean().optional(),
    limit: z.number().int().min(1).max(10_000).optional()
  })
  .strict();
export type KrInternalPushDailyRequest = z.infer<typeof KrInternalPushDailyRequest>;

export const KrInternalPushDailyResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: z.string().min(10),
    dryRun: z.boolean(),
    scanned: z.number().int().nonnegative(),
    sent: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    removed: z.number().int().nonnegative()
  })
  .strict();
export type KrInternalPushDailyResponse = z.infer<typeof KrInternalPushDailyResponse>;
