# YetiFoam Shed Calculator
## Overview
- Desktop estimator for YetiFoam sales staff to scope spray foam jobs on metal sheds.
- Frontend: React 19 + TypeScript, Vite, Tailwind layer; layout via `react-resizable-panels` with localStorage persistence.
- Backend: lightweight Node/TS server (`server/index.ts`) exposing `/api/llm` and `/api/sales` over HTTP; both endpoints accept `{ form, feedback }` payloads, return `{ variants, closing }`, and fall back to static copy when Grok is unavailable (powered by xAI Grok `grok-4-latest`).
- Supporting config lives in `src/config` (theme, labels, layout presets) to keep UI tokens and copy configurable without code edits.

## Current Build Status
- Phase 0 scaffold remains solid: Vite app boots, panel resizing persists (`src/state/LayoutContext.tsx`, `src/hooks/usePersistentState.ts`), and CollapsibleSection auto-collapses after 300 ms when `isComplete` is true.
- AI Advisor panel validates the persisted form before submitting `{ form, feedback }` to `/api/llm`; the UI renders variant bullets plus a closing statement and surfaces the static fallback copy whenever xAI Grok requests fail. Rate limiting still protects the endpoint and an `XAI_API_KEY` remains required.
- Sales composer tooling now mirrors the API contract: it validates the shared form state, posts `{ form, feedback }` to `/api/sales`, and renders the returned variants/closing with the documented fallback messaging even when Grok is unreachable.
- Phase 1 inputs are complete: `src/components/inputs/*` implements validated dimensions, pitch/cladding/member selectors, spray options, openings modal, and a calculate button gated by `isFormValid`. Form state persists via LayoutContext under `localStorage` key `yf:v1:ui`.
- Phase 3 results experience is live: `src/results/CalculationController.tsx` orchestrates the 800 ms calculate animation, `ResultsPanel` now renders `ConfigSummary`, `TotalsSummary`, and `BreakdownTable` with the floating `Toolbar`, and the right-rail Export panel surfaces manual copy text blocks while respecting persisted layout proportions.
- Vitest suites (`npm run test`) cover advisor and sales contract parsing against the Grok integration, fallback handling, and client validation.

## Export (Text-only, No Storage)
The Export panel renders a summary and an email draft as plain text. Users copy/paste manually. No PDF, clipboard API, or quote saving/localStorage is used.

## Next Development Tasks
- Phase 4 – Sales Insights & LLM Integration: flesh out sales tooling inside the right stack (context buttons, notes persistence, snippet library) and refine advisor prompts per spec Section 8.
- Phase 5 – Export & Polish: generate PDF/email outputs, add final styling, accessibility, and performance passes once sales tooling stabilises.
- Investigate automated regression coverage (Vitest) after Phase 4 to lock behaviour ahead of export work.
- Always hand the updated README back to the Permanent Project Summariser Agent after each phase to refresh permanent memory.

## Rules for Workflow
- Permanent memory rules: treat this README and `yetifoam-calculator-spec.md` as the single source of truth; update the README whenever phases advance or blockers appear; never delete historical context, append updates instead.
- Persistence rules: only store UI layout state through `usePersistentState` (`localStorage` key `yf:v1:ui`); avoid introducing additional storage keys without documenting them here; preserve backwards-compatible parsers when changing persisted shapes.
- Coding rules: follow Section 2 formulas verbatim, keep files ASCII unless existing Unicode demands otherwise, prefer configs in `src/config`, do not revert user-authored changes, and accompany non-obvious logic with succinct comments.

## Environment Notes
- Required `.env` keys: `XAI_API_KEY` (recommended for `/api/llm`/`/api/sales`, otherwise the demo key is used automatically); copy `.env.example` as a starting point.
- Ports: Vite dev server on 5173, API server on 8788 (`PORT` override supported); ensure both are free before running `npm run dev:all`.
- Scripts: `npm run dev` (frontend only), `npm run server` (API only), `npm run dev:all` (concurrently run both with shared `.env`), `npm run build` (production bundle), `npm run test` (Vitest coverage for advisor/sales flows).
- Dependencies: Node 18+.

## Known Issues
- Running `npm run dev:all` will fail if 5173 or 8788 are occupied; adjust `VITE_PORT`/`PORT` in `.env` or stop the conflicting processes before retrying.

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
- Phase 0 – Foundation & Architecture: complete.
- Phase 1 – Input Components: complete.
- Phase 2 – Calculation Engine: complete (Phase 2 deliverables integrated into results pipeline).
- Phase 3 – Results Display: complete; choreography, panels, and storage persistence align with spec.
- Phase 4 – Sales Insights & LLM Integration: next active phase (advisor upgrades, notes, snippets).
- Phase 5 – Export & Polish: generate PDF/email outputs, add final styling, accessibility, and performance passes; optional Phase 6 adds admin tooling later.

## Sales Data Integration Note
- Sales insights lean on calculation outputs, curated knowledge base snippets, and recorded feedback. Ensure calc summaries stay accurate and log any manual adjustments inside advisor notes so regenerated pitches remain aligned.

<!-- PHASE-4-PLACEHOLDERS -->
## Phase 4 Placeholders — Validation
**Status:** PASS
**Checks:** files present, no BOM key refs, persistence OK, build OK

**Next actions**
- Run “Sales/LLM Role Architect” interview to author rules and templates.
- After content, wire composePitch() and Advisor UI.

**Validator JSON**
```json
{
  "phase": "4-placeholders",
  "pass": true,
  "errors": [],
  "warnings": [],
  "recommendations": []
}
```
