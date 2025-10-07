# YetiFoam Shed Calculator

## Overview
- Desktop estimator for YetiFoam sales staff to scope spray-foam jobs on metal sheds.
- React 19 + TypeScript front end (Vite, Tailwind) backed by a lightweight Node service for AI assistance and sales copy generation.
- xAI Grok (`grok-4-latest`, temperature 0.7) is the default LLM provider with automatic OpenAI fallback when Grok is unavailable; users can toggle the provider in the Advisor panel at runtime.
- CRM export tooling now generates a customer-ready PDF via jsPDF with configuration summary, advisor variants, and closing language.
- Vercel deployment is first-class: static client build alongside a serverless API entry point and ready-to-run deploy scripts.

## Getting Started
1. `npm install`
2. Copy `.env.example` → `.env` and set `GROK_API_KEY`. Optional: `OPENAI_API_KEY` and `OPENAI_MODEL` (defaults to `gpt-4o-mini`).
3. `npm run dev:all` to launch Vite (5173) and the Node API server (8788) together. Both commands respect `.env` overrides for ports and keys.
4. Visit `http://localhost:5173` and confirm the Advisor toggle, AI responses, and PDF export. The dev servers hot-reload.

## LLM Providers
- Requests to `/api/llm` (advisor) and `/api/sales` (sales copy) post `{ form, feedback, provider }`.
- Server services attempt Grok first via `https://api.x.ai/v1/chat/completions` with the configured `GROK_API_KEY`; failures fall back to OpenAI chat completions using `OPENAI_API_KEY` and `OPENAI_MODEL`.
- Responses are normalised into `{ variants: string[], closing: string }` with robust fallback copy if parsing fails.
- The client `AiAdvisorPanel` persists the chosen provider (`grok` or `openai`) in layout state, ensuring repeated prompts honour the toggle.

## CRM Export
- `src/components/export/ExportPanel.tsx` renders a summary textarea, email draft, and a **Download PDF** action.
- PDFs include: configuration summary, spray totals, optional notes, latest advisor variants, and closing message.
- jsPDF is bundled as a production dependency, so PDFs can be generated offline without additional services.

## Deployment
- `vercel.json` provisions a static client build (`dist/`) and a Node serverless function at `server/index.ts`.
- Scripts:
  - `npm run build` → production client bundle via Vite.
  - `npm run build:client` / `npm run build:server` → split builds when needed.
  - `npm run deploy` → `vercel deploy` preview.
  - `npm run deploy:prod` → `vercel deploy --prod`.
- Recommended CLI flow: `npm run build`, `npm run build:server`, `npm run deploy:prod` after verifying.

## Verification & QA
- `npm run test` executes Vitest suites validating advisor and sales response parsing plus client form validation.
- Manual pass checklist:
  - Run `npm run dev:all` and ensure no startup errors in the terminal.
  - Validate Advisor panel prompts using both Grok and OpenAI toggles; confirm fallbacks when API keys are missing.
  - Generate CRM export PDF and verify variants/closing are captured even without a prior advisor response (defaults apply).
- Record console/network errors during verification; none should appear in a clean run.

## Known Issues
- `npm run dev:all` occupies ports 5173 and 8788; stop existing processes or adjust `.env` (`VITE_PORT`, `PORT`) before launching.
- External API keys are required for Grok/OpenAI responses; without them the UI displays fallback messaging.

## Workflow Notes
- Persisted layout state lives under `localStorage` key `yf:v1:ui`; changes to state shape must remain backward compatible.
- Only ASCII content is checked into source unless a file already contains Unicode (advisor copy includes en-dash).
- Update this README and `yetifoam-calculator-spec.md` whenever major features land to keep project memory accurate.

## Commit & Push Guide
- `git status` → review staged/unstaged files.
- `git add <files>` → stage changes.
- `git commit -m "<summary>"` → use imperative tense.
- `git push origin <branch>` → default branch is typically `main` (confirm with `git branch --show-current`).

## AI Agent Chain
- **Permanent Project Summariser Agent** keeps long-term documentation in sync (README + spec).
- **Build Agent** owns feature implementation across UI/server/services.
- **Calculation Engine Agent** safeguards numerical accuracy and formulas.
- **QA & Verification Agent** plans tests, captures logs, and reports gaps.
- **Release Ops Agent** manages environment readiness, deploy scripts, and production sign-off.

