import { type ReactNode, useEffect, useRef } from 'react';
import { useLayout } from '../state/LayoutContext';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface Props {
  id: string;
  title: import('../state/LayoutContext').SectionKey;
  isComplete: boolean;
  children?: ReactNode;
}

export function CollapsibleSection({ id, title, isComplete, children }: Props) {
  const { state, dispatch } = useLayout();
  const expanded = state.sections[title] === 'expanded';
  const wasComplete = useRef(isComplete);

  useEffect(() => {
    const shouldAutoCollapse = !wasComplete.current && isComplete && expanded;
    wasComplete.current = isComplete;

    if (!shouldAutoCollapse) return;

    const timeout = window.setTimeout(() => {
      dispatch({ type: 'SET_SECTIONS', payload: { ...state.sections, [title]: 'collapsed' } });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [isComplete, expanded, dispatch, state.sections, title]);

  const displayTitle = title.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();

  return (
    <section
      id={id}
      data-state={expanded ? 'open' : 'closed'}
      aria-expanded={expanded}
      className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm transition hover:border-slate-300"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() => {
          const next = expanded ? 'collapsed' : 'expanded';
          dispatch({ type: 'SET_SECTIONS', payload: { ...state.sections, [title]: next } });
        }}
      >
        <span>{displayTitle}</span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && <div className="border-t border-slate-200/60 px-5 pb-5 pt-4 text-sm text-slate-700">{children}</div>}
    </section>
  );
}
