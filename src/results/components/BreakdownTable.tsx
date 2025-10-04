import type { CalculationResult } from '../../state/LayoutContext';
import { formatArea, formatNumber } from '../utils/format';

type Props = {
  breakdown: CalculationResult['breakdown'] | null;
};

type Row = {
  key: string;
  label: string;
  value: number;
  signed?: boolean;
  accent?: 'total' | 'subtotal' | 'deduction' | 'addition';
};

export function BreakdownTable({ breakdown }: Props) {
  if (!breakdown) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-4 text-sm text-slate-500">
        <header className="mb-2 text-sm font-semibold text-slate-600">Spray breakdown</header>
        <p>No calculation run yet. Calculate to populate the spray area breakdown.</p>
      </section>
    );
  }

  const rows: Row[] = [
    { key: 'roof', label: 'Roof surfaces', value: breakdown.roofBase },
    { key: 'side', label: 'Side walls', value: breakdown.sideWalls },
    { key: 'gable_rect', label: 'Gable rectangles', value: breakdown.gableRectangles },
    { key: 'gable_tri', label: 'Gable triangles', value: breakdown.gableTriangles },
    { key: 'subtotal', label: 'Surfaces subtotal', value: breakdown.surfacesSubtotal, accent: 'subtotal' },
    { key: 'openings', label: 'Openings deducted', value: -breakdown.openingsDeducted, signed: true, accent: 'deduction' },
  ];

  if (breakdown.roofBattens != null) {
    rows.push({
      key: 'roof_battens',
      label: 'Roof battens',
      value: breakdown.roofBattens,
      signed: true,
      accent: 'addition',
    });
  }

  if (breakdown.wallPurlins != null) {
    rows.push({
      key: 'wall_purlins',
      label: 'Wall purlins',
      value: breakdown.wallPurlins,
      signed: true,
      accent: 'addition',
    });
  }

  if (breakdown.membersTotal) {
    rows.push({
      key: 'members_total',
      label: 'Members total',
      value: breakdown.membersTotal,
      accent: 'subtotal',
    });
  }

  rows.push({ key: 'net_total', label: 'Net total', value: breakdown.netTotal, accent: 'total' });

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Spray breakdown</h3>
          <p className="text-xs text-slate-500">
            Pitch factor ×{formatNumber(breakdown.pitchFactor)} · Cladding factor ×{formatNumber(breakdown.claddingFactor)}
          </p>
        </div>
      </header>
      <table className="w-full text-sm text-slate-700">
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.key} className={row.accent === 'total' ? 'font-semibold text-slate-900' : ''}>
              <td className="py-2 pr-3">
                <span
                  className={
                    row.accent === 'subtotal'
                      ? 'text-slate-900'
                      : row.accent === 'deduction'
                        ? 'text-rose-600'
                        : row.accent === 'addition'
                          ? 'text-emerald-600'
                          : 'text-slate-700'
                  }
                >
                  {row.label}
                </span>
                {row.key === 'openings' && breakdown.openingDetails.length > 0 && (
                  <ul className="mt-1 space-y-1 text-xs text-slate-500">
                    {breakdown.openingDetails.map((opening) => (
                      <li key={opening.id}>
                        {opening.label}: {opening.quantity} × {formatArea(opening.area / opening.quantity, { signed: false })} →
                        {' '}
                        {formatArea(-opening.area, { signed: true })}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="py-2 text-right text-slate-900">
                {formatArea(row.value, { signed: row.signed })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
