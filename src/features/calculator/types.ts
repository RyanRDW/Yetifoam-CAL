/**
 * Calculator feature types
 */

import type { OpeningType } from '../../state/formSchema';

export interface CalculatorFormData {
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

export const PITCH_OPTIONS = ['5', '10', '15', '22', '25', '30'] as const;
export const CLADDING_OPTIONS = [
  { value: 'corrugated', label: 'Corrugated' },
  { value: 'monoclad', label: 'Monoclad' },
] as const;
export const MEMBER_OPTIONS = [
  { value: 'top_hat', label: 'Top Hat' },
  { value: 'c_channel', label: 'C Channel' },
] as const;

export const OPENING_TYPES: Array<{ value: OpeningType; label: string }> = [
  { value: 'single_roller', label: 'Single Roller Door' },
  { value: 'double_roller', label: 'Double Roller Door' },
  { value: 'high_roller', label: 'High Roller Door' },
  { value: 'large_roller', label: 'Large Roller Door' },
  { value: 'pa_door', label: 'PA Door' },
  { value: 'window', label: 'Window' },
  { value: 'sliding_single', label: 'Sliding Single Door' },
  { value: 'sliding_double', label: 'Sliding Double Door' },
  { value: 'laserlight', label: 'Laserlight Panel' },
  { value: 'custom', label: 'Custom Deduction' },
];
