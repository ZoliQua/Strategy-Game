# IsoRTS

Izometrikus történelmi stratégiai játék (2.5D, böngészőben futó, egyjátékos).

Munkacím — a végleges név később eldől.

## Tech stack

- **Phaser 3** (2D izometrikus renderer)
- **TypeScript** (strict)
- **Vite** (dev server + build)
- **Miniplex** (ECS)
- **Zustand** (UI state)
- **pathfinding** (A\*)
- **localforage** (IndexedDB save)

## Fejlesztés

```bash
npm install
npm run dev         # http://localhost:5173
npm run typecheck
npm test
npm run build
```

## Dokumentumok

- [`CLAUDE.md`](./CLAUDE.md) — scope és architektúra (**mit** építünk)
- [`PROGRAM_TERV.md`](./PROGRAM_TERV.md) — taskok és sorrend (**hogyan**)

## Aktuális státusz

**M0 — Foundation.** Folyamatban.
