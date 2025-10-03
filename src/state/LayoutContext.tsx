import React, { createContext, useContext, useMemo, useReducer } from 'react';

export type SectionKey =
  | 'Location'
  | 'Dimensions'
  | 'Pitch'
  | 'Cladding'
  | 'Members'
  | 'SprayOptions'
  | 'Openings';
export type SectionState = Record<SectionKey, 'expanded' | 'collapsed'>;
export type PanelSizes = { rightStack: number[]; inputWidthPct: number };
export type AppState = { sections: SectionState; panelSizes: PanelSizes };

const KEY = 'yf:v1:ui';
const DEFAULT: AppState = {
  sections: {
    Location: 'expanded',
    Dimensions: 'expanded',
    Pitch: 'expanded',
    Cladding: 'expanded',
    Members: 'expanded',
    SprayOptions: 'expanded',
    Openings: 'collapsed',
  },
  panelSizes: { rightStack: [70, 10, 10, 10], inputWidthPct: 40 },
};

function load(): AppState {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULT;
  }
}

function save(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore storage write errors
  }
}

export type Action =
  | { type: 'SET_SECTIONS'; payload: SectionState }
  | { type: 'SET_PANELS'; payload: PanelSizes };

function reducer(state: AppState, action: Action): AppState {
  const next =
    action.type === 'SET_SECTIONS'
      ? { ...state, sections: action.payload }
      : { ...state, panelSizes: action.payload };
  save(next);
  return next;
}

const LayoutContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(
  null,
);

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('LayoutContext not mounted');
  return ctx;
}

export const LayoutProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
