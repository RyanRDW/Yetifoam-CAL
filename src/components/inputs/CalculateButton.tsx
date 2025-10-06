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
        'mt-4 flex h-16 w-full items-center justify-center gap-3 rounded-lg border text-lg font-semibold transition',
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
          : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
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
      {disabled ? 'Calculate' : pressedOnce ? 'Re-Calculate' : 'Calculate' }
    </button>
  );
}
