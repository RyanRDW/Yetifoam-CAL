import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { type FormState, defaultFormValues, ensureFormState, formDraftSchema } from './formSchema';

export type SectionKey =
  | 'Dimensions'
  | 'Pitch'
  | 'Cladding'
  | 'Members'
  | 'SprayOptions'
  | 'Openings';
export type SectionState = Record<SectionKey, 'expanded' | 'collapsed'>;
export type PanelSizes = { rightStack: number[]; inputWidthPct: number };
export type AdvisorProvider = 'grok' | 'openai';
export type AdvisorEntry = {
  id: string;
  question: string;
  variants: string[];
  closing: string;
  createdAt: string;
};
export type AdvisorState = {
  history: AdvisorEntry[];
  provider: AdvisorProvider;
};
export type CalculationMode = 'input' | 'calculating' | 'results';
export type ResultStatus = 'idle' | 'pending' | 'ready' | 'error';
export type OpeningDetail = {
  id: string;
  label: string;
  quantity: number;
  area: number;
};
export type CalculationBreakdown = {
  roofBase: number;
  sideWalls: number;
  gableRectangles: number;
  gableTriangles: number;
  pitchFactor: number;
  claddingFactor: number;
  surfacesSubtotal: number;
  openingsDeducted: number;
  openingDetails: OpeningDetail[];
  roofBattens: number | null;
  wallPurlins: number | null;
  membersTotal: number;
  netTotal: number;
};
export type CalculationResult = {
  jobId: string;
  calculatedAt: string;
  configuration: {
    dimensions: string;
    pitchLabel: string;
    assumed: boolean;
    rafterLength: number | null;
    cladding: string | null;
    members: string;
  };
  breakdown: CalculationBreakdown | null;
};
export type ResultsState = {
  status: ResultStatus;
  lastResult: CalculationResult | null;
  error: string | null;
};
export type AppState = {
  sections: SectionState;
  panelSizes: PanelSizes;
  advisor: AdvisorState;
  mode: CalculationMode;
  results: ResultsState;
  form: FormState;
};

const STORAGE_KEY = 'yf:v1:ui';
const SECTION_KEYS: readonly SectionKey[] = [
  'Dimensions',
  'Pitch',
  'Cladding',
  'Members',
  'SprayOptions',
  'Openings',
];

const ADVISOR_VARIANT_FALLBACK = [
  'Standard foam application for this size.',
  'Premium option with extra coverage.',
];
const ADVISOR_CLOSING_FALLBACK = "Let's discuss the best fit for your shed.";

const baseLayout: AppState = {
  sections: {
    Dimensions: 'expanded',
    Pitch: 'expanded',
    Cladding: 'expanded',
    Members: 'expanded',
    SprayOptions: 'expanded',
    Openings: 'collapsed',
  },
  panelSizes: { rightStack: [65, 35], inputWidthPct: 40 },
  advisor: { history: [], provider: 'grok' },
  mode: 'input',
  results: {
    status: 'idle',
    lastResult: null,
    error: null,
  },
  form: { ...defaultFormValues },
};

const defaultLayoutState: AppState = {
  sections: { ...baseLayout.sections },
  panelSizes: { inputWidthPct: baseLayout.panelSizes.inputWidthPct, rightStack: [...baseLayout.panelSizes.rightStack] },
  advisor: { history: [...baseLayout.advisor.history], provider: baseLayout.advisor.provider },
  mode: baseLayout.mode,
  results: {
    status: baseLayout.results.status,
    lastResult: baseLayout.results.lastResult,
    error: baseLayout.results.error,
  },
  form: { ...baseLayout.form },
};

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
    const [first = baseLayout.panelSizes.rightStack[0], second = baseLayout.panelSizes.rightStack[1]] = candidate.rightStack;
    panelSizes.rightStack = [first, second];
  }

  const total = panelSizes.rightStack.reduce((sum, entry) => sum + entry, 0);
  if (total > 0 && total !== 100) {
    panelSizes.rightStack = panelSizes.rightStack.map((entry) => (entry / total) * 100);
  }

  return panelSizes;
}

function ensureAdvisorState(value: unknown): AdvisorState {
  if (!value || typeof value !== 'object') {
    return { history: [], provider: 'grok' };
  }

  const record = value as Record<string, unknown>;
  const history = record.history;
  const providerRaw = record.provider;
  const provider = providerRaw === 'openai' ? 'openai' : 'grok';

  if (!Array.isArray(history)) {
    return { history: [], provider };
  }

  const entries: AdvisorEntry[] = [];
  history.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const record = entry as Record<string, unknown>;
    if (!Array.isArray(record.variants)) {
      return;
    }
    const variants = record.variants
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
    const closingRaw = typeof record.closing === 'string' ? record.closing.trim() : null;
    const question = typeof record.question === 'string' ? record.question : '';
    const createdAt = typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString();
    const id = typeof record.id === 'string' ? record.id : `advisor-${index}`;

    entries.push({
      id,
      question,
      variants: variants.length > 0 ? variants : [...ADVISOR_VARIANT_FALLBACK],
      closing: closingRaw && closingRaw.length > 0 ? closingRaw : ADVISOR_CLOSING_FALLBACK,
      createdAt,
    });
  });

  return { history: entries, provider };
}

function ensureResultsState(value: unknown): ResultsState {
  if (!value || typeof value !== 'object') {
    return { ...baseLayout.results };
  }

  const record = value as Partial<ResultsState>;
  const status: ResultStatus = record.status === 'pending' || record.status === 'ready' || record.status === 'error'
    ? record.status
    : 'idle';
  const lastResult = record.lastResult ?? null;
  const error = typeof record.error === 'string' ? record.error : null;

  return {
    status,
    lastResult,
    error,
  };
}

function ensureAppState(value: unknown): AppState {
  if (!value || typeof value !== 'object') {
    return {
      sections: ensureSectionState(undefined),
      panelSizes: ensurePanelSizes(undefined),
      advisor: ensureAdvisorState(undefined),
      mode: baseLayout.mode,
      results: ensureResultsState(undefined),
      form: ensureFormState(undefined),
    };
  }

  const candidate = value as Partial<AppState>;
  return {
    sections: ensureSectionState(candidate.sections),
    panelSizes: ensurePanelSizes(candidate.panelSizes),
    advisor: ensureAdvisorState(candidate.advisor),
    mode: candidate.mode === 'calculating' || candidate.mode === 'results' ? candidate.mode : 'input',
    results: ensureResultsState(candidate.results),
    form: ensureFormState(candidate.form),
  };
}

export type Action =
  | { type: 'SET_SECTIONS'; payload: SectionState }
  | { type: 'SET_PANELS'; payload: PanelSizes }
  | { type: 'SET_ADVISOR'; payload: AdvisorState }
  | { type: 'SET_FORM'; payload: FormState }
  | { type: 'SET_MODE'; payload: CalculationMode }
  | { type: 'SET_RESULTS'; payload: ResultsState };

function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SECTIONS':
      return { ...state, sections: action.payload };
    case 'SET_PANELS':
      return { ...state, panelSizes: action.payload };
    case 'SET_ADVISOR':
      return { ...state, advisor: action.payload };
    case 'SET_FORM': {
      if (import.meta.env?.MODE !== 'production') {
        formDraftSchema.parse(action.payload);
      }
      return { ...state, form: action.payload };
    }
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
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
