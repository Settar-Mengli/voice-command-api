# Voice Command API - Backend

FastAPI service for a voice-controlled task manager. Exposes a small task
CRUD surface plus a `POST /instruction` endpoint that calls an LLM to turn
a plain-text voice transcription into a structured routing decision the
frontend can dispatch.

## Endpoints

- `GET    /health` - liveness probe.
- `GET    /tasks` - list all tasks.
- `POST   /tasks` - create a task.
- `PUT    /tasks/{id}` - replace a task.
- `PATCH  /tasks/{id}` - partial update (title and/or done).
- `DELETE /tasks/{id}` - delete a task.
- `POST   /instruction` - LLM intent routing. Body: `{"transcription": "<string>"}`.
  Response shape: `{"endpoint": <string|null>, "method": <string|null>, "params": <object>}`.

## Prerequisites

- Python 3.11+
- Windows PowerShell (commands below assume PowerShell)

## Setup

All commands are run from the `backend/` directory.

```powershell
cd backend

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

Copy-Item .env.example .env
# Open .env and set LLM_API_KEY
```

## Run the API

```powershell
uvicorn app.main:app --reload
```

The server listens on `http://127.0.0.1:8000`. Interactive docs are
available at `http://127.0.0.1:8000/docs`.

## Run the tests

```powershell
pytest
```

`pytest.ini` sets `pythonpath = .`, so tests must be run from inside the
`backend/` directory.

## Environment variables

See `.env.example` for the full list.

Required:

- `LLM_API_KEY` - API key for the LLM provider (4Geeks / LiteLLM gateway).

Optional (defaults shown):

- `LLM_BASE_URL` - `https://llm.4geeks.ai`
- `LLM_MODEL` - `downtown-miami/groq/llama-3.1-8b-instant`
- `CORS_ORIGINS` - `http://localhost:5173` (comma-separated for multiple origins)

## Notes

- The task store is in-memory. Tasks reset whenever the server restarts.
  This is intentional for the demo; persistence is out of scope.
- The LLM provider is abstracted behind an `LLMProvider` Protocol in
  `app/llm/base.py`, so the Groq adapter can be swapped for another
  implementation without touching the router.
