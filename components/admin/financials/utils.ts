export const formatCurrency = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits
  }).format(value);

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);

export const formatPercent = (value: number, fractionDigits = 1) => `${value.toFixed(fractionDigits)}%`;

export const computeChangePct = (current: number, previous: number) => {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

export const toShortDate = (value: Date) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(value);
