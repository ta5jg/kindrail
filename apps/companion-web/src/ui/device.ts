function randomId(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function getOrCreateDeviceId(): string {
  const k = "kr.deviceId";
  const existing = localStorage.getItem(k);
  if (existing && existing.length >= 8) return existing;
  const id = `dev_${randomId(24)}`;
  localStorage.setItem(k, id);
  return id;
}

export function getToken(): string | null {
  return localStorage.getItem("kr.token");
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem("kr.token");
  else localStorage.setItem("kr.token", token);
}

