import { useLayout } from '../../state/LayoutContext';

interface SprayOptionsProps {
  onInteract?: () => void;
}

export function SprayOptions({ onInteract }: SprayOptionsProps) {
  const {
    state: {
      form: {
        spray: { includeRoofBattens, includeWallPurlins },
      },
    },
    updateForm,
  } = useLayout();

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-slate-700">Include spray coverage for</legend>
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={includeRoofBattens}
          onChange={(event) => {
            onInteract?.();
            updateForm((prev) => ({
              ...prev,
              spray: { ...prev.spray, includeRoofBattens: event.target.checked },
            }));
          }}
        />
        <span>
          Roof Battens
          <span className="block text-xs font-normal text-slate-500">
            Adds 0.12m spray band × 0.9 multiplier per line.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={includeWallPurlins}
          onChange={(event) => {
            onInteract?.();
            updateForm((prev) => ({
              ...prev,
              spray: { ...prev.spray, includeWallPurlins: event.target.checked },
            }));
          }}
        />
        <span>
          Wall Purlins
          <span className="block text-xs font-normal text-slate-500">
            Adds 0.18m spray band × 0.9 multiplier per horizontal line.
          </span>
        </span>
      </label>
    </fieldset>
  );
}
