# 2026-01-21 — Chatbot Delete/Complete Command Fix

## Scope
- Fix chatbot parsing so commands like `Delete the todo Buy groceries` reliably extract the full title.
- Add unit tests to prevent regressions.

## Spec references
- `specs/frontend/chatbot-commands.md`

## Root cause (what was broken)
- The previous parser used greedy patterns like `.*` before a capture group.
- Example failure:
  - `Delete the todo Buy groceries` would often capture only the last character (e.g., `"s"`)
  - This caused the bot to say it couldn't find the task / asked to specify a task.

## Changes made

### Parsing
- Updated `frontend/src/utils/chatParser.ts`:
  - Removed greedy title capture for **delete** and **complete**
  - Added title normalization (trim, quotes, articles, nouns)
  - Added completion suffix stripping for `mark ... as done/complete`

### Tests
- Added `frontend/src/utils/chatParser.test.ts` (Vitest)
- Installed missing test dependency:
  - `jsdom` as dev dependency (Vitest is configured with `environment: "jsdom"`)

## Validation performed

- `cd frontend && npm test`
  - Confirmed all new parsing tests pass.
- Rebuilt frontend Docker image and restarted container to include updated JS bundle.

## Provenance statement
Spec-driven fix implemented with AI assistance in Cursor; changes trace back to `specs/frontend/chatbot-commands.md`.

