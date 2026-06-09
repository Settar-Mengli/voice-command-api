# Voice Command API - Backend

FastAPI backend for a voice-controlled task manager. Exposes task CRUD
endpoints and a `POST /instruction` endpoint that uses an LLM to route
voice transcriptions to the correct task action.

This commit contains only the scaffold: a `create_app()` factory, CORS
middleware, a `GET /health` endpoint, pydantic-settings configuration,
and a single health test. Routers, models, the store, and LLM client are
introduced in later commits.

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

See `.env.example` for the full list. Required:

- `LLM_API_KEY` - API key for the LLM provider.

Optional (defaults shown):

- `LLM_BASE_URL` - `https://llm.4geeks.ai`
- `LLM_MODEL` - `litellm/downtown-miami/groq/llama-3.1-8b-instant`
- `CORS_ORIGINS` - `http://localhost:5173` (comma-separated for multiple origins)
