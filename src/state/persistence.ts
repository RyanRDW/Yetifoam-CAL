export interface UIState {
  sections: Record<string, 'expanded' | 'collapsed'>;
  panelSizes: { inputWidthPct: number; rightStack: number[] };
  version: number;
}

const defaults: UIState = {
  version: 1,
  sections: {
    Location: 'expanded',
    Dimensions: 'expanded',
    Pitch: 'expanded',
    Cladding: 'expanded',
    Members: 'expanded',
    SprayOptions: 'expanded',
    Openings: 'collapsed',
    CalculateButton: 'visible'
  },
  panelSizes: {
    inputWidthPct: 40,
    rightStack: [70, 10, 10, 10]
  }
};

export function migrateUI(source: any): UIState {
  if (!source || typeof source !== 'object') return defaults;
  const next: UIState = { ...defaults };

  // migrate sections
  if (source.sections && typeof source.sections === 'object') {
    for (const key of Object.keys(defaults.sections)) {
      const value = source.sections[key];
      if (value === 'expanded' || value === 'collapsed') {
        next.sections[key] = value;
      }
    }
  }

  // migrate panels
  if (source.panelSizes && typeof source.panelSizes === 'object') {
    const width = Number(source.panelSizes.inputWidthPct);
    if (Number.isFinite(width)) {
      next.panelSizes.inputWidthPct = Math.min(50, Math.max(20, Math.round(width)));
    }
    if (Array.isArray(source.panelSizes.rightStack)) {
      const total = source.panelSizes.rightStack.reduce((a: number, b: number) => a + b, 0) || 1;
      const scaled = source.panelSizes.rightStack.map((v: number) =>
        Math.round((v / total) * 100)
      );
      next.panelSizes.rightStack = scaled;
    }
  }

  return next;
}

// basic tests
export const tests = [
  () => migrateUI(undefined),         // empty → defaults
  () => migrateUI({ sections: { Location: 'collapsed' } }), // old → new fills
  () => migrateUI(defaults)           // round-trip
];
