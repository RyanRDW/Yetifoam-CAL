type ToolbarButton = {
  id: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'secondary';
};

type Props = {
  buttons: ToolbarButton[];
};

export function Toolbar({ buttons }: Props) {
  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-auto sticky bottom-0 flex justify-end bg-gradient-to-t from-white via-white/95 to-transparent pt-4">
      <div className="flex gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 shadow-lg">
        {buttons.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={button.onClick}
            disabled={button.disabled}
            className={[
              'rounded-full px-4 py-2 text-sm font-medium transition',
              button.tone === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
            ].join(' ')}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}
