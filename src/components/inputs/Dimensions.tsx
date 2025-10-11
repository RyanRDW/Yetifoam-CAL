import { useMemo, useState } from 'react';
import { useLayout } from '../../state/LayoutContext';
import { suggestPitch } from '../../state/formSchema';

type DimensionKey = 'length' | 'width' | 'height';

const DIMENSION_LIMITS: Record<DimensionKey, { label: string; max: number; image: string; helper: string }> = {
  length: {
    label: 'Length (m)',
    max: 50,
    image: 'dimension-length.jpg',
    helper: 'Measured along the gutter/eave direction.',
  },
  width: {
    label: 'Width (m)',
    max: 50,
    image: 'dimension-width.jpg',
    helper: 'Across the gable end; used for pitch suggestions.',
  },
  height: {
    label: 'Wall Height (m)',
    max: 10,
    image: 'dimension-height.jpg',
    helper: 'Eave height measured from slab to wall top.',
  },
};

export function Dimensions() {
  const {
    state: { form },
    updateForm,
  } = useLayout();

  const [touched, setTouched] = useState<Record<DimensionKey, boolean>>({ length: false, width: false, height: false });
  const [imageFailed, setImageFailed] = useState<Record<DimensionKey, boolean>>({ length: false, width: false, height: false });

  const errors = useMemo(() => {
    const next: Partial<Record<DimensionKey, string | null>> = {};
    for (const key of Object.keys(DIMENSION_LIMITS) as DimensionKey[]) {
      const value = form.dimensions[key];
      const { max } = DIMENSION_LIMITS[key];
      if (value == null) {
        next[key] = touched[key] ? 'Required' : null;
        continue;
      }
      if (value <= 0) {
        next[key] = 'Must be greater than 0';
      } else if (value > max) {
        next[key] = `Max ${max}m`;
      } else {
        next[key] = null;
      }
    }
    return next;
  }, [form.dimensions, touched]);

  const handleChange = (key: DimensionKey, raw: string) => {
    const numeric = raw.trim() ? Number(raw) : null;

    updateForm((prev) => {
      const nextDimensions = { ...prev.dimensions, [key]: numeric != null && Number.isFinite(numeric) ? numeric : null };
      let nextPitch = prev.pitch;

      if (key === 'width') {
        const widthValue = nextDimensions.width;
        const suggestion = widthValue && Number.isFinite(widthValue) && widthValue > 0 ? suggestPitch(widthValue) : null;
        nextPitch = {
          ...prev.pitch,
          suggested: suggestion ?? prev.pitch.suggested,
          assumed: prev.pitch.selected === 'unknown' ? prev.pitch.assumed : false,
        };
        if (prev.pitch.selected === 'unknown') {
          nextPitch = { ...nextPitch, assumed: true, suggested: suggestion ?? prev.pitch.suggested ?? '15' };
        }
      }

      return {
        ...prev,
        dimensions: nextDimensions,
        pitch: nextPitch,
      };
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(Object.keys(DIMENSION_LIMITS) as DimensionKey[]).map((key) => {
        const config = DIMENSION_LIMITS[key];
        const value = form.dimensions[key];
        const error = errors[key];
        return (
          <div key={key} className="flex flex-col gap-2">
            <label className="text-base font-semibold text-slate-900" htmlFor={`dimension-${key}`}>
              {config.label}
            </label>
            <input
              id={`dimension-${key}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={value ?? ''}
              onChange={(event) => handleChange(key, event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, [key]: true }))}
              className={[
                'w-full rounded-md border px-3 py-2 text-sm shadow-sm transition',
                error ? 'border-red-500 focus:border-red-500 focus:ring-red-400/50' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/30',
              ]
                .filter(Boolean)
                .join(' ')}
              placeholder={`0 – ${config.max}`}
            />
            <figure className="flex flex-col gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
              <div className="flex h-32 items-center justify-center overflow-hidden rounded-md bg-white/60">
                {!imageFailed[key] ? (
                  <img
                    src={`/images/${config.image}`}
                    alt={config.label}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed((prev) => ({ ...prev, [key]: true }))}
                  />
                ) : (
                  <span className="px-3 text-center text-[11px] text-slate-500">Illustration unavailable ({config.image})</span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-slate-600">{config.helper}</p>
            </figure>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
