# 2026-01-21 — Frontend Container Restart Fix

## Scope
- Fix frontend container exiting immediately when restarted via Docker Desktop "play" button.

## Root cause (what was broken)
- The startup script (`/start-nginx.sh`) used `set -e` (exit on error).
- On first run: template exists → processed → deleted → nginx starts ✅
- On restart: template missing (already deleted) → `envsubst` fails → script exits → container stops ❌

Error in logs:
```
/start-nginx.sh: line 4: can't open /usr/share/nginx/html/config.js.template: no such file
```

## Changes made

### Dockerfile startup script
- Updated `frontend/Dockerfile` startup script to be restart-resilient:
  - Check if `config.js.template` exists before processing
  - If template exists: process it and delete (first run)
  - If template missing but `config.js` exists: skip (restart scenario)
  - If both missing: create default `config.js` as fallback

### Spec update
- Updated `specs/deployment/containerization.md` to document restart-resilient behavior requirements.

## Validation performed

- Started container → healthy ✅
- Stopped container → stopped ✅
- Started container again → healthy ✅ (no errors)
- Verified health endpoint: `curl http://localhost:3000/health` → `healthy` ✅

## Provenance statement
Spec-driven fix implemented with AI assistance in Cursor; changes trace back to `specs/deployment/containerization.md`.
