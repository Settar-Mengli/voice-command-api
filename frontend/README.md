# Voice Command - Frontend

React 19 + Vite 8 + TypeScript 6 + Tailwind 4 frontend for the Voice Command
API. This commit ships only the static scaffold: layout, components, typed
API client (not yet wired), and a placeholder task list. Speech recognition
and live data come in Commit 5.

## Prerequisites

- Node 20+
- npm 10+
- Backend running at `http://localhost:8000` (see `../backend/README.md`)

## Setup

All commands are run from the `frontend/` directory.

```powershell
cd frontend

npm install

Copy-Item .env.example .env
# Edit .env if your backend is not on http://localhost:8000
```

## Run the dev server

```powershell
npm run dev
```

Vite serves the app at `http://localhost:5173`.

## Other scripts

- `npm run build` - type-check and produce a production bundle in `dist/`
- `npm run preview` - serve the production build locally
- `npm run lint` - run ESLint (flat config) on all source files
- `npm run format` - run Prettier on the entire project

## Environment variables

See `.env.example`. Required:

- `VITE_API_BASE_URL` - base URL of the FastAPI backend (default
  `http://localhost:8000`)

## Project layout

```
src/
  components/   reusable UI building blocks
  hooks/        custom hooks (populated in Commit 5)
  lib/          API client wrapper (typed fetch helpers)
  types/        TypeScript types mirroring backend models
  App.tsx       composes Layout + components
  main.tsx      React entry point
  index.css     Tailwind directives + base styles
```
