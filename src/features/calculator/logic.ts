/**
 * Calculator Logic
 * Pure functions for spray foam calculations
 */

import presets from '../../config/presets.json';
import type { OpeningType } from '../../state/formSchema';

const pitchFactors = presets.pitch_factors as Record<string, number>;
const claddingFactors = presets.cladding_factors as Record<string, number>;
const roofSpacingPresets = presets.spacing_presets.roof as Record<
  string,
  Record<string, number>
>;
const wallSpacingPresets = presets.spacing_presets.walls as Record<string, number>;
const openingsLibrary = presets.openings_library as Record<
  OpeningType,
  { area?: number; surface: string; width?: number }
>;

export interface CalculationInput {
  length: number;
  width: number;
  height: number;
  pitchAngle: string;
  cladding: string;
  roofMember: string;
  wallMember: string;
  includeRoofBattens: boolean;
  includeWallPurlins: boolean;
  openings: Record<OpeningType, number>;
}

export interface OpeningDetail {
  id: OpeningType;
  label: string;
  quantity: number;
  area: number;
}

export interface CalculationBreakdown {
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
}

export interface CalculationResult {
  configuration: {
    dimensions: string;
    pitchLabel: string;
    rafterLength: number | null;
    cladding: string;
    members: string;
  };
  breakdown: CalculationBreakdown;
}

/**
 * Main calculation function
 */
export function calculateSprayFoam(input: CalculationInput): CalculationResult {
  const { length, width, height, pitchAngle, cladding, roofMember, wallMember } = input;

  const pitchFactor = pitchFactors[pitchAngle] ?? 1;
  const claddingFactor = claddingFactors[cladding] ?? 1;

  // Base surfaces
  const roofBase = length * width;
  const sideWalls = 2 * (length * height);
  const gableRectangles = 2 * (width * height);

  // Pitch calculations
  const pitchRadians = Number.parseFloat(pitchAngle) * (Math.PI / 180);
  const rise = (width / 2) * Math.tan(pitchRadians);
  const gableTriangles = width * rise;
  const roofPitched = roofBase * pitchFactor;
  const gableTrianglesPitched = gableTriangles * pitchFactor;

  // Apply cladding factors
  const roofFinal = roofPitched * claddingFactor;
  const sideWallsFinal = sideWalls * claddingFactor;
  const gableRectanglesFinal = gableRectangles * claddingFactor;
  const gableTrianglesFinal = gableTrianglesPitched * claddingFactor;

  const surfacesSubtotal =
    roofFinal + sideWallsFinal + gableRectanglesFinal + gableTrianglesFinal;

  // Rafter length
  const rafterLength = (width / 2) * pitchFactor;

  // Openings
  const openingDetails = buildOpeningDetails(input.openings, rafterLength);
  const openingsDeducted = openingDetails.reduce((total, item) => total + item.area, 0);

  // Member spray bands
  const { roofBattens, wallPurlins } = calculateMemberSprayBands({
    length,
    width,
    height,
    rafterLength,
    roofMember,
    wallMember,
    cladding,
    includeRoofBattens: input.includeRoofBattens,
    includeWallPurlins: input.includeWallPurlins,
  });

  const membersTotal = (roofBattens ?? 0) + (wallPurlins ?? 0);
  const surfacesNet = surfacesSubtotal - openingsDeducted;
  const netTotal = surfacesNet + membersTotal;

  return {
    configuration: {
      dimensions: `${formatNumber(length)} × ${formatNumber(width)} × ${formatNumber(height)} m`,
      pitchLabel: `${pitchAngle}°`,
      rafterLength,
      cladding: toTitle(cladding),
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

/**
 * Calculate member spray bands (roof battens and wall purlins)
 */
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
    const spacingBranch =
      (cladding && roofSpacingPresets?.[cladding]) || roofSpacingPresets?.corrugated;
    const spacing = spacingBranch?.[roofMember] ?? 1200;
    const spacingMeters = spacing ? spacing / 1000 : 1.2;
    const linesPerSide = Math.ceil(rafterLength / spacingMeters) + 1;
    const linealMetres = 2 * linesPerSide * length;
    roofBattens =
      linealMetres *
      (presets.member_spray_widths.roof_battens ?? 0.12) *
      (presets.member_spray_widths.multiplier ?? 0.9);
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
    wallPurlins =
      totalLineal *
      (presets.member_spray_widths.wall_purlins ?? 0.18) *
      (presets.member_spray_widths.multiplier ?? 0.9);
  }

  return { roofBattens, wallPurlins };
}

/**
 * Build opening details with calculated areas
 */
function buildOpeningDetails(
  openings: Record<OpeningType, number>,
  rafterLength: number | null
): OpeningDetail[] {
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

/**
 * Format number for display
 */
export function formatNumber(value: number): string {
  return Number.parseFloat(value.toFixed(2)).toString();
}

/**
 * Format area for display
 */
export function formatArea(value: number): string {
  return `${formatNumber(value)} m²`;
}

/**
 * Convert snake_case to Title Case
 */
function toTitle(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Build members label string
 */
function buildMembersLabel(roof: string | null, walls: string | null): string {
  return `Roof: ${roof ? toTitle(roof) : '—'} / Walls: ${walls ? toTitle(walls) : '—'}`;
}

/**
 * Convert opening type to display label
 */
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

/**
 * Suggest pitch based on shed width
 */
export function suggestPitch(width: number): string {
  if (width >= 9) return '10';
  if (width >= 6) return '15';
  return '22';
}
