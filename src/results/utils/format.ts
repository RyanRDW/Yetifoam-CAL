const numberFormatter = new Intl.NumberFormat('en-AU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatArea(value: number | null | undefined, options?: { signed?: boolean }): string {
  if (value == null || Number.isNaN(value)) {
    return '--';
  }
  const formatted = numberFormatter.format(value);
  if (options?.signed) {
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    const digits = numberFormatter.format(Math.abs(value));
    return sign ? `${sign}${digits} m²` : `${digits} m²`;
  }
  return `${formatted} m²`;
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) {
    return '--';
  }
  const formatter = digits === 2 ? numberFormatter : new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return formatter.format(value);
}

export function formatWindSpeed(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '--';
  }
  return `${numberFormatter.format(value)} km/h`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}
