import { z } from "zod";

export const KrPushWebVapidResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    enabled: z.boolean(),
    publicKey: z.string().min(1).optional()
  })
  .strict();
export type KrPushWebVapidResponse = z.infer<typeof KrPushWebVapidResponse>;

export const KrPushWebSubscription = z
  .object({
    endpoint: z.string().url().min(10),
    keys: z
      .object({
        p256dh: z.string().min(1),
        auth: z.string().min(1)
      })
      .strict()
  })
  .strict();
export type KrPushWebSubscription = z.infer<typeof KrPushWebSubscription>;

export const KrPushWebSubscribeRequest = z
  .object({
    v: z.literal(1),
    subscription: KrPushWebSubscription
  })
  .strict();
export type KrPushWebSubscribeRequest = z.infer<typeof KrPushWebSubscribeRequest>;

export const KrPushWebSubscribeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    subscriptionId: z.string().min(1)
  })
  .strict();
export type KrPushWebSubscribeResponse = z.infer<typeof KrPushWebSubscribeResponse>;

export const KrPushWebUnsubscribeRequest = z
  .object({
    v: z.literal(1),
    endpoint: z.string().min(10)
  })
  .strict();
export type KrPushWebUnsubscribeRequest = z.infer<typeof KrPushWebUnsubscribeRequest>;

export const KrPushWebUnsubscribeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    removed: z.boolean()
  })
  .strict();
export type KrPushWebUnsubscribeResponse = z.infer<typeof KrPushWebUnsubscribeResponse>;
