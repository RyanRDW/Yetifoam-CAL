# YetiFoam Shed Calculator – Functional Specification (Updated)

_Last revised: 2025-02-15_

This specification captures the behaviour and architecture of the current YetiFoam Shed Calculator after removing the legacy site-selection and environmental data features. It is the primary reference for future development. Keep the document in sync with implementation.

## 1. Product Scope
- Desktop-oriented estimator for YetiFoam sales staff to scope spray foam jobs on metal sheds.
- Focus areas: accurate surface calculations, intuitive input workflow, persistent layout, and sales enablement tooling built on OpenAI-driven assistants.
- Out of scope: PDFs, database persistence, automated quoting, historical environmental context.

## 2. Platform Architecture
- **Frontend**: React 19 + TypeScript, bundled by Vite, styled with Tailwind CSS utility layer plus bespoke panel CSS.
- **State**: `LayoutContext` provides global state (section expansion, panel sizes, calculation mode, form data, advisor history, results). The state persists to `localStorage` under the key `yf:v1:ui` with runtime validation.
- **Backend**: Minimal Node HTTP server (no framework) exposing REST endpoints.
  - `POST /api/llm` → proxy to OpenAI chat completions (JSON request: `{ system, messages[] }`).
  - `POST /api/sales` → orchestrates sales benefit composition via `composePitch`.
- **Shared modules**: Calculation logic, presets, and sales rules live under `src/state`, `src/config`, `src/data`, and are shared by both client and server where practical.

## 3. User Interface
### 3.1 Layout
- Primary layout uses `react-resizable-panels` with three columns:
  1. **Inputs** (left) – collapsible sections stacked vertically.
  2. **Results** (centre) – status banner, result summary, totals, breakdown table.
  3. **Right stack** (right) – AI Advisor (top) and Export tools (bottom). Panel sizes persist between sessions.
- Section expansion state auto-collapses to preserve focus after a section is marked complete. Collapse delay: 300 ms.

### 3.2 Input Sections (in order)
1. **Dimensions** – Numeric inputs for length, width, wall height. Validation: >0, ≤50 m for length/width, ≤10 m for height.
2. **Pitch** – Dropdown of preset angles (`5°`, `10°`, `15°`, `22°`, `25°`, `30°`, `Unknown`). Selecting “Unknown” triggers auto-suggestion from width.
3. **Cladding** – Select between `corrugated` and `monoclad` (drives cladding factor).
4. **Members** – Roof member (`top_hat` or `c_channel`) and wall member (`top_hat` or `c_channel`).
5. **Spray Options** – Toggles for including roof battens and wall purlins. Manual acknowledgement button unlocks completion without toggles.
6. **Openings** – Summary card plus modal to manage counts for doors, windows, laserlight, custom deductions.
7. **Calculate Button** – Enabled only when `formSchema` validates.

### 3.3 Form Validation Rules
- Enforced by Zod schemas (`formDraftSchema` + `formSchema`).
- All numeric fields must be finite and within defined ranges. Members and cladding selections required. Openings may be zero.

### 3.4 Live Preview
- Displays aggregate summary (dimensions, pitch, cladding, members, opening count).
- Warning banner shows when any required input missing.
- Preview excludes any site selector row.

## 4. Calculation Engine (`src/state/results.ts`)
### 4.1 Surface Areas
- Roof base area: `length * width`.
- Side walls: `2 * (length * height)`.
- Gable rectangles: `2 * (width * height)`.
- Gable triangles: `(width * rise)` with `rise = (width / 2) * tan(pitchRadians)`.
- Pitch factor and cladding factor applied to roof and gable surfaces.

### 4.2 Openings
- Library-driven deduction per opening type. `laserlight` uses rafter length * width spec.
- Total deductions = sum of opening areas.

### 4.3 Member Spray Bands
- Roof battens (if selected and roof member is `top_hat`):
  - Spacing from presets: `spacing_presets.roof[cladding][member]` (mm → m).
  - Lineal metres: `2 * linesPerSide * length`, where `linesPerSide = ceil(rafterLength / spacing) + 1`.
  - Area: `lineal * widthPreset (0.12 m) * multiplier (0.9)`.
- Wall purlins (if selected and wall member is `c_channel`):
  - Spacing from presets: `spacing_presets.walls[member]`.
  - Side lineal metres + gable lineal metres computed similarly.
  - Area: `lineal * widthPreset (0.18 m) * multiplier (0.9)`.

### 4.4 Totals
- Surfaces subtotal = roof + walls + gables after multiplicative factors.
- Net surfaces = subtotal − openings.
- Net total = net surfaces + member spray totals.
- Result payload stores:
  - `jobId`: `job-${Date.now()}`.
  - `configuration`: dimensions label, pitch label, assumption flag, rafter length, cladding label, members label.
  - `breakdown`: raw figures for UI tables (roof base, side walls, etc.).

## 5. Results Presentation (`src/results/components`)
- Header shows “Results”, job identifier, and timestamp.
- Pending state: dashed panel with “Calculating…” message.
- Errors bubble via LayoutContext `results.error`.
- When ready: render `ConfigSummary`, `TotalsSummary`, `BreakdownTable` in order. Environmental snapshot removed.
- Toolbar currently contains “Edit inputs” button to restore input focus and panel proportions.

## 6. Export Panel (`src/components/export/ExportPanel.tsx`)
- Notes textarea (not persisted).
- Quote summary and email draft presented as read-only textareas for manual copy.
- Summary/email content derived from calculation results when available; otherwise fall back to form values. No suburb placeholders.

## 7. Sales & Advisor Tooling
### 7.1 AI Advisor (`src/components/AiAdvisorPanel.tsx`)
- Maintains chat history in LayoutContext `advisor.history`.
- System prompt: concise YetiFoam sales tone; no environmental context injected.
- Input disabled while awaiting response; uses `/api/llm` endpoint.

### 7.2 Sales Composer (`src/services/salesComposer.ts` & server counterpart)
- Dependencies: scenario detection, feedback store, cascades, benefits, comparisons.
- Workflow:
  1. Detect scenarios from `ComposeInput`.
  2. Load relevant snippets and feedback overrides.
  3. Build system prompt via `llmPlanner.buildSystemPrompt(snippets, calcSummary, feedback, overrides)`.
  4. Call `/api/llm` and parse JSON response (meta, benefits, comparison, objections).
  5. Append summary to sales log (local or server-side JSON file).
- Meta no longer tracks environment-related flags.

### 7.3 Sales Data Files
- `src/data/salesKB/*.json` stores benefits, cascades, comparisons, price rebuttals, etc. Entries may still mention structural uplift talking points but do not depend on runtime environmental data.
- Templates (`src/data/salesTemplates.json`) intentionally generic—no suburb placeholders.

## 8. Persistence & Storage
- `usePersistentState` handles serialization with runtime schema validation in development.
- Stored shape includes: `sections`, `panelSizes`, `advisor.history`, `form`, `results`, `mode`.
- Migrations handled by `src/state/persistence.ts` for legacy shapes (now without `Location`).

## 9. API Contracts
### 9.1 POST /api/llm
- Request: `{ system: string, messages: { role: 'system'|'user'|'assistant', content: string }[] }`.
- Response: `{ content: string }` or OpenAI-compatible envelope.
- Errors: `{ error: { type, message } }` with HTTP 4xx/5xx.

### 9.2 POST /api/sales
- Request mirrors `ComposeInput` (customer notes, calc summary, region stub).
- Response: `ComposeOutput` with `meta`, `benefits`, `comparison`, `objections`.
- Region currently passes through for logging only.

## 10. Calculations & Formula References
- Preset data located at `src/config/presets.json`:
  - `pitch_factors` map angle → multiplier.
  - `cladding_factors` map cladding → multiplier.
  - `spacing_presets` for roof and wall members.
  - `openings_library` area specifications.
- Formatting helpers in `src/results/utils/format.ts` (area formatting, etc.).

## 11. Testing & Tooling
- `npm run dev` → Vite frontend.
- `npm run server` → Node server with tsx runtime.
- `npm run dev:all` → concurrently run both (requires `.env`).
- `npm run build` → production bundle.
- `npm run test` → Vitest placeholder.
- Light unit tests may be added under `test/` (currently empty).

## 12. Future Enhancements
- Integrate sales composer UI (right stack) with feedback capture, snippet previews, and variant exports.
- Add regression tests for calculation engine (`test/calc.test.ts` placeholder ready).
- Extend export panel with PDF/email generation (Phase 5).
- Introduce authentication and persistent storage if/when multi-user environment required.

## 13. Change Log
- **2025-02-15** – Removed site selector input and environmental data fetch. Updated calculation flow, advisor prompt, sales composer meta, Vite proxy, and documentation accordingly.
- **2024-12-04** – Added advisor panel integration and initial sales composer stubs.
- **2024-10-18** – Implemented calculation engine, openings modal, and persistent layout.
