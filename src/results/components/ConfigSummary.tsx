import type { CalculationResult } from '../../state/LayoutContext';
import { formatNumber } from '../utils/format';

type Props = {
  configuration: CalculationResult['configuration'];
};

export function ConfigSummary({ configuration }: Props) {
  const items: { label: string; value: string }[] = [
    { label: 'Dimensions', value: configuration.dimensions || '--' },
    { label: 'Pitch', value: configuration.pitchLabel || '--' },
    {
      label: 'Rafter length',
      value:
        configuration.rafterLength != null
          ? `${formatNumber(configuration.rafterLength)} m`
          : '--',
    },
    { label: 'Cladding', value: configuration.cladding || '--' },
    { label: 'Members', value: configuration.members || '--' },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Configuration</h3>
        {configuration.assumed && <span className="text-xs text-amber-600">Pitch assumed</span>}
      </header>
      <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-slate-700">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{item.label}</dt>
            <dd className="mt-1 font-medium text-slate-800">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
