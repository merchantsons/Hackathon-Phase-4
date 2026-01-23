# Chatbot Commands & Parsing (Phase IV)

## Purpose

Define the supported **natural language commands** for the Todo chatbot and the parsing rules that convert user messages into deterministic CRUD actions against the FastAPI backend.

This spec prevents regressions like the `"Delete the todo Buy groceries"` failure caused by greedy parsing.

## Responsibilities

### Supported commands

- **List**
  - Examples: `Show my todos`, `List all tasks`, `What are my todos?`
  - Output: human-readable list based on currently loaded todos

- **Create**
  - Examples: `Create a todo called Buy groceries`, `Add a high priority todo Schedule meeting due 2026-02-01`
  - Output: creates task via API and returns confirmation string

- **Complete**
  - Examples:
    - `Complete the todo Buy groceries`
    - `Mark Buy groceries as done`
  - Output: marks a matching pending task as completed via API

- **Delete**
  - Examples:
    - `Delete the todo Buy groceries`
    - `Remove the task Buy groceries`
  - Output: deletes a matching task via API

### Parsing rules (critical)

1. **No greedy capture for titles**
   - Patterns like `.*` must be avoided when extracting titles, or must be **non-greedy** (`.*?`) and bounded by punctuation/end-of-line.

2. **Title normalization**
   - Trim whitespace
   - Remove surrounding quotes
   - Remove leading articles: `the`, `a`, `an`
   - Remove leading nouns: `todo`, `task`
   - For completion commands, strip common suffixes like `as done`, `as complete`, `done`, `completed`

3. **Command detection order**
   - Detect `list` / `create` / `complete` / `delete` in a stable order to avoid ambiguity.

4. **Matching strategy**
   - Try exact title match (case-insensitive)
   - Then substring match (`contains` either direction)
   - Then word-overlap fuzzy match (≥ 50% match) for long titles

## Acceptance Criteria

1. ✅ `parseCommand("Delete the todo Buy groceries")` returns:
   - `action: "delete"`
   - `taskTitle: "Buy groceries"`
2. ✅ `parseCommand("Complete the todo Buy groceries")` returns:
   - `action: "complete"`
   - `taskTitle: "Buy groceries"`
3. ✅ `parseCommand("Mark Buy groceries as done")` returns:
   - `action: "complete"`
   - `taskTitle` containing `"Buy groceries"` (suffix stripped or harmless)
4. ✅ `processChatCommand()` for delete/complete uses the parsed title to select a task and calls the correct API method.
5. ✅ Unit tests exist and pass (Vitest) for the examples above.
6. ✅ Test runtime dependencies are present:
   - `jsdom` is installed as a dev dependency when Vitest uses `environment: "jsdom"`.

## Validation Checklist

- [ ] Run unit tests:
  - `cd frontend && npm test`
- [ ] `frontend/package.json` includes `jsdom` under `devDependencies`
- [ ] Verify parsing behavior in tests:
  - delete, complete, mark-as-done
- [ ] Manual smoke test (running containers):
  - Start app (`run-containers.bat`)
  - Create task via UI: `Buy groceries`
  - Use chatbot: `Delete the todo Buy groceries` → task removed from list

