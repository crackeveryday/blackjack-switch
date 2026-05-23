# Repository Guidelines

## Project Structure & Module Organization
`src/main.tsx` bootstraps the Vite app, and `src/App.tsx` connects the UI to the Blackjack Switch state machine. Keep presentational React components in `src/components/` with one PascalCase component per file, such as `ActionControls.tsx`. Put gameplay logic, rules, settlement, deck handling, and debug scenarios in `src/game/`; this folder is designed for pure, testable functions. Shared types live in `src/types.ts`, and global styling is centralized in `src/styles/global.css`. Treat `dist/` as generated output and `user-working/` as scratch documentation, not production code.

## Build, Test, and Development Commands
Use `npm install` to install dependencies. `npm run dev` starts the Vite dev server for local UI checks, including the debug scenario picker enabled in development. `npm test` runs Vitest once and is the minimum check before opening a PR. `npm run build` runs `tsc` and then `vite build`; this mirrors CI and should stay green before merge. `npm run preview` serves the built app from `dist/` for a release-style smoke test.

## Coding Style & Naming Conventions
This project uses strict TypeScript (`strict`, `noUnusedLocals`, `noUnusedParameters`), so fix type and dead-code warnings rather than working around them. Follow the existing style: 2-space indentation, double quotes, semicolons, and small focused functions. Component files use PascalCase; helpers, rule functions, and state transitions use camelCase exports like `splitHand` or `takeInsurance`. No dedicated ESLint or Prettier config is committed yet, so match the current formatting exactly.

## Testing Guidelines
Write Vitest coverage next to the logic it exercises using `*.test.ts`, as shown by `src/game/gameState.test.ts` and `src/game/settlement.test.ts`. Prefer deterministic unit tests around switching, splits, insurance, and payout math. When changing turn flow or rendering behavior, pair automated tests with a manual browser check via `npm run dev`.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commits, for example `fix(game): ...` and `ci: ...`; keep that format and add a scope when it clarifies the area changed. PRs should summarize gameplay or UI impact, list verification commands, link the relevant issue, and include screenshots or a short GIF for visible interface changes. Keep diffs focused and avoid committing generated `dist/` files unless that is an explicit release step.
