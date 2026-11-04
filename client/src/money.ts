export function formatUsd(value: string | null, maximumFractionDigits = 4): string {
  if (value === null) return '—';
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits })
    : '—';
}

export function formatPercent(value: string | null, maximumFractionDigits = 1): string {
  if (value === null) return '—';
  const percent = Number(value);
  return Number.isFinite(percent)
    ? `${percent.toLocaleString('en-US', { maximumFractionDigits })}%`
    : '—';
}

function scaledDecimal(value: string, scale: number): bigint {
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ''] = unsigned.split('.');
  const scaled = BigInt(whole || '0') * 10n ** BigInt(scale) +
    BigInt((fraction + '0'.repeat(scale)).slice(0, scale) || '0');
  return negative ? -scaled : scaled;
}

export function compareMoney(a: string, b: string): number {
  const scale = Math.max(a.split('.')[1]?.length ?? 0, b.split('.')[1]?.length ?? 0);
  const left = scaledDecimal(a, scale);
  const right = scaledDecimal(b, scale);
  return left < right ? -1 : left > right ? 1 : 0;
}

export function addDecimalStrings(a: string, b: string): string {
  const scale = Math.max(a.split('.')[1]?.length ?? 0, b.split('.')[1]?.length ?? 0);
  const sum = scaledDecimal(a, scale) + scaledDecimal(b, scale);
  const negative = sum < 0n;
  const digits = (negative ? -sum : sum).toString().padStart(scale + 1, '0');
  if (scale === 0) return `${negative ? '-' : ''}${digits}`;
  const whole = digits.slice(0, -scale);
  const fraction = digits.slice(-scale).replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}
