import { z } from "zod";

// Intentionally string-based for cross-platform determinism & storage.
export const UserId = z.string().min(1);
export type UserId = z.infer<typeof UserId>;

export const DeviceId = z.string().min(1);
export type DeviceId = z.infer<typeof DeviceId>;

export const SessionId = z.string().min(1);
export type SessionId = z.infer<typeof SessionId>;

