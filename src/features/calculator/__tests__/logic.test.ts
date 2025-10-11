/**
 * Calculator Logic Tests
 * Unit tests for spray foam calculation functions
 */

import { describe, it, expect } from 'vitest';
import { calculateSprayFoam, formatArea, formatNumber, suggestPitch } from '../logic';
import type { CalculationInput } from '../logic';
import type { OpeningType } from '../../../state/formSchema';

const zeroOpenings: Record<OpeningType, number> = {
  single_roller: 0,
  double_roller: 0,
  high_roller: 0,
  large_roller: 0,
  pa_door: 0,
  window: 0,
  sliding_single: 0,
  sliding_double: 0,
  laserlight: 0,
  custom: 0,
};

describe('calculateSprayFoam', () => {
  it('should calculate basic shed dimensions correctly', () => {
    const input: CalculationInput = {
      length: 10,
      width: 8,
      height: 3,
      pitchAngle: '15',
      cladding: 'corrugated',
      roofMember: 'top_hat',
      wallMember: 'c_channel',
      includeRoofBattens: false,
      includeWallPurlins: false,
      openings: { ...zeroOpenings },
    };

    const result = calculateSprayFoam(input);

    expect(result).toBeDefined();
    expect(result.breakdown.netTotal).toBeGreaterThan(0);
    expect(result.configuration.dimensions).toBe('10 × 8 × 3 m');
    expect(result.configuration.pitchLabel).toBe('15°');
  });

  it('should apply pitch factor correctly', () => {
    const baseInput: CalculationInput = {
      length: 10,
      width: 8,
      height: 3,
      pitchAngle: '5',
      cladding: 'corrugated',
      roofMember: 'top_hat',
      wallMember: 'c_channel',
      includeRoofBattens: false,
      includeWallPurlins: false,
      openings: { ...zeroOpenings },
    };

    const result5 = calculateSprayFoam(baseInput);

    const result30 = calculateSprayFoam({
      ...baseInput,
      pitchAngle: '30',
    });

    // 30° pitch should result in larger area than 5° pitch
    expect(result30.breakdown.netTotal).toBeGreaterThan(result5.breakdown.netTotal);
  });

  it('should apply cladding factor correctly', () => {
    const baseInput: CalculationInput = {
      length: 10,
      width: 8,
      height: 3,
      pitchAngle: '15',
      cladding: 'corrugated',
      roofMember: 'top_hat',
      wallMember: 'c_channel',
      includeRoofBattens: false,
      includeWallPurlins: false,
      openings: { ...zeroOpenings },
    };

    const resultCorrugated = calculateSprayFoam(baseInput);

    const resultMonoclad = calculateSprayFoam({
      ...baseInput,
      cladding: 'monoclad',
    });

    // Corrugated has 1.2 factor, monoclad has 1.0, so corrugated should be larger
    expect(resultCorrugated.breakdown.netTotal).toBeGreaterThan(
      resultMonoclad.breakdown.netTotal
    );
  });

  it('should deduct openings correctly', () => {
    const baseInput: CalculationInput = {
      length: 10,
      width: 8,
      height: 3,
      pitchAngle: '15',
      cladding: 'corrugated',
      roofMember: 'top_hat',
      wallMember: 'c_channel',
      includeRoofBattens: false,
      includeWallPurlins: false,
      openings: { ...zeroOpenings },
    };

    const resultNoOpenings = calculateSprayFoam(baseInput);

    const resultWithOpenings = calculateSprayFoam({
      ...baseInput,
      openings: {
        ...zeroOpenings,
        single_roller: 2,
        window: 3,
      },
    });

    expect(resultWithOpenings.breakdown.openingsDeducted).toBeGreaterThan(0);
    expect(resultWithOpenings.breakdown.netTotal).toBeLessThan(
      resultNoOpenings.breakdown.netTotal
    );
    expect(resultWithOpenings.breakdown.openingDetails.length).toBe(2);
  });

  it('should calculate roof battens when enabled', () => {
    const input: CalculationInput = {
      length: 10,
      width: 8,
      height: 3,
      pitchAngle: '15',
      cladding: 'corrugated',
      roofMember: 'top_hat',
      wallMember: 'c_channel',
      includeRoofBattens: true,
      includeWallPurlins: false,
      openings: { ...zeroOpenings },
    };

    const result = calculateSprayFoam(input);

    expect(result.breakdown.roofBattens).toBeGreaterThan(0);
    expect(result.breakdown.wallPurlins).toBeNull();
  });

  it('should calculate wall purlins when enabled', () => {
    const input: CalculationInput = {
      length: 10,
      width: 8,
      height: 3,
      pitchAngle: '15',
      cladding: 'corrugated',
      roofMember: 'top_hat',
      wallMember: 'c_channel',
      includeRoofBattens: false,
      includeWallPurlins: true,
      openings: { ...zeroOpenings },
    };

    const result = calculateSprayFoam(input);

    expect(result.breakdown.wallPurlins).toBeGreaterThan(0);
    expect(result.breakdown.roofBattens).toBeNull();
  });

  it('should handle edge case: very small dimensions', () => {
    const input: CalculationInput = {
      length: 0.5,
      width: 0.5,
      height: 0.5,
      pitchAngle: '15',
      cladding: 'corrugated',
      roofMember: 'top_hat',
      wallMember: 'c_channel',
      includeRoofBattens: false,
      includeWallPurlins: false,
      openings: { ...zeroOpenings },
    };

    const result = calculateSprayFoam(input);

    expect(result.breakdown.netTotal).toBeGreaterThan(0);
    expect(result.breakdown.netTotal).toBeLessThan(10); // Should be small
  });

  it('should handle edge case: very large dimensions', () => {
    const input: CalculationInput = {
      length: 50,
      width: 50,
      height: 10,
      pitchAngle: '30',
      cladding: 'corrugated',
      roofMember: 'top_hat',
      wallMember: 'c_channel',
      includeRoofBattens: true,
      includeWallPurlins: true,
      openings: { ...zeroOpenings },
    };

    const result = calculateSprayFoam(input);

    expect(result.breakdown.netTotal).toBeGreaterThan(1000); // Should be very large
  });
});

describe('formatArea', () => {
  it('should format area with m² unit', () => {
    expect(formatArea(100.5)).toBe('100.5 m²');
    expect(formatArea(1.234567)).toBe('1.23 m²');
    expect(formatArea(0)).toBe('0 m²');
  });
});

describe('formatNumber', () => {
  it('should format numbers to 2 decimal places', () => {
    expect(formatNumber(10.5)).toBe('10.5');
    expect(formatNumber(10.123456)).toBe('10.12');
    expect(formatNumber(10)).toBe('10');
  });
});

describe('suggestPitch', () => {
  it('should suggest 10° for wide sheds (≥9m)', () => {
    expect(suggestPitch(9)).toBe('10');
    expect(suggestPitch(10)).toBe('10');
    expect(suggestPitch(15)).toBe('10');
  });

  it('should suggest 15° for medium sheds (6-9m)', () => {
    expect(suggestPitch(6)).toBe('15');
    expect(suggestPitch(7)).toBe('15');
    expect(suggestPitch(8.9)).toBe('15');
  });

  it('should suggest 22° for narrow sheds (<6m)', () => {
    expect(suggestPitch(5)).toBe('22');
    expect(suggestPitch(3)).toBe('22');
    expect(suggestPitch(5.9)).toBe('22');
  });
});
