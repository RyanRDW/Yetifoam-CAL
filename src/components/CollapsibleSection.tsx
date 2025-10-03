import { type ReactNode, useEffect } from 'react';
import { useLayout } from '../state/LayoutContext';

interface Props {
  id: string;
  title: import('../state/LayoutContext').SectionKey;
  isComplete: boolean;
  children?: ReactNode;
}

export function CollapsibleSection({ id, title, isComplete, children }: Props) {
  const { state, dispatch } = useLayout();
  const expanded = state.sections[title] === 'expanded';

  useEffect(() => {
    if (isComplete && expanded) {
      const timeout = window.setTimeout(() => {
        dispatch({ type: 'SET_SECTIONS', payload: { ...state.sections, [title]: 'collapsed' } });
      }, 300);
      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [isComplete, expanded, dispatch, state.sections, title]);

  return (
    <section data-state={expanded ? 'open' : 'closed'} aria-expanded={expanded} id={id}>
      <header
        style={{ cursor: 'pointer', padding: '8px', borderBottom: '1px solid var(--border, #e5e7eb)' }}
        onClick={() => {
          const next = expanded ? 'collapsed' : 'expanded';
          dispatch({ type: 'SET_SECTIONS', payload: { ...state.sections, [title]: next } });
        }}
      >
        {title}
      </header>
      {expanded && <div style={{ padding: '8px' }}>{children}</div>}
    </section>
  );
}
