import webpush from "web-push";

export function setVapid(subject: string, publicKey: string, privateKey: string) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendWebPushJson(
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: unknown
): Promise<void> {
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: sub.keys },
    JSON.stringify(payload),
    { TTL: 60 * 60 * 12, urgency: "normal" }
  );
}
