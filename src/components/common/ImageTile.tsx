import type { ReactNode } from 'react';

interface ImageTileProps {
  label: string;
  imageFile: string;
  selected?: boolean;
  description?: ReactNode;
  badge?: ReactNode;
  onClick?: () => void;
  footer?: ReactNode;
  disabled?: boolean;
}

export function ImageTile({
  label,
  imageFile,
  selected = false,
  description,
  badge,
  onClick,
  footer,
  disabled = false,
}: ImageTileProps) {
  return (
    <button
      type="button"
      className={[
        'flex w-full flex-col overflow-hidden rounded-lg border text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300',
        disabled ? 'cursor-not-allowed opacity-60' : null,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={selected}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <div className="relative flex h-32 items-center justify-center bg-slate-100">
        <span className="text-xs font-medium text-slate-500">{imageFile}</span>
        {badge && (
          <span className="absolute right-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 py-2">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {description && <span className="text-xs text-slate-500">{description}</span>}
      </div>
      {footer && <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">{footer}</div>}
    </button>
  );
}
