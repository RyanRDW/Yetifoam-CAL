import { useMemo, useState } from "react";
import type { CalculationResult } from "../../state/LayoutContext";
import type { FormState } from "../../state/formSchema";
import { useLayout } from "../../state/LayoutContext";
import { formatArea, formatNumber } from "../../results/utils/format";

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

  const summary = useMemo(() => formatSummary(state.form, lastResult, note), [state.form, lastResult, note]);
  const emailText = useMemo(() => formatEmail(state.form, lastResult, note), [state.form, lastResult, note]);

  return (
    <div className="p-3 grid gap-12">
      <section>
        <h3 className="font-semibold mb-2">Notes (not saved)</h3>
        <textarea
          className="w-full h-28 border p-2"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </section>

      <section>
        <h3 className="font-semibold mb-2">Quote Summary (copy manually)</h3>
        <textarea readOnly className="w-full h-40 border p-2" value={summary} />
      </section>

      <section>
        <h3 className="font-semibold mb-2">Email Draft (copy manually)</h3>
        <textarea readOnly className="w-full h-56 border p-2" value={emailText} />
      </section>
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
