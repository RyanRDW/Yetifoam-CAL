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
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-6">
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
        <SprayOptions onInteract={() => setSprayAcknowledged(true)} />
        {!sprayComplete && (
          <button
            type="button"
            className="mt-3 text-xs text-blue-600 hover:underline"
            onClick={() => setSprayAcknowledged(true)}
          >
            Mark complete
          </button>
        )}
      </CollapsibleSection>

      <CollapsibleSection id="open" title="Openings" isComplete={openingsComplete}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            Track deductions for doors, windows, laserlight and custom areas. Quantities persist between sessions.
          </p>
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span>Total openings selected: {openingsTotal}</span>
            <button
              type="button"
              className="rounded-md border border-blue-600 px-3 py-1 text-sm font-semibold text-blue-600 hover:bg-blue-50"
              onClick={() => setOpeningsModalOpen(true)}
            >
              Manage Openings…
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <CalculateButton />

      <OpeningsModal
        open={openingsModalOpen}
        counts={form.openings}
        onApply={handleApplyOpenings}
        onClose={() => setOpeningsModalOpen(false)}
      />

      {!formValid && (
        <p className="text-xs text-slate-500">
          Complete all required inputs above to enable calculation. Your entries persist under local storage key
          <code className="ml-1 rounded bg-slate-100 px-1">yf:v1:ui</code>.
        </p>
      )}
    </div>
  );
}
