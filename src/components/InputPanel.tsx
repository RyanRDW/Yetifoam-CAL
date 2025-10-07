import { useMemo, useState } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { Dimensions } from './inputs/Dimensions';
import { PitchSelector } from './inputs/PitchSelector';
import { CladdingSelector } from './inputs/CladdingSelector';
import { MemberSelectors } from './inputs/MemberSelectors';
import { SprayOptions } from './inputs/SprayOptions';
import { OpeningsModal } from './inputs/OpeningsModal';
import { CalculateButton } from './inputs/CalculateButton';
import { useLayout } from '../state/LayoutContext';
import { isFormValid, type OpeningType } from '../state/formSchema';

function isDimensionComplete(value: number | null, max: number) {
  return value != null && Number.isFinite(value) && value > 0 && value <= max;
}

export function InputPanel() {
  const {
    state: { form },
    updateForm,
  } = useLayout();

  const [openingsModalOpen, setOpeningsModalOpen] = useState(false);
  const [sprayAcknowledged, setSprayAcknowledged] = useState(false);

  const dimensionsComplete =
    isDimensionComplete(form.dimensions.length, 50) &&
    isDimensionComplete(form.dimensions.width, 50) &&
    isDimensionComplete(form.dimensions.height, 10);

  const pitchComplete = Boolean(form.pitch.selected && (form.pitch.selected !== 'unknown' || form.pitch.suggested));
  const claddingComplete = Boolean(form.cladding.type);
  const membersComplete = Boolean(form.members.roof && form.members.walls);
  const openingsTotal = useMemo(
    () => Object.values(form.openings).reduce((total, qty) => total + qty, 0),
    [form.openings],
  );
  const sprayComplete = sprayAcknowledged || form.spray.includeRoofBattens || form.spray.includeWallPurlins;
  const openingsComplete = openingsTotal > 0;

  const formValid = isFormValid(form);

  const handleApplyOpenings = (next: Record<OpeningType, number>) => {
    updateForm((prev) => ({
      ...prev,
      openings: next,
    }));
    setOpeningsModalOpen(false);
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-5 py-10 lg:px-8">
      <div className="app-surface-glass rounded-3xl px-6 py-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-600/80">Configuration</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Build the shed brief</h1>
        <p className="mt-3 max-w-xl text-sm text-slate-600">
          Complete each section to calculate spray coverage. Progressively reveal the details to keep the conversation with your
          customer focused and confident.
        </p>
      </div>

      <div className="space-y-4 pb-4">
        <CollapsibleSection id="dim" title="Dimensions" isComplete={dimensionsComplete}>
          <Dimensions />
        </CollapsibleSection>

        <CollapsibleSection id="pitch" title="Pitch" isComplete={pitchComplete}>
          <PitchSelector />
        </CollapsibleSection>

        <CollapsibleSection id="clad" title="Cladding" isComplete={claddingComplete}>
          <CladdingSelector />
        </CollapsibleSection>

        <CollapsibleSection id="mem" title="Members" isComplete={membersComplete}>
          <MemberSelectors />
        </CollapsibleSection>

        <CollapsibleSection id="opt" title="SprayOptions" isComplete={sprayComplete}>
          <div className="space-y-4">
            <SprayOptions onInteract={() => setSprayAcknowledged(true)} />
            {!sprayComplete && (
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
                onClick={() => setSprayAcknowledged(true)}
              >
                Mark as complete
              </button>
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="open" title="Openings" isComplete={openingsComplete}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              Track deductions for doors, windows, laserlite and custom areas. Counts persist automatically and inform the
              calculation breakdown.
            </p>
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
              <span className="font-medium">Total openings selected: {openingsTotal}</span>
              <button
                type="button"
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-100"
                onClick={() => setOpeningsModalOpen(true)}
              >
                Manage openings
              </button>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div className="app-surface-glass mt-auto rounded-3xl px-6 py-6">
        <CalculateButton />
        {!formValid && (
          <p className="mt-3 text-xs text-slate-500">
            Complete all required inputs to enable calculation. Your entries persist automatically under the
            <code className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-[10px]">yf:v1:ui</code> key.
          </p>
        )}
      </div>

      <OpeningsModal
        open={openingsModalOpen}
        counts={form.openings}
        onApply={handleApplyOpenings}
        onClose={() => setOpeningsModalOpen(false)}
      />
    </div>
  );
}
