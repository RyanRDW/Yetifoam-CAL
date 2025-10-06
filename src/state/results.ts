import presets from '../config/presets.json';
import type { AppState, CalculationResult, CalculationMode, OpeningDetail, ResultsState } from './LayoutContext';
import type { FormState, OpeningType, ValidFormState } from './formSchema';

const pitchFactors = presets.pitch_factors as Record<string, number>;
const claddingFactors = presets.cladding_factors as Record<string, number>;

const roofSpacingPresets = presets.spacing_presets.roof as Record<string, Record<string, number>>;
const wallSpacingPresets = presets.spacing_presets.walls as Record<string, number>;

const openingsLibrary = presets.openings_library as Record<OpeningType, { area?: number; surface: string; width?: number }>;

export type LivePreviewSummary = {
  dimensionsLabel: string | null;
  pitchLabel: string;
  pitchAssumed: boolean;
  claddingLabel: string | null;
  membersLabel: string | null;
  openingsCount: number;
  warnings: string[];
};

export const RESULT_STORAGE_VERSION = 1;

export function selectMode(state: AppState): CalculationMode {
  return state.mode;
}

export function selectResults(state: AppState): ResultsState {
  return state.results;
}

export function selectLivePreview(state: AppState): LivePreviewSummary {
  const { form } = state;
  const dimensionsLabel = isNumber(form.dimensions.length) && isNumber(form.dimensions.width) && isNumber(form.dimensions.height)
    ? `${formatNumber(form.dimensions.length)} × ${formatNumber(form.dimensions.width)} × ${formatNumber(form.dimensions.height)} m`
    : null;

  const pitchInfo = resolvePitchInfo(form);

  const claddingLabel = form.cladding.type ? toTitle(form.cladding.type) : null;
  const membersLabel = form.members.roof || form.members.walls
    ? `Roof: ${form.members.roof ? toTitle(form.members.roof) : '—'} / Walls: ${form.members.walls ? toTitle(form.members.walls) : '—'}`
    : null;

  const openingsCount = countOpenings(form.openings);

  const warnings: string[] = [];
  if (!dimensionsLabel || !claddingLabel || !form.members.roof || !form.members.walls) {
    warnings.push('Complete all inputs to calculate');
  }

  return {
    dimensionsLabel,
    pitchLabel: pitchInfo.label,
    pitchAssumed: pitchInfo.assumed,
    claddingLabel,
    membersLabel,
    openingsCount,
    warnings,
  };
}

export function calculateResult(form: ValidFormState): CalculationResult {
  const pitchInfo = resolvePitchInfo(form);
  const length = form.dimensions.length!;
  const width = form.dimensions.width!;
  const height = form.dimensions.height!;
  const cladding = form.cladding.type ?? null;
  const roofMember = form.members.roof ?? null;
  const wallMember = form.members.walls ?? null;

  const pitchFactor = pitchInfo.factor;
  const claddingFactor = cladding ? claddingFactors[cladding] ?? 1 : 1;

  const roofBase = length * width;
  const sideWalls = 2 * (length * height);
  const gableRectangles = 2 * (width * height);
  const pitchRadians = (pitchInfo.angleDegrees ?? 0) * (Math.PI / 180);
  const rise = width / 2 * Math.tan(pitchRadians);
  const gableTriangles = width * rise;
  const roofPitched = roofBase * pitchFactor;
  const gableTrianglesPitched = gableTriangles * pitchFactor;

  const roofFinal = roofPitched * claddingFactor;
  const sideWallsFinal = sideWalls * claddingFactor;
  const gableRectanglesFinal = gableRectangles * claddingFactor;
  const gableTrianglesFinal = gableTrianglesPitched * claddingFactor;

  const surfacesSubtotal = roofFinal + sideWallsFinal + gableRectanglesFinal + gableTrianglesFinal;

  const rafterLength = pitchInfo.angleDegrees == null ? null : width / 2 * pitchFactor;

  const openingDetails = buildOpeningDetails(form.openings, rafterLength);
  const openingsDeducted = openingDetails.reduce((total, item) => total + item.area, 0);

  const { roofBattens, wallPurlins } = calculateMemberSprayBands({
    length,
    width,
    height,
    rafterLength,
    roofMember,
    wallMember,
    cladding,
    includeRoofBattens: form.spray.includeRoofBattens,
    includeWallPurlins: form.spray.includeWallPurlins,
  });

  const membersTotal = (roofBattens ?? 0) + (wallPurlins ?? 0);
  const surfacesNet = surfacesSubtotal - openingsDeducted;
  const netTotal = surfacesNet + membersTotal;

  return {
    jobId: `job-${Date.now()}`,
    calculatedAt: new Date().toISOString(),
    configuration: {
      dimensions: `${formatNumber(length)} × ${formatNumber(width)} × ${formatNumber(height)} m`,
      pitchLabel: pitchInfo.label,
      assumed: pitchInfo.assumed,
      rafterLength,
      cladding: cladding ? toTitle(cladding) : null,
      members: buildMembersLabel(roofMember, wallMember),
    },
    breakdown: {
      roofBase: roofFinal,
      sideWalls: sideWallsFinal,
      gableRectangles: gableRectanglesFinal,
      gableTriangles: gableTrianglesFinal,
      pitchFactor,
      claddingFactor,
      surfacesSubtotal,
      openingsDeducted,
      openingDetails,
      roofBattens,
      wallPurlins,
      membersTotal,
      netTotal,
    },
  };
}

function calculateMemberSprayBands(params: {
  length: number;
  width: number;
  height: number;
  rafterLength: number | null;
  roofMember: string | null;
  wallMember: string | null;
  cladding: string | null;
  includeRoofBattens: boolean;
  includeWallPurlins: boolean;
}): { roofBattens: number | null; wallPurlins: number | null } {
  const {
    length,
    width,
    height,
    rafterLength,
    roofMember,
    wallMember,
    cladding,
    includeRoofBattens,
    includeWallPurlins,
  } = params;

  let roofBattens: number | null = null;
  if (includeRoofBattens && roofMember === 'top_hat' && rafterLength != null) {
    const spacingBranch = (cladding && roofSpacingPresets?.[cladding]) || roofSpacingPresets?.corrugated;
    const spacing = spacingBranch?.[roofMember] ?? 1200;
    const spacingMeters = spacing ? spacing / 1000 : 1.2;
    const linesPerSide = Math.ceil(rafterLength / spacingMeters) + 1;
    const linealMetres = 2 * linesPerSide * length;
    roofBattens = linealMetres * (presets.member_spray_widths.roof_battens ?? 0.12) * (presets.member_spray_widths.multiplier ?? 0.9);
  }

  let wallPurlins: number | null = null;
  if (includeWallPurlins && wallMember === 'c_channel') {
    const spacing = wallSpacingPresets?.[wallMember] ?? 1200;
    const spacingMeters = spacing / 1000;
    const linesSide = Math.ceil(height / spacingMeters) + 1;
    const sideLineal = linesSide * (2 * length);
    const linesGable = Math.ceil(height / spacingMeters) + 1;
    const gableLineal = linesGable * (2 * width);
    const totalLineal = sideLineal + gableLineal;
    wallPurlins = totalLineal * (presets.member_spray_widths.wall_purlins ?? 0.18) * (presets.member_spray_widths.multiplier ?? 0.9);
  }

  return {
    roofBattens,
    wallPurlins,
  };
}

function buildOpeningDetails(openings: Record<OpeningType, number>, rafterLength: number | null): OpeningDetail[] {
  const details: OpeningDetail[] = [];

  for (const [type, quantity] of Object.entries(openings) as [OpeningType, number][]) {
    if (!quantity) continue;
    const spec = openingsLibrary[type];
    if (!spec) continue;

    let area = 0;
    if (type === 'laserlight') {
      area = (spec.width ?? 0.9) * (rafterLength ?? 0) * quantity;
    } else {
      area = (spec.area ?? 1) * quantity;
    }

    details.push({
      id: type,
      label: toOpeningLabel(type),
      quantity,
      area,
    });
  }

  return details;
}

function resolvePitchInfo(form: FormState | ValidFormState): {
  label: string;
  assumed: boolean;
  angleKey: string | null;
  angleDegrees: number | null;
  factor: number;
} {
  const selected = form.pitch.selected;
  const suggested = form.pitch.suggested;
  const assumed = selected === 'unknown';
  const angleKey = assumed ? suggested : selected;
  const angleDegrees = angleKey ? Number.parseFloat(angleKey) : null;
  const factor = angleKey && pitchFactors[angleKey] ? pitchFactors[angleKey] : 1;

  return {
    label: angleKey ? `${angleKey}°${assumed ? ' ⚠️ Assumed' : ''}` : 'Not set',
    assumed,
    angleKey,
    angleDegrees,
    factor,
  };
}

function countOpenings(openings: Record<OpeningType, number>): number {
  return Object.values(openings).reduce((total, qty) => total + qty, 0);
}

function toTitle(value: string | null): string | null {
  if (!value) return null;
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildMembersLabel(roof: string | null, walls: string | null): string {
  return `Roof: ${roof ? toTitle(roof) : '—'} / Walls: ${walls ? toTitle(walls) : '—'}`;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatNumber(value: number): string {
  return Number.parseFloat(value.toFixed(2)).toString();
}

function toOpeningLabel(type: OpeningType): string {
  switch (type) {
    case 'single_roller':
      return 'Single roller';
    case 'double_roller':
      return 'Double roller';
    case 'high_roller':
      return 'High roller';
    case 'large_roller':
      return 'Large roller';
    case 'pa_door':
      return 'PA door';
    case 'window':
      return 'Window';
    case 'sliding_single':
      return 'Sliding single';
    case 'sliding_double':
      return 'Sliding double';
    case 'laserlight':
      return 'Laserlight panel';
    case 'custom':
      return 'Custom deduction';
    default:
      return type;
  }
}
