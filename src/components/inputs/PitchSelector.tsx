import { useMemo, useState } from 'react';
import { ImageTile } from '../common/ImageTile';
import { useLayout } from '../../state/LayoutContext';
import { pitchAngles, suggestPitch } from '../../state/formSchema';

export function PitchSelector() {
  const {
    state: { form },
    updateForm,
  } = useLayout();

  const [touched, setTouched] = useState(false);

  const width = form.dimensions.width;
  const computedSuggestion = useMemo(
    () => (width && Number.isFinite(width) && width > 0 ? suggestPitch(width) : '15'),
    [width],
  );

  const selected = form.pitch.selected;
  const suggestion = form.pitch.suggested ?? computedSuggestion;

  const handleSelect = (value: string) => {
    setTouched(true);
    if (value === 'unknown') {
      updateForm((prev) => ({
        ...prev,
        pitch: {
          selected: 'unknown',
          suggested: suggestion,
          assumed: true,
        },
      }));
      return;
    }

    updateForm((prev) => ({
      ...prev,
      pitch: {
        selected: value as typeof pitchAngles[number],
        suggested: suggestion,
        assumed: false,
      },
    }));
  };

  const error = touched && !selected ? 'Select a pitch' : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pitchAngles.map((angle) => (
          <ImageTile
            key={angle}
            label={`${angle}° Pitch`}
            imageFile={`shed-pitch-${angle}deg.jpg`}
            selected={selected === angle}
            onClick={() => handleSelect(angle)}
            footer={<span className="text-[11px] text-slate-500">Factor ready</span>}
          />
        ))}
        <ImageTile
          label="Unknown"
          imageFile="shed-pitch-unknown.jpg"
          selected={selected === 'unknown'}
          badge={<span>⚠️ Assumed</span>}
          onClick={() => handleSelect('unknown')}
          description={<span>We will use {suggestion}° based on width.</span>}
        />
      </div>
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Suggested pitch based on {width ? `${width}m width` : 'width'}: {suggestion}°
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
