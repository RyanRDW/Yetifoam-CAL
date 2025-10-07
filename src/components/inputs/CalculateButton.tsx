import { useMemo, useState } from 'react';
import { useLayout } from '../../state/LayoutContext';
import { isFormValid } from '../../state/formSchema';

export function CalculateButton() {
  const {
    state: { form },
  } = useLayout();

  const [pressedOnce, setPressedOnce] = useState(false);

  const disabled = useMemo(() => !isFormValid(form), [form]);

  return (
    <button
      type="button"
      className={[
        'flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60',
        disabled
          ? 'cursor-not-allowed bg-slate-100 text-slate-400'
          : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      onClick={() => {
        setPressedOnce(true);
        window.dispatchEvent(new CustomEvent('calculate-requested'));
      }}
      title={disabled ? 'Complete all inputs to calculate' : 'Calculate spray coverage'}
    >
      {disabled ? 'Calculate coverage' : pressedOnce ? 'Recalculate coverage' : 'Calculate coverage'}
    </button>
  );
}
