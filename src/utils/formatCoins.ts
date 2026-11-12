const nf = new Intl.NumberFormat('en-US');

/** 1234 -> "1,234" */
export function formatCoins(n: number): string {
  return nf.format(Math.round(n));
}

/** 50 -> "+50", -50 -> "−50", 0 -> "0" */
export function formatSigned(n: number): string {
  if (n > 0) return `+${formatCoins(n)}`;
  if (n < 0) return `\u2212${formatCoins(Math.abs(n))}`;
  return '0';
}

export function formatMultiplier(m: number): string {
  return `${m.toFixed(2)}\u00d7`;
}

export function formatPercent(p: number, digits = 1): string {
  return `${(p * 100).toFixed(digits)}%`;
}
