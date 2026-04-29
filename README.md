## KINDRAIL

Fast-growing, session-based **async auto-battler + collection meta**.

This repo is a monorepo:
- `services/gateway`: TypeScript gateway for USDTgVerse / Q-Verse integrations
- `packages/protocol`: SSOT schemas + codegen-friendly types
- `packages/sdk-ts`: TypeScript SDK used by web/mobile companion apps
- `apps/companion-web`: (next) web companion
- `apps/companion-mobile`: (next) mobile companion
- `apps/game-unity`: (next) Unity client (WebGL/iOS/Android)

### Quick start

1) Install deps

```bash
corepack enable
pnpm i
```

2) Run gateway

```bash
pnpm dev
```

3) Open
- `GET http://localhost:8787/health`

