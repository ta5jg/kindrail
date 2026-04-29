import { z } from "zod";

export const KrDeviceId = z.string().min(8).max(200);
export type KrDeviceId = z.infer<typeof KrDeviceId>;

export const KrUserId = z.string().min(6).max(80);
export type KrUserId = z.infer<typeof KrUserId>;

export const KrSessionToken = z.string().min(20);
export type KrSessionToken = z.infer<typeof KrSessionToken>;

export const KrAuthGuestRequest = z
  .object({
    v: z.literal(1),
    deviceId: KrDeviceId
  })
  .strict();
export type KrAuthGuestRequest = z.infer<typeof KrAuthGuestRequest>;

export const KrAuthGuestResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    userId: KrUserId,
    token: KrSessionToken
  })
  .strict();
export type KrAuthGuestResponse = z.infer<typeof KrAuthGuestResponse>;

export const KrMeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    userId: KrUserId,
    createdAtMs: z.number().int().nonnegative()
  })
  .strict();
export type KrMeResponse = z.infer<typeof KrMeResponse>;

