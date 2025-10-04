# YetiFoam Shed Calculator
## Overview
- Desktop estimator for YetiFoam sales staff to scope spray foam jobs on Victorian metal sheds.
- Frontend: React 19 + TypeScript, Vite, Tailwind layer; layout via `react-resizable-panels` with localStorage persistence.
- Backend: lightweight Node/TS server (`server/index.ts`) exposing `/api/bom` and `/api/llm` over HTTP, powered by the BOM vendor wrapper and OpenAI SDK.
- Supporting config lives in `src/config` (theme, labels, layout presets) to keep UI tokens and copy configurable without code edits.

## Current Build Status
- Phase 0 scaffold is in place: Vite app boots, panel resizing persists (`src/state/LayoutContext.tsx`, `src/hooks/usePersistentState.ts`), and CollapsibleSection auto-collapses after 300 ms when `isComplete` is true.
- Weather lookup flow is wired end-to-end (`src/components/WeatherPanel.tsx` → `server/api/bom.ts` → `vendor/weather-au`), returning status-aware payloads with graceful error handling.
- AI Advisor chat panel renders conversation history and calls `/api/llm`; request pipeline is guarded by rate limiting middleware and expects a valid OpenAI key.
- Input sections are stubbed placeholders (`src/components/InputPanel.tsx`), and the results/sales panels are UI shells without calculation data; state machine for `InputMode`/`ResultsMode` has not been implemented yet.
- No automated tests exist; `npm run test` is currently a Vitest hook ready for future suites.

## Next Development Tasks
- Phase 1 inputs: run the Build Agent with prompt `ApplyPhase1InputComponents` to deliver suburb autocomplete, validated dimension inputs, pitch/cladding/member selectors, spray checkboxes, openings modal, and the Calculate button per spec.
- Phase 2 calculations: run the Calculation Engine Agent with prompt `ImplementPhase2CalculationEngine` to translate Section 2 formulas into deterministic services and wire them to state.
- Phase 3 presentation: run the Results & Insights Agent with prompt `AssemblePhase3ResultsDisplay` to surface computed areas, wind context, and sales notes in the right-hand stack, honoring animation timings.
- Always hand the updated README back to the Permanent Project Summariser Agent after each phase to refresh permanent memory.

## Rules for Workflow
- Permanent memory rules: treat this README and `yetifoam-calculator-spec.md` as the single source of truth; update the README whenever phases advance or blockers appear; never delete historical context, append updates instead.
- Persistence rules: only store UI layout state through `usePersistentState` (`localStorage` key `yf:v1:ui`); avoid introducing additional storage keys without documenting them here; preserve backwards-compatible parsers when changing persisted shapes.
- Coding rules: follow Section 2 formulas verbatim, keep files ASCII unless existing Unicode demands otherwise, prefer configs in `src/config`, do not revert user-authored changes, and accompany non-obvious logic with succinct comments.

## Environment Notes
- Required `.env` keys: `OPENAI_API_KEY` (must be set for `/api/llm`), optional `OPENAI_MODEL` (defaults to `gpt-5`); copy `.env.example` as a starting point.
- Ports: Vite dev server on 5173, API server on 8787 (`PORT` override supported); ensure both are free before running `npm run dev:all`.
- Scripts: `npm run dev` (frontend only), `npm run server` (API only), `npm run dev:all` (concurrently run both with shared `.env`), `npm run build` (production bundle), `npm run test` (Vitest placeholder).
- Dependencies: Node 18+, local BOM access requires outbound HTTPS; vendor weather module ships in `vendor/weather-au` and should not be replaced without verification.

## Known Issues
- BOM weather API can return `not_found` or `no_data` for sparse suburbs or fail when the Bureau service throttles; user-facing messaging surfaces these states but does not yet offer manual overrides.
- Running `npm run dev:all` will fail if 5173 or 8787 are occupied; adjust `VITE_PORT`/`PORT` in `.env` or stop the conflicting processes before retrying.
- If weather is unavailable, advisors still run but lose context-driven insights; fallback is to proceed with sales data only and optionally stash a manual weather note in the advisor history.

## Commit & Push Guide
- `git status` (review staged and unstaged changes).
- `git add README.md` (or targeted files for a broader change set).
- `git commit -m "<concise summary>"` (follow conventional, imperative tense).
- `git push origin <branch>` (default branch is typically `main`; confirm with `git branch --show-current`).

## AI Agent Chain
- Permanent Project Summariser Agent: maintains this README and long-term context, ensuring future agents start with accurate status.
- Build Agent: executes UI and feature implementation prompts (e.g., Phase 1 inputs) against the spec.
- Calculation Engine Agent: focuses on numerical accuracy, formulas, and data pipeline reliability.
- QA & Verification Agent: plans and runs automated/manual tests once suites exist, reporting coverage gaps.
- Release Ops Agent: prepares production artifacts, verifies environment variables, and oversees deploy readiness.

## Development Order
- Phase 0 – Foundation & Architecture: scaffold complete except for mode state machine and animation polish; revisit once inputs/results are ready.
- Phase 1 – Input Components: next active phase; deliver all user inputs, validation, and completion signals.
- Phase 2 – Calculation Engine: build deterministic calculators, member counts, and spray area aggregation.
- Phase 3 – Results Display: render calculation outputs, wind metrics, and CTA panels per layout config.
- Phase 4 – Sales Insights & LLM Integration: expand advisor tooling with snippet library, notes persistence, and improved prompts.
- Phase 5 – Export & Polish: generate PDF/email outputs, add final styling, accessibility, and performance passes; optional Phase 6 adds admin tooling later.

## Sales Data Integration Note
- Weather insights enrich resilience conversations but are non-blocking; core sales estimates derive from dimensions, cladding, and member data, so the app must operate even when BOM data is missing—document any manual adjustments and continue with pricing workflows.
