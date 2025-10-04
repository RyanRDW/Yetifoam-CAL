import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type { ChatMessage } from '../services/llmClient';

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
export type WeatherState = {
  suburb: string;
  lastResult: unknown;
  lastUpdated: string | null;
};
export type AdvisorState = {
  history: ChatMessage[];
};
export type AppState = {
  sections: SectionState;
  panelSizes: PanelSizes;
  weather: WeatherState;
  advisor: AdvisorState;
};

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
  weather: { suburb: '', lastResult: null, lastUpdated: null },
  advisor: { history: [] },
};

function load(): AppState {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      ...DEFAULT,
      ...stored,
      sections: { ...DEFAULT.sections, ...(stored?.sections ?? {}) },
      panelSizes: { ...DEFAULT.panelSizes, ...(stored?.panelSizes ?? {}) },
      weather: { ...DEFAULT.weather, ...(stored?.weather ?? {}) },
      advisor: { ...DEFAULT.advisor, ...(stored?.advisor ?? {}) },
    };
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
  | { type: 'SET_PANELS'; payload: PanelSizes }
  | { type: 'SET_WEATHER'; payload: WeatherState }
  | { type: 'SET_ADVISOR'; payload: AdvisorState };

function reducer(state: AppState, action: Action): AppState {
  const next = (() => {
    switch (action.type) {
      case 'SET_SECTIONS':
        return { ...state, sections: action.payload };
      case 'SET_PANELS':
        return { ...state, panelSizes: action.payload };
      case 'SET_WEATHER':
        return { ...state, weather: action.payload };
      case 'SET_ADVISOR':
        return { ...state, advisor: action.payload };
      default:
        return state;
    }
  })();
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
