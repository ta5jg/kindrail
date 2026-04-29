## Kindrail Unity Client (placeholder)

This folder is intentionally a placeholder to keep the repo lightweight until the Unity project is initialized.

### Integration contract (v0)

Gateway base URL (dev):
- `http://localhost:8787`

Endpoints:
- `GET /health` → `HealthResponse` (from `@kindrail/protocol`)

### Next step (Unity)
- Add a Unity project under `apps/game-unity/KindrailUnity/`
- Add a small C# HTTP client:
  - `GET /health`
  - Parse JSON into a DTO matching `HealthResponse`
- Add protocol codegen step:
  - `pnpm --filter @kindrail/protocol schema:json`
  - Convert JSON Schema → C# DTOs (quicktype or custom generator)

