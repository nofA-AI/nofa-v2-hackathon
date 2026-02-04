import { format } from 'date-fns';
import numeral from 'numeral';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { match } from 'ts-pattern';

export const getDecimalPlacesBySymbol = (symbol: string) => {
  // Extract base symbol from trading pairs like "HYPE/USDT" or "HYPEUSDT"
  const upperSymbol = symbol.toUpperCase();
  const baseSymbol = upperSymbol
    .replace(/\/USDT$/, '') // Remove /USDT suffix
    .replace(/USDT$/, ''); // Remove USDT suffix

  return match(baseSymbol)
    .with('XRP', () => 4)
    .with('HYPE', () => 4)
    .with('DOGE', () => 4)
    .with('ASTER', () => 4)
    .otherwise(() => 2);
};

export const fmtUSD = (
  n?: number | null,
  options?: {
    decimalPlaces?: number;
    /** When true, abbreviate large numbers using k/m suffixes. */
    compact?: boolean;
    /** Decimal places used when `compact` applies a suffix (k/m). */
    compactDecimalPlaces?: number;
    /** Minimum absolute value to start compact formatting (default: 1000). */
    compactThreshold?: number;
  }
) => {
  if (n == null) return '--';

  const bn = BigNumber(n);
  if (!bn.isFinite()) return '--';

  let value = bn;
  let suffix = '';

  if (options?.compact) {
    const abs = bn.abs();
    const threshold = options.compactThreshold ?? 1_000;

    if (abs.gte(1_000_000) && abs.gte(threshold)) {
      value = bn.div(1_000_000);
      suffix = 'm';
    } else if (abs.gte(1_000) && abs.gte(threshold)) {
      value = bn.div(1_000);
      suffix = 'k';
    }
  }

  const decimalPlaces = suffix
    ? options?.compactDecimalPlaces ?? options?.decimalPlaces ?? 1
    : options?.decimalPlaces ?? 2;

  const formatted = value.toFormat(decimalPlaces, BigNumber.ROUND_DOWN, {
    groupSeparator: ',',
    groupSize: 3,
    decimalSeparator: '.',
  });

  // Remove trailing zeros after decimal point
  return `${formatted.replace(/\.?0+$/, '')}${suffix}`;
};

export const fmtPct = (n?: number | null) =>
  n == null ? '--' : numeral(n).format('0.00%');

export const fmtInt = (n?: number | null) =>
  n == null ? '--' : numeral(n).format('0,0');

export const fmtTs = (unixSeconds?: number | null) =>
  unixSeconds == null
    ? '--'
    : format(unixSeconds * 1000, 'yyyy-MM-dd HH:mm:ss', {});

export const fmtWithDayjs = (
  unixSeconds?: number | null,
  template = 'YYYY-MM-DD HH:mm:ss'
) => (unixSeconds == null ? '--' : dayjs(unixSeconds * 1000).format(template));

export const pnlClass = (n?: number | null) =>
  n == null || Number.isNaN(n)
    ? 'text-zinc-300'
    : n > 0
    ? 'text-green-400'
    : n < 0
    ? 'text-red-400'
    : 'text-zinc-300';

export const withSign = (n?: number | null, digits = 2) =>
  n == null
    ? '--'
    : `${n > 0 ? '+' : n < 0 ? '-' : ''}${Math.abs(n).toFixed(digits)}`;

export const formatAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};
