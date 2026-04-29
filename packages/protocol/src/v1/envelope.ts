import { z } from "zod";

/**
 * SSOT transport envelope.
 * - Designed for: Unity client ↔ gateway ↔ ecosystem services
 * - Deterministic: use strings/ints only; avoid floats where possible.
 */
export const KrV1Meta = z
  .object({
    traceId: z.string().min(8),
    tsMs: z.number().int().nonnegative(),
    clientVersion: z.string().min(1).optional()
  })
  .strict();
export type KrV1Meta = z.infer<typeof KrV1Meta>;

export const KrV1Envelope = z
  .object({
    v: z.literal(1),
    kind: z.string().min(1),
    meta: KrV1Meta,
    payload: z.unknown()
  })
  .strict();
export type KrV1Envelope = z.infer<typeof KrV1Envelope>;

