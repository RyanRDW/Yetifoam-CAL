# YetiFoam Shed Calculator – Functional Specification (Updated)

 _Last revised: 2025-02-17_

This specification captures the behaviour and architecture of the current YetiFoam Shed Calculator after removing the legacy site-selection and environmental data features. It is the primary reference for future development. Keep the document in sync with implementation.

## 1. Product Scope
- Desktop-oriented estimator for YetiFoam sales staff to scope spray foam jobs on metal sheds.
- Focus areas: accurate surface calculations, intuitive input workflow, persistent layout, sales enablement tooling powered by xAI Grok with OpenAI fallback, and CRM-ready PDF export.
- Out of scope: database persistence, automated quoting, historical environmental context.

## 2. Platform Architecture
- **Frontend**: React 19 + TypeScript, bundled by Vite, styled with Tailwind CSS utility layer plus bespoke panel CSS.
- **State**: `LayoutContext` provides global state (section expansion, panel sizes, calculation mode, form data, advisor history, results). The state persists to `localStorage` under the key `yf:v1:ui` with runtime validation.
- **Backend**: Minimal Node HTTP server (no framework) exposing REST endpoints.
  - `POST /api/llm` → accepts `{ form, feedback, provider }`, prefers xAI Grok chat completions (model `grok-4-latest`, temperature 0.7) using `GROK_API_KEY`, and automatically falls back to OpenAI chat completions when Grok errors or is unavailable.
  - `POST /api/sales` → mirrors `/api/llm` with sales-focused prompting while sharing the Grok→OpenAI fallback chain.
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

-## 6. Export Panel (`src/components/export/ExportPanel.tsx`)
- Notes textarea (not persisted).
- Quote summary and email draft presented as read-only textareas for manual copy.
- "Download PDF" button invokes jsPDF to generate an A4 document containing the quote summary, optional notes, advisor variants, and closing language (defaults apply when no advisor history exists).
- Summary/email/PDF content draws from calculation results when available; otherwise values fall back to the current form state. No suburb placeholders.

## 7. Sales & Advisor Tooling
### 7.1 AI Advisor (`src/components/AiAdvisorPanel.tsx`)
- Uses LayoutContext form state, validates it with `formSchema` before any network call, and blocks the request until the form passes.
- Includes a Grok/OpenAI toggle that forwards the preferred provider; the backend automatically falls through to the alternate provider if the primary errors.
- UI renders the variants as bullet points with a closing paragraph and persists the last 10 entries (plus selected provider) in `advisor.history`.
- When both providers (or validation) fail, the panel surfaces the static fallback variants (`Standard foam…`, `Premium option…`) and the closing "Let's discuss the best fit for your shed."

### 7.2 Sales Composer (`src/components/sales/SalesPanel.tsx`)
- Reuses the same validated form payload, allowing optional customer notes and internal feedback that travel via the `feedback` field.
- Posts `{ form, feedback, provider }` to `/api/sales` and renders the resulting variants/closing, mirroring the advisor fallback behaviour across Grok/OpenAI.
- Legacy scenario detection, snippet selection, and feedback storage modules remain available for future expansions but are not part of the launch-critical flow.

### 7.3 Server Services (`server/services/llmPlanner.ts`, `server/services/salesComposer.ts`)
- Both services construct chat requests from the incoming form/feedback, hitting Grok (`grok-4-latest`, temperature 0.7) first and cascading to OpenAI (`gpt-4o-mini` by default) when needed.
- Responses are normalised into simple string arrays and a single closing string before being returned to the client; static copy remains the final fallback.
- Default fallbacks: variants revert to the two-line static copy noted above, and closings fall back to "Let's discuss the best fit for your shed." on failure.

### 7.4 Sales Data Files
- `src/data/salesKB/*.json` and related stores remain as reference data for future rule engines but are currently unused in the launch path.
- Templates (`src/data/salesTemplates.json`) stay generic with no location placeholders until richer composer logic returns.

### 7.5 CRM Export Hook (`src/components/export/ExportPanel.tsx`)
- Uses jsPDF to generate a downloadable PDF containing the quote summary and the latest advisor variants/closing.
- Accessible via the “Download PDF” action alongside the manual copy/paste text areas.

## 8. Persistence & Storage
- `usePersistentState` handles serialization with runtime schema validation in development.
- Stored shape includes: `sections`, `panelSizes`, `advisor.history`, `form`, `results`, `mode`.
- Migrations handled by `src/state/persistence.ts` for legacy shapes (now without `Location`).

## 9. API Contracts
### 9.1 POST /api/llm
- Request: `{ form: ValidFormState, feedback?: Record<string, unknown>, provider?: 'grok' | 'openai' }`. The backend validates the form with the same Zod schema used on the client and rejects incomplete payloads with `400` errors.
- Response: `{ variants: string[], closing: string }`. The service prefers Grok and cascades to OpenAI (then static copy) when upstreams fail.
- Errors: `{ error: { type, message } }` with HTTP 4xx/5xx, including `rate_limit` and `auth` types from middleware.

### 9.2 POST /api/sales
- Request: identical contract to `/api/llm`; clients may include extra metadata in `feedback` (customer notes, internal comments).
- Response: `{ variants: string[], closing: string }` with the sales-specific fallback copy (`Basic package…`, `Enhanced package…`, closing "This solution ensures optimal insulation—ready to proceed?") when model calls fail.
- Errors: same envelope as `/api/llm`.

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
- `npm run build` / `npm run build:client` / `npm run build:server` → production bundles for static + serverless deployment.
- `npm run deploy` / `npm run deploy:prod` → wrap `vercel deploy` commands.
- `npm run test` → Vitest suites covering advisor and sales contracts, including Grok/OpenAI fallback handling and client validation.
- Additional regression tests (calculation engine, UI flows) remain TODO.

## 12. Future Enhancements
- Integrate deeper sales composer tooling (snippet previews, notes persistence, CRM sync).
- Add regression tests for the calculation engine (`test/calc.test.ts` placeholder ready) and PDF generation harness.
- Explore authentication and persistent storage if/when multi-user environments are required.

## 13. Change Log
- **2025-02-17** – Switched `/api/llm` and `/api/sales` to xAI Grok (`grok-4-latest`) with `{ form, feedback, provider } → { variants, closing }`, layered OpenAI fallback, added advisor provider toggle, jsPDF CRM export, deployment scaffolding, and extended Vitest coverage.
- **2025-02-15** – Removed site selector input and environmental data fetch. Updated calculation flow, advisor prompt, sales composer meta, Vite proxy, and documentation accordingly.
- **2024-12-04** – Added advisor panel integration and initial sales composer stubs.
- **2024-10-18** – Implemented calculation engine, openings modal, and persistent layout.
