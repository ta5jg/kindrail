import type { FastifyInstance, FastifyRequest } from "fastify";
import { verifyToken } from "./token.js";

declare module "fastify" {
  interface FastifyRequest {
    krUserId?: string;
  }
}

export function registerAuth(app: FastifyInstance, opts: { secret: string }) {
  app.decorateRequest("krUserId", undefined);

  app.addHook("preHandler", async (req: FastifyRequest) => {
    const auth = req.headers.authorization;
    if (!auth) return;
    const m = /^Bearer\s+(.+)$/.exec(auth);
    if (!m) return;
    const payload = verifyToken(m[1], opts.secret);
    if (!payload) return;
    req.krUserId = payload.userId;
  });
}

export function requireAuth(req: FastifyRequest): string {
  const uid = req.krUserId;
  if (!uid) throw new Error("UNAUTHORIZED");
  return uid;
}

