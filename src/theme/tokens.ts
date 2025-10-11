/**
 * Material Design 3 tokens for Yetifam Calculator
 * These tokens provide the foundational design system values
 */

export const tokens = {
  shape: {
    borderRadius: 12,
  },
  spacing: (n: number) => 4 * n,
  elevation: [
    'none',
    '0 1px 2px rgba(0,0,0,.08)',
    '0 2px 8px rgba(0,0,0,.12)',
    '0 4px 16px rgba(0,0,0,.16)',
  ],
  motion: {
    standard: '200ms cubic-bezier(0.2,0,0,1)',
    emphasized: '300ms cubic-bezier(0.2,0,0,1)',
  },
};

export type Tokens = typeof tokens;
