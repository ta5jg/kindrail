## Faz 7 — Native client (opsiyonel)

Bu fazın amacı, web-first prototip kanıtlandıktan sonra **store dağıtımı** ve **native entegrasyonlar** (push, deep-link, offline cache) ile ürünü büyütmektir.

KINDRAIL için en düşük riskli yaklaşım:
- **PWA** (installable) = “hemen” native hissi + offline cache + hızlı iterasyon
- **Capacitor wrapper** = iOS/Android store’a giden köprü (tek web codebase)
- Unity client (opsiyonel, sonra) = gerçek 3D/animasyon + farklı UX, ama maliyetli

---

### 7.1 PWA (apps/companion-web)

PWA zaten devrede:
- `manifest.webmanifest`
- `sw.js` (workbox generateSW)
- `virtual:pwa-register` ile otomatik update

Build:

```bash
pnpm --filter @kindrail/companion-web build
pnpm --filter @kindrail/companion-web preview
```

---

### 7.2 Mobil wrapper (apps/companion-mobile)

`apps/companion-mobile` Capacitor config’i `apps/companion-web/dist` çıktısını sarar.

1) Build web

```bash
pnpm --filter @kindrail/companion-mobile build:web
```

2) Platform ekle (one-time)

```bash
pnpm --filter @kindrail/companion-mobile exec cap add ios
pnpm --filter @kindrail/companion-mobile exec cap add android
```

3) Sync

```bash
pnpm --filter @kindrail/companion-mobile exec cap sync
```

4) Open

```bash
pnpm --filter @kindrail/companion-mobile exec cap open ios
pnpm --filter @kindrail/companion-mobile exec cap open android
```

---

### 7.3 Deep link (web + Capacitor)

**Query parametreleri (companion-web):**
- `?view=battle|shop|collection|monetization|leaderboard|share|push` → ilgili karta scroll (param sonra temizlenir)
- `?run=1` (veya `true` / `yes`) → mevcut `q` battle request ile simülasyonu otomatik çalıştırır (`run` temizlenir)
- Mevcut: `?q=…` replay, `?ref=…` referral, `?ticket=…` share redeem, `?purchase=…&status=…` checkout dönüşü

**Capacitor (`@capacitor/app`):** `appUrlOpen` ile gelen HTTPS URL’nin query’si mevcut origin’e merge edilir ve `kr:urlchanged` ile aynı handler tetiklenir (ticket/referral/view/run akışları yeniden çalışır).

---

### 7.4 Web Push (MVP)

**Gateway**
- `GET /push/web/vapid-public` — VAPID yoksa `enabled: false`
- `POST /push/web/subscribe` (Bearer) — abonelik kaydı; **aynı endpoint yeniden gelirse cap tüketilmez** (idempotent upsert)
- Günlük **cap**: yeni endpoint başına en fazla **50** subscribe / gün / kullanıcı (`pushSubscribe` cap)
- `POST /admin/push/test` + `x-kr-admin-token` — test bildirimi (`KR_VAPID_*` + `KR_ADMIN_TOKEN` gerekli). İsteğe bağlı `userId` yoksa en fazla 500 hedef.

**Env (gateway):**
- `KR_VAPID_PUBLIC_KEY`, `KR_VAPID_PRIVATE_KEY` (ör. `npx web-push generate-vapid-keys`)
- `KR_PUSH_SUBJECT` (ör. `mailto:ops@example.com`)

**Feature flag:** `push_web` (`flags.json`, varsayılan açık)

**Client:** companion-web → “Push (daily reminder)” kartı → “Enable push on this device”.

Cron / günlük job için bir sonraki adım: imzalı internal job veya queue ile `POST /admin/push/test` benzeri “daily” endpoint (rate + idempotency anahtarı ile).

