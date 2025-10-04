import { z } from 'zod';

export const pitchAngles = ['5', '10', '15', '22', '25', '30'] as const;
export const pitchOptions = [...pitchAngles, 'unknown'] as const;
export type PitchAngle = (typeof pitchAngles)[number];
export type PitchOption = (typeof pitchOptions)[number];

export const claddingTypes = ['corrugated', 'monoclad'] as const;
export type CladdingType = (typeof claddingTypes)[number];

export const memberTypes = ['top_hat', 'c_channel'] as const;
export type MemberType = (typeof memberTypes)[number];

export const openingTypes = [
  'single_roller',
  'double_roller',
  'high_roller',
  'large_roller',
  'pa_door',
  'window',
  'sliding_single',
  'sliding_double',
  'laserlight',
  'custom',
] as const;
export type OpeningType = (typeof openingTypes)[number];

const dimensionRange = (max: number) =>
  z
    .number({ invalid_type_error: 'Enter a number' })
    .gt(0, 'Must be greater than 0')
    .lte(max, `Max ${max}m`);

const intCount = z
  .number({ invalid_type_error: 'Quantity required' })
  .int('Quantity must be whole number')
  .min(0, 'Quantity cannot be negative');

const postcodeSchema = z
  .string()
  .trim()
  .length(4, 'Postcode must be 4 digits')
  .regex(/^[0-9]{4}$/g, 'Postcode must be numeric');

export const baseOpeningsSchema = z.object(
  Object.fromEntries(openingTypes.map((type) => [type, intCount])) as Record<OpeningType, typeof intCount>,
);

export const formDraftSchema = z.object({
  location: z.object({
    suburb: z.string().trim().min(1).nullable(),
    postcode: postcodeSchema.nullable(),
  }),
  dimensions: z.object({
    length: z.number().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
  }),
  pitch: z.object({
    selected: z.enum(pitchOptions).nullable(),
    suggested: z.enum(pitchAngles).nullable(),
    assumed: z.boolean(),
  }),
  cladding: z.object({
    type: z.enum(claddingTypes).nullable(),
  }),
  members: z.object({
    roof: z.enum(memberTypes).nullable(),
    walls: z.enum(memberTypes).nullable(),
  }),
  spray: z.object({
    includeRoofBattens: z.boolean(),
    includeWallPurlins: z.boolean(),
  }),
  openings: baseOpeningsSchema,
});

export const formSchema = formDraftSchema.superRefine((value, ctx) => {
  if (!value.location.suburb) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select a suburb',
      path: ['location', 'suburb'],
    });
  }

  for (const [key, max] of [
    ['length', 50],
    ['width', 50],
  ] as const) {
    const numeric = value.dimensions[key];
    if (numeric == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['dimensions', key],
      });
    } else {
      const check = dimensionRange(max).safeParse(numeric);
      if (!check.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: check.error.issues[0]?.message ?? 'Invalid value',
          path: ['dimensions', key],
        });
      }
    }
  }

  const height = value.dimensions.height;
  if (height == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Required',
      path: ['dimensions', 'height'],
    });
  } else {
    const check = dimensionRange(10).safeParse(height);
    if (!check.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: check.error.issues[0]?.message ?? 'Invalid value',
        path: ['dimensions', 'height'],
      });
    }
  }

  if (!value.pitch.selected) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select a pitch',
      path: ['pitch', 'selected'],
    });
  } else if (value.pitch.selected === 'unknown' && !value.pitch.suggested) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Pitch suggestion required',
      path: ['pitch', 'suggested'],
    });
  }

  if (!value.cladding.type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select cladding',
      path: ['cladding', 'type'],
    });
  }

  if (!value.members.roof) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select roof member',
      path: ['members', 'roof'],
    });
  }

  if (!value.members.walls) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select wall member',
      path: ['members', 'walls'],
    });
  }
});

export type FormState = z.infer<typeof formDraftSchema>;
export type ValidFormState = z.infer<typeof formSchema>;

const zeroOpenings = Object.fromEntries(openingTypes.map((type) => [type, 0])) as Record<OpeningType, number>;

export const defaultFormValues: FormState = {
  location: { suburb: null, postcode: null },
  dimensions: { length: null, width: null, height: null },
  pitch: { selected: null, suggested: null, assumed: false },
  cladding: { type: null },
  members: { roof: null, walls: null },
  spray: { includeRoofBattens: false, includeWallPurlins: false },
  openings: { ...zeroOpenings },
};

export function ensureFormState(value: unknown): FormState {
  if (!value || typeof value !== 'object') {
    return { ...defaultFormValues };
  }

  const candidate = value as Partial<FormState>;
  const merged: FormState = {
    location: {
      suburb: typeof candidate.location?.suburb === 'string' ? candidate.location?.suburb : null,
      postcode: typeof candidate.location?.postcode === 'string' ? candidate.location?.postcode : null,
    },
    dimensions: {
      length: toNumeric(candidate.dimensions?.length),
      width: toNumeric(candidate.dimensions?.width),
      height: toNumeric(candidate.dimensions?.height),
    },
    pitch: {
      selected: isPitchOption(candidate.pitch?.selected) ? candidate.pitch?.selected ?? null : null,
      suggested: isPitchAngle(candidate.pitch?.suggested) ? (candidate.pitch?.suggested as PitchAngle) : null,
      assumed: Boolean(candidate.pitch?.assumed),
    },
    cladding: {
      type: isCladding(candidate.cladding?.type) ? (candidate.cladding?.type as CladdingType) : null,
    },
    members: {
      roof: isMember(candidate.members?.roof) ? (candidate.members?.roof as MemberType) : null,
      walls: isMember(candidate.members?.walls) ? (candidate.members?.walls as MemberType) : null,
    },
    spray: {
      includeRoofBattens: Boolean(candidate.spray?.includeRoofBattens),
      includeWallPurlins: Boolean(candidate.spray?.includeWallPurlins),
    },
    openings: ensureOpenings(candidate.openings),
  };

  // Development guardrail: ensure structure matches schema
  if (import.meta.env?.MODE !== 'production') {
    formDraftSchema.parse(merged);
  }

  return merged;
}

export function isFormValid(form: FormState): form is ValidFormState {
  return formSchema.safeParse(form).success;
}

export function suggestPitch(width: number | null | undefined): PitchAngle {
  if (!width || Number.isNaN(width)) {
    return '15';
  }
  if (width >= 9) return '10';
  if (width >= 6) return '15';
  return '22';
}

function toNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function ensureOpenings(source: unknown): Record<OpeningType, number> {
  const result: Record<OpeningType, number> = { ...zeroOpenings };
  if (!source || typeof source !== 'object') {
    return result;
  }

  for (const key of openingTypes) {
    const raw = (source as Record<string, unknown>)[key];
    const numeric = toNumeric(raw);
    result[key] = numeric != null && numeric >= 0 ? Math.floor(numeric) : 0;
  }

  return result;
}

function isPitchOption(value: unknown): value is PitchOption {
  return typeof value === 'string' && pitchOptions.includes(value as PitchOption);
}

function isPitchAngle(value: unknown): value is PitchAngle {
  return typeof value === 'string' && pitchAngles.includes(value as PitchAngle);
}

function isCladding(value: unknown): value is CladdingType {
  return typeof value === 'string' && claddingTypes.includes(value as CladdingType);
}

function isMember(value: unknown): value is MemberType {
  return typeof value === 'string' && memberTypes.includes(value as MemberType);
}
