import Fastify from "fastify";
import cors from "@fastify/cors";
import { nanoid } from "nanoid";
import { HealthResponse } from "@kindrail/protocol";
import { readEnv } from "./env.js";

const env = readEnv();

const app = Fastify({
  logger: {
    level: "info"
  }
});

await app.register(cors, {
  origin: true,
  credentials: false
});

app.addHook("onRequest", async (req, reply) => {
  reply.header("x-kr-trace-id", nanoid());
  reply.header("x-kr-service", "kindrail-gateway");
  reply.header("x-kr-version", env.KR_SERVICE_VERSION);
  // Basic hardening defaults (can be replaced with helmet later)
  reply.header("x-content-type-options", "nosniff");
  reply.header("referrer-policy", "no-referrer");
  reply.header("cache-control", "no-store");
  req.log.debug({ url: req.url, method: req.method }, "request");
});

app.get("/health", async () => {
  const body = HealthResponse.parse({
    ok: true,
    service: "kindrail-gateway",
    version: env.KR_SERVICE_VERSION,
    nowMs: Date.now()
  });
  return body;
});

await app.listen({ port: env.KR_PORT, host: env.KR_HOST });

