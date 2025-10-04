import React, { createContext, useCallback, useContext, useMemo } from 'react';
import type { ChatMessage } from '../services/llmClient';
import { usePersistentState } from '../hooks/usePersistentState';
import { type FormState, defaultFormValues, ensureFormState, formDraftSchema } from './formSchema';

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
export type WeatherStatus = 'ok' | 'not_found' | 'no_data' | 'error';
export type WeatherPayload = {
  status: WeatherStatus;
  suburb: string | null;
  temp: number | null;
  wind_kph: number | null;
  gust_kph: number | null;
  humidity: number | null;
  fact: string | null;
  message: string | null;
};
export type WeatherState = {
  suburb: string;
  lastResult: WeatherPayload | null;
  fact: string | null;
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
  form: FormState;
};

const STORAGE_KEY = 'yf:v1:ui';
const SECTION_KEYS: readonly SectionKey[] = [
  'Location',
  'Dimensions',
  'Pitch',
  'Cladding',
  'Members',
  'SprayOptions',
  'Openings',
];

const baseLayout: AppState = {
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
  weather: { suburb: '', lastResult: null, fact: null, lastUpdated: null },
  advisor: { history: [] },
  form: { ...defaultFormValues },
};

const defaultLayoutState: AppState = {
  sections: { ...baseLayout.sections },
  panelSizes: { inputWidthPct: baseLayout.panelSizes.inputWidthPct, rightStack: [...baseLayout.panelSizes.rightStack] },
  weather: { ...baseLayout.weather },
  advisor: { history: [...baseLayout.advisor.history] },
  form: { ...baseLayout.form },
};

function ensureWeatherPayload(value: unknown): WeatherPayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const data = value as Record<string, unknown>;
  const status =
    data.status === 'ok' || data.status === 'not_found' || data.status === 'no_data'
      ? (data.status as WeatherStatus)
      : 'error';

  return {
    status,
    suburb: typeof data.suburb === 'string' ? data.suburb : null,
    temp: coerceNumber(data.temp),
    wind_kph: coerceNumber(data.wind_kph),
    gust_kph: coerceNumber(data.gust_kph),
    humidity: coerceNumber(data.humidity),
    fact: typeof data.fact === 'string' ? data.fact : null,
    message: typeof data.message === 'string' ? data.message : null,
  };
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function ensureSectionState(value: unknown): SectionState {
  const sections: SectionState = { ...baseLayout.sections };
  if (!value || typeof value !== 'object') {
    return sections;
  }

  const record = value as Record<string, unknown>;
  for (const key of SECTION_KEYS) {
    const raw = record[key];
    sections[key] = raw === 'collapsed' ? 'collapsed' : 'expanded';
  }
  return sections;
}

function ensurePanelSizes(value: unknown): PanelSizes {
  const panelSizes: PanelSizes = {
    inputWidthPct: baseLayout.panelSizes.inputWidthPct,
    rightStack: [...baseLayout.panelSizes.rightStack],
  };

  if (!value || typeof value !== 'object') {
    return panelSizes;
  }

  const candidate = value as Partial<PanelSizes>;
  if (typeof candidate.inputWidthPct === 'number' && Number.isFinite(candidate.inputWidthPct)) {
    panelSizes.inputWidthPct = candidate.inputWidthPct;
  }

  if (
    Array.isArray(candidate.rightStack) &&
    candidate.rightStack.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
  ) {
    panelSizes.rightStack = [...candidate.rightStack];
  }

  return panelSizes;
}

function ensureWeatherState(value: unknown): WeatherState {
  const weather: WeatherState = { ...baseLayout.weather };

  if (!value || typeof value !== 'object') {
    return weather;
  }

  const candidate = value as Partial<WeatherState>;
  if (typeof candidate.suburb === 'string') {
    weather.suburb = candidate.suburb;
  }

  if ('lastResult' in candidate) {
    weather.lastResult = ensureWeatherPayload((candidate as Record<string, unknown>).lastResult) ?? null;
  }

  if (typeof candidate.fact === 'string') {
    weather.fact = candidate.fact;
  } else if (candidate.fact === null) {
    weather.fact = null;
  }

  if (!weather.fact && weather.lastResult?.fact) {
    weather.fact = weather.lastResult.fact;
  }

  if (typeof candidate.lastUpdated === 'string') {
    weather.lastUpdated = candidate.lastUpdated;
  } else if (candidate.lastUpdated === null) {
    weather.lastUpdated = null;
  }

  return weather;
}

function ensureAdvisorState(value: unknown): AdvisorState {
  const advisor: AdvisorState = { history: [...baseLayout.advisor.history] };

  if (!value || typeof value !== 'object') {
    return advisor;
  }

  const history = (value as Record<string, unknown>).history;
  if (Array.isArray(history)) {
    advisor.history = history as ChatMessage[];
  }

  return advisor;
}

function ensureAppState(value: unknown): AppState {
  if (!value || typeof value !== 'object') {
    return {
      sections: ensureSectionState(undefined),
      panelSizes: ensurePanelSizes(undefined),
      weather: ensureWeatherState(undefined),
      advisor: ensureAdvisorState(undefined),
      form: ensureFormState(undefined),
    };
  }

  const candidate = value as Partial<AppState>;
  return {
    sections: ensureSectionState(candidate.sections),
    panelSizes: ensurePanelSizes(candidate.panelSizes),
    weather: ensureWeatherState(candidate.weather),
    advisor: ensureAdvisorState(candidate.advisor),
    form: ensureFormState(candidate.form),
  };
}

export type Action =
  | { type: 'SET_SECTIONS'; payload: SectionState }
  | { type: 'SET_PANELS'; payload: PanelSizes }
  | { type: 'SET_WEATHER'; payload: WeatherState }
  | { type: 'SET_ADVISOR'; payload: AdvisorState }
  | { type: 'SET_FORM'; payload: FormState };

function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SECTIONS':
      return { ...state, sections: action.payload };
    case 'SET_PANELS':
      return { ...state, panelSizes: action.payload };
    case 'SET_WEATHER':
      return { ...state, weather: action.payload };
    case 'SET_ADVISOR':
      return { ...state, advisor: action.payload };
    case 'SET_FORM': {
      if (import.meta.env?.MODE !== 'production') {
        formDraftSchema.parse(action.payload);
      }
      return { ...state, form: action.payload };
    }
    default:
      return state;
  }
}

type LayoutContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  updateForm: (updater: (prev: FormState) => FormState) => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('LayoutContext not mounted');
  return ctx;
}

export const LayoutProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [layout, setLayout] = usePersistentState<AppState>(STORAGE_KEY, defaultLayoutState, {
    parse: (raw) => ensureAppState(JSON.parse(raw)),
    stringify: JSON.stringify,
  });

  const dispatch = useCallback(
    (action: Action) => {
      setLayout((current) => reduce(current, action));
    },
    [setLayout],
  );

  const updateForm = useCallback(
    (updater: (prev: FormState) => FormState) => {
      setLayout((current) => {
        const nextForm = updater(current.form);
        if (import.meta.env?.MODE !== 'production') {
          formDraftSchema.parse(nextForm);
        }
        return reduce(current, { type: 'SET_FORM', payload: nextForm });
      });
    },
    [setLayout],
  );

  const value = useMemo(() => ({ state: layout, dispatch, updateForm }), [layout, dispatch, updateForm]);
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};
