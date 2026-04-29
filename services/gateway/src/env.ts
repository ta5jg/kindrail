import { z } from "zod";

const Env = z
  .object({
    KR_PORT: z.coerce.number().int().min(1).max(65535).default(8787),
    KR_HOST: z.string().min(1).default("0.0.0.0"),
    KR_SERVICE_VERSION: z.string().min(1).default("0.0.1")
  })
  .passthrough();

export type GatewayEnv = z.infer<typeof Env>;

export function readEnv(input: NodeJS.ProcessEnv = process.env): GatewayEnv {
  return Env.parse(input);
}

