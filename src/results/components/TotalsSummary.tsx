import type { CalculationResult } from '../../state/LayoutContext';
import { formatArea } from '../utils/format';

type Props = {
  breakdown: CalculationResult['breakdown'] | null;
};

type Tile = {
  id: string;
  label: string;
  description: string;
  value: string;
  featured?: boolean;
};

export function TotalsSummary({ breakdown }: Props) {
  if (!breakdown) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-slate-500">
        <header className="mb-2 text-sm font-semibold text-slate-600">Totals</header>
        <p>Run a calculation to see spray totals here.</p>
      </section>
    );
  }

  const surfaceAfterOpenings = breakdown.surfacesSubtotal - breakdown.openingsDeducted;
  const showMembers = (breakdown.membersTotal ?? 0) > 0;

  const tiles: Tile[] = [
    {
      id: 'surfaces',
      label: 'Surfaces subtotal',
      description: 'Before openings deduction',
      value: formatArea(breakdown.surfacesSubtotal),
    },
    {
      id: 'openings',
      label: 'Openings deducted',
      description: 'Total removed from walls and roof',
      value: formatArea(-breakdown.openingsDeducted, { signed: true }),
    },
    {
      id: 'after-openings',
      label: 'Net after openings',
      description: 'Surfaces subtotal minus openings',
      value: formatArea(surfaceAfterOpenings),
    },
  ];

  if (showMembers) {
    tiles.push({
      id: 'members',
      label: 'Members added',
      description: 'Battens and purlins included',
      value: formatArea(breakdown.membersTotal, { signed: true }),
    });
  }

  tiles.push({
    id: 'total',
    label: 'Total spray area',
    description: 'Final area to spray',
    value: formatArea(breakdown.netTotal),
    featured: true,
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Totals</h3>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {tiles.map((tile) => (
          <article
            key={tile.id}
            className={[
              'rounded-lg border border-slate-100 bg-white/90 p-4 transition',
              tile.featured ? 'border-blue-200 shadow-md' : 'shadow-sm',
            ].join(' ')}
          >
            <header className="flex items-baseline justify-between gap-2">
              <strong className={['text-sm', tile.featured ? 'text-blue-600' : 'text-slate-600'].join(' ')}>{tile.label}</strong>
              <span className={['font-semibold', tile.featured ? 'text-xl text-blue-700' : 'text-base text-slate-900'].join(' ')}>{tile.value}</span>
            </header>
            {tile.description && <p className="mt-1 text-xs text-slate-500">{tile.description}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
