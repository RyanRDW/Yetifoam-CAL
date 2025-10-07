import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import type { CalculationResult } from "../../state/LayoutContext";
import type { FormState } from "../../state/formSchema";
import { useLayout } from "../../state/LayoutContext";
import { formatArea, formatNumber } from "../../results/utils/format";
import { DEFAULT_ADVISOR_CLOSING, DEFAULT_ADVISOR_VARIANTS } from "../../services/llmClient";

function formatSummary(form: FormState, result: CalculationResult | null, notes: string) {
  const lines: string[] = [];
  lines.push("YetiFoam Shed Quote");
  lines.push("");
  lines.push(`Dimensions (L×W×H): ${resolveDimensions(form, result)}`);
  lines.push(`Pitch: ${resolvePitch(form, result)} | Cladding: ${resolveCladding(form, result)}`);
  lines.push(`Spray total: ${resolveSprayTotal(result)}`);
  const trimmedNotes = notes.trim();
  if (trimmedNotes) {
    lines.push("");
    lines.push("Notes:");
    lines.push(trimmedNotes);
  }
  return lines.join("\n");
}

function formatEmail(form: FormState, result: CalculationResult | null, notes: string) {
  const parts: string[] = [];
  const subject = "YetiFoam shed quote";
  parts.push(`Subject: ${subject}`);
  parts.push("");
  parts.push("Hi,");
  parts.push("");
  parts.push("Here is your YetiFoam shed insulation summary:");
  parts.push(`- Dimensions (L×W×H): ${resolveDimensions(form, result)}`);
  parts.push(`- Pitch: ${resolvePitch(form, result)} | Cladding: ${resolveCladding(form, result)}`);
  parts.push(`- Spray total: ${resolveSprayTotal(result)}`);
  const trimmedNotes = notes.trim();
  if (trimmedNotes) {
    parts.push("");
    parts.push(`Notes: ${trimmedNotes}`);
  }
  parts.push("");
  parts.push("Regards,");
  parts.push("YetiFoam TAS");
  return parts.join("\n");
}

export default function ExportPanel() {
  const { state } = useLayout();
  const [note, setNote] = useState("");
  const lastResult = state.results.lastResult;
  const advisorHistory = state.advisor.history;
  const latestAdvisor = advisorHistory[advisorHistory.length - 1];

  const summary = useMemo(() => formatSummary(state.form, lastResult, note), [state.form, lastResult, note]);
  const emailText = useMemo(() => formatEmail(state.form, lastResult, note), [state.form, lastResult, note]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 48;
    let cursorY = 64;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('YetiFoam Shed Quote', marginX, cursorY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(12);
    cursorY += 24;
    const summaryLines = doc.splitTextToSize(summary, 510);
    doc.text(summaryLines, marginX, cursorY);
    cursorY += summaryLines.length * 16 + 8;

    const advisorVariants = (latestAdvisor?.variants?.length ? latestAdvisor.variants : DEFAULT_ADVISOR_VARIANTS) ?? [];
    const advisorClosing = latestAdvisor?.closing || DEFAULT_ADVISOR_CLOSING;

    doc.setFont('Helvetica', 'bold');
    doc.text('Advisor Variants', marginX, cursorY);
    cursorY += 18;
    doc.setFont('Helvetica', 'normal');
    advisorVariants.forEach((variant) => {
      const wrapped = doc.splitTextToSize(`• ${variant}`, 510);
      doc.text(wrapped, marginX, cursorY);
      cursorY += wrapped.length * 16;
    });

    cursorY += 12;
    doc.setFont('Helvetica', 'bold');
    doc.text('Advisor Closing', marginX, cursorY);
    cursorY += 18;
    doc.setFont('Helvetica', 'normal');
    doc.text(doc.splitTextToSize(advisorClosing, 510), marginX, cursorY);

    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    doc.save(`yetifoam-quote-${timestamp}.pdf`);
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="app-surface-glass rounded-3xl px-5 py-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600/80">Export</h3>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Prepare follow-up material</h2>
        <p className="mt-2 text-sm text-slate-600">Capture any notes before copying the summary or email draft below.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <textarea
            className="h-28 w-full flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add optional notes or next steps..."
          />
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="h-fit rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-400 hover:to-cyan-400"
          >
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="app-surface-glass flex flex-col rounded-3xl px-5 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Quote summary</h3>
            <span className="text-xs font-medium text-slate-400">Copy + paste</span>
          </div>
          <textarea
            readOnly
            className="mt-3 h-full min-h-[180px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-inner"
            value={summary}
          />
        </div>
        <div className="app-surface-glass flex flex-col rounded-3xl px-5 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Email draft</h3>
            <span className="text-xs font-medium text-slate-400">Copy + paste</span>
          </div>
          <textarea
            readOnly
            className="mt-3 h-full min-h-[180px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-inner"
            value={emailText}
          />
        </div>
      </div>
    </div>
  );
}

function resolveDimensions(form: FormState, result: CalculationResult | null) {
  if (result?.configuration.dimensions) {
    return result.configuration.dimensions;
  }
  const { length, width, height } = form.dimensions;
  if (isFiniteNumber(length) && isFiniteNumber(width) && isFiniteNumber(height)) {
    return `${formatNumber(length)} × ${formatNumber(width)} × ${formatNumber(height)} m`;
  }
  return "—";
}

function resolvePitch(form: FormState, result: CalculationResult | null) {
  if (result?.configuration.pitchLabel) {
    return result.configuration.pitchLabel;
  }
  const selected = form.pitch.selected;
  if (!selected) {
    return "—";
  }
  if (selected === "unknown") {
    return form.pitch.suggested ? `${form.pitch.suggested}° (assumed)` : "Unknown";
  }
  return `${selected}°`;
}

function resolveCladding(form: FormState, result: CalculationResult | null) {
  if (result?.configuration.cladding) {
    return result.configuration.cladding;
  }
  const type = form.cladding.type;
  return toTitle(type) ?? "—";
}

function resolveSprayTotal(result: CalculationResult | null) {
  const total = result?.breakdown?.netTotal;
  return total != null ? formatArea(total) : "—";
}

function toTitle(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isFiniteNumber(value: number | null): value is number {
  return value != null && Number.isFinite(value);
}
