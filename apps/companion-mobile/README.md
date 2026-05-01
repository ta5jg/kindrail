## companion-mobile (Capacitor)

This wraps `apps/companion-web` into installable iOS/Android shells via Capacitor.

### Repo-root shortcut (R1)

After `pnpm i` from monorepo root:

```bash
pnpm run mobile:sync
```

Runs `companion-web` production build then `cap sync`.

First-time only, add native platforms (often not committed in minimal clones):

```bash
pnpm --filter @kindrail/companion-mobile exec cap add ios
pnpm --filter @kindrail/companion-mobile exec cap add android
```

Then run `pnpm run mobile:sync` again from root (or `pnpm --filter @kindrail/companion-mobile exec cap sync`).

Open Xcode / Android Studio:

```bash
pnpm --filter @kindrail/companion-mobile exec cap open ios
pnpm --filter @kindrail/companion-mobile exec cap open android
```

### Deep links (HTTPS)

Same query params as the web app (e.g. `?ticket=…`, `?ref=…`, `?view=leaderboard`, `?run=1&q=…`).
Compact squad preload: `?squad=soldier,archer,knight,mage` (front L, front R, back L, back R archetype ids).

`@capacitor/app` merges `appUrlOpen` query params into the WebView URL so existing `companion-web` handlers run.
