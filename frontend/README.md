# Voice Command - Frontend

React + Vite single-page app for the Voice Command API. The user taps a
microphone button, speaks an instruction, and the app uses the Web Speech
API to transcribe it, posts the transcription to the backend's
`/instruction` endpoint, and dispatches the returned routing decision
against the task CRUD endpoints.

## Tech stack

- React 19 with strict TypeScript (`strict`, `noUnusedLocals`,
  `noUnusedParameters`, `verbatimModuleSyntax`)
- Vite 8 (build + dev server)
- Tailwind CSS 4 (CSS-first via `@tailwindcss/vite`; no PostCSS config)
- ESLint flat config + Prettier
- Web Speech API for in-browser voice transcription

## Browser support

Voice capture relies on the Web Speech API (`SpeechRecognition` /
`webkitSpeechRecognition`), which currently ships in Chromium-based
browsers. **Use Chrome or Edge.** Firefox and Safari render the UI in a
disabled state with a clear "voice not supported" message.

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

## Scripts

- `npm run dev` - start the Vite dev server at `http://localhost:5173`.
- `npm run build` - type-check (`tsc -b`) and produce a production bundle
  in `dist/`.
- `npm run preview` - serve the production build locally.
- `npm run lint` - run ESLint on all source files.
- `npm run format` - run Prettier on the entire project.

## Environment variables

See `.env.example`. Required:

- `VITE_API_BASE_URL` - base URL of the FastAPI backend (default
  `http://localhost:8000`).

## Project layout

```
src/
  components/   reusable UI building blocks (Header, Layout, VoiceButton,
                StatusBar, TaskList, TaskCard)
  hooks/        useSpeechRecognition (Web Speech API lifecycle) and
                useTasks (task state + instruction dispatcher)
  lib/          typed fetch wrappers for every backend endpoint
  types/        TypeScript interfaces mirroring the backend Pydantic models
  App.tsx       composes the layout and wires both hooks together
  main.tsx      React entry point
  index.css     Tailwind import + base styles
```
