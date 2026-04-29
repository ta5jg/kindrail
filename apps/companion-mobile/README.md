## companion-mobile (Capacitor)

This wraps `apps/companion-web` into installable iOS/Android shells via Capacitor.

### Local workflow

1) Install deps

```bash
pnpm i
```

2) Build the web app

```bash
pnpm --filter @kindrail/companion-mobile build:web
```

3) Add platforms (one-time)

```bash
pnpm --filter @kindrail/companion-mobile exec cap add ios
pnpm --filter @kindrail/companion-mobile exec cap add android
```

4) Sync web assets into native projects

```bash
pnpm --filter @kindrail/companion-mobile exec cap sync
```

5) Open in Xcode / Android Studio

```bash
pnpm --filter @kindrail/companion-mobile exec cap open ios
pnpm --filter @kindrail/companion-mobile exec cap open android
```

### Deep links (HTTPS)

Use the same query params as the web app (e.g. `?ticket=…`, `?ref=…`, `?view=leaderboard`, `?run=1&q=…`).
`@capacitor/app` merges `appUrlOpen` query params into the WebView URL so existing companion-web handlers run.

