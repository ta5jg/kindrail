import { z } from "zod";

export const HealthResponse = z
  .object({
    ok: z.boolean(),
    service: z.string().min(1),
    version: z.string().min(1),
    nowMs: z.number().int().nonnegative()
  })
  .strict();
export type HealthResponse = z.infer<typeof HealthResponse>;

