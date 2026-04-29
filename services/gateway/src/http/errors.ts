import { z } from "zod";

export const KrErrorResponse = z
  .object({
    ok: z.literal(false),
    error: z.string().min(1)
  })
  .strict();

export type KrErrorResponse = z.infer<typeof KrErrorResponse>;

