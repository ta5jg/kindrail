import { z } from "zod";

const Env = z
  .object({
    KR_PORT: z.coerce.number().int().min(1).max(65535).default(8787),
    KR_HOST: z.string().min(1).default("0.0.0.0"),
    KR_SERVICE_VERSION: z.string().min(1).default("0.0.1"),
    KR_AUTH_SECRET: z.string().min(16).default("dev-only-change-me-please"),
    KR_SESSION_TTL_MS: z.coerce.number().int().min(60_000).max(1000 * 60 * 60 * 24 * 30).default(1000 * 60 * 60 * 24 * 7),
    KR_STORE_DIR: z.string().min(1).default(".kr-data")
  })
  .passthrough();

export type GatewayEnv = z.infer<typeof Env>;

export function readEnv(input: NodeJS.ProcessEnv = process.env): GatewayEnv {
  return Env.parse(input);
}

