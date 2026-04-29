import { createHash } from "node:crypto";

export function pushWebSubscriptionId(endpoint: string): string {
  return createHash("sha256").update(endpoint, "utf8").digest("hex").slice(0, 32);
}
