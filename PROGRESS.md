# Voice Command API — Progress Log

Portfolio-quality voice-controlled task manager built on the 4Geeks bootcamp brief, extended with a custom React frontend, provider-abstracted LLM routing, and strict typing on both sides.

## What Was Built

### Backend (FastAPI)

- In-memory task CRUD (`GET/POST/PUT/PATCH/DELETE /tasks`)
- `POST /instruction` — accepts a voice transcription, calls Groq Llama 3.1 8B via the 4Geeks LiteLLM gateway, returns structured routing JSON (never free text)
- `LLMProvider` Protocol + `GroqAdapter` — swappable provider abstraction
- Three-layer graceful fallback on `/instruction`: HTTP error, JSON parse failure, shape validation
- Pydantic v2 models with strict validation; 20+ pytest tests covering health, CRUD, and instruction routing
- Deterministic title cleaner on task create/update (belt-and-suspenders for voice transcriptions)

### Frontend (React 19 / Vite / Tailwind v4)

- Web Speech API for in-browser voice capture (Chrome/Edge)
- Typed fetch client for all backend endpoints
- `useSpeechRecognition` + `useTasks` hooks orchestrating the voice-to-action flow
- Dark gradient UI with microphone button, live transcription, status bar, and task list

## Architecture (Brief)

```
User speaks → Web Speech API transcribes → POST /instruction
  → LLM returns {endpoint, method, params}
  → Frontend dispatcher calls the matching /tasks endpoint
  → Task list refreshes, status bar shows result
```

The LLM is an intent router, not a chatbot. It maps natural language to one of six allowed API call shapes. The frontend owns dispatch and user-facing copy; the backend owns validation and storage.

## Six Supported Voice Operations

| Voice intent (examples) | Routed action |
|-----------------------|---------------|
| "add buy groceries" / "new task call mom" | Create task (POST) |
| "show my tasks" / "what do I need to do" | List tasks (GET) |
| "rename task 1 to call mom" | Rename (PATCH title) |
| "mark task 2 as done" | Toggle done (PATCH done) |
| "replace task 1 with ..." | Full replace (PUT) |
| "delete task 2" / "delete the second one" | Delete (DELETE) |

Unclear or off-topic input returns a null endpoint with a friendly message in the status bar.

## Known Limitations

- **In-memory storage** — tasks reset on backend restart; no persistence by design
- **Chromium-only voice** — Web Speech API is not available in Firefox/Safari; unsupported browsers see a disabled mic with a clear message
- **LLM variability** — routing quality depends on few-shot prompt coverage; a server-side title cleaner catches verb leakage the model misses
- **No authentication** — local demo scope only

## Demo Polish Pass (This Fix)

Addressed three defects observed in the recorded demo:

1. **Verb leakage into titles** — system prompt now includes explicit verb-stripping few-shots (`"add my groceries"` → title `"groceries"`); server-side `clean_title()` normalizes titles on every create/update via Pydantic validators
2. **Duplicate/stale tasks in recordings** — in-memory store resets on restart; fresh uvicorn boot gives a clean list for each demo take
3. **Raw LLM error strings in the UI** — off-topic reasons map to a single friendly hint; success messages quote task titles instead of numeric ids; unclear-intent copy flows through the status message (not the error slot) so it does not render red

## Smart Layer

Three features added to make the app feel intelligent and alive during demos:

### Speak-back (3a)

- `useSpeech` hook wraps the browser-native `speechSynthesis` API (no new dependencies)
- After each command completes, the status message is read aloud — same string shown in the UI, single source of truth
- Header mute toggle (speaker icon beside the beta pill) silences TTS for quiet recording; in-memory only, default unmuted
- Does not speak in-flight "Thinking..." or load/recognition errors

### Multi-task in one utterance (3b)

- System prompt allows `{"actions": [<routing object>, ...]}` when the user clearly enumerates multiple tasks
- Single-action responses stay a plain object (backward compatible with existing clients and tests)
- Groq `json_object` mode requires the wrapper — bare top-level arrays are rejected by the gateway
- `/instruction` unwraps `actions` to a JSON array; the frontend dispatches sequentially with a refetch between mutating steps
- Batch summary composes one line (e.g. `Added 3 tasks: "milk", "eggs", "call mom".`) and speaks it
- Counter-example enforced: `"buy milk and eggs"` remains one task when `and` is task content, not enumeration

### Fuzzy targeting (3c)

- LLM may return `params.match` (substring) instead of `params.id` when the user references a task by description
- Frontend resolves `match` client-side against the current task list (case-insensitive substring)
- Exactly one hit proceeds; zero hits and multiple hits return friendly guidance without mutating state
- Numeric id targeting unchanged — `match` is a fallback, not a replacement

## Phase 4 — Intelligent features

Five smart LLM features that make the app feel conversational without extra model calls for confirmations:

### Conversational confirmations (4a)

- `useTasks` composes natural status copy from dispatch results — no second LLM round-trip
- Batch creates read as "Added three items: milk, eggs, and call mom."
- Toggle/delete/bulk replies use short sentence-case phrasing; the same string feeds the status bar and TTS

### Undo (4b)

- Prompt routes "undo" / "take that back" to `{"command": "undo"}` (null endpoint)
- Frontend tracks the last mutating action in a single-level undo stack
- Reverses create, delete, toggle, rename, replace, and bulk clear/complete
- Speaks "Undone." or "Nothing to undo."

### Bulk / smart operations (4c)

- Prompt routes clear-done, clear-all, and complete-all to `{"command": ...}` (null endpoint)
- Frontend resolves targets against the live task list, dispatches DELETE/PATCH in sequence, refetches, and composes a clear reply
- No confirmation dialog for clear-all; the spoken reply states what happened

### Priority / tags (4d)

- Optional `priority: "low" | "normal" | "high"` on tasks (default normal, omitted from JSON when normal)
- LLM maps urgency cues to high and low-priority phrasing to low on POST
- TaskCard shows a rose dot for high and a muted dot for low; normal shows nothing

### Spoken queries (4e)

- GET `/tasks` with `params.query` of `count`, `remaining`, or `summary`
- Frontend answers from the current list without mutating state
- Examples: "You have three tasks." / "You have two tasks left." / "You have two open: milk and eggs."
