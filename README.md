# Mindful PLM

A minimal, calm personal life manager focused on mindfulness. Local-first (no accounts), offline-capable, and simple.

## Features

- Today: mood check-in, daily intention, top 3 tasks
- Journal: light prompt + free writing
- Breathe: box breathing guide (4-4-4-4)
- Focus: 25-min timer with session logging
- Habits: simple daily checkmarks
- Settings: dark mode, export/import JSON, reset

## Tech

- React + TypeScript + Vite
- TailwindCSS for styling
- Zustand persisted to localStorage

## Run

```bash
npm install
npm run dev
```

Then open the URL printed by the dev server (default `http://localhost:5173`).

## Notes

- All data is stored locally in `localStorage` under the key `mindful-plm`.
- You can export/import your data from Settings.
