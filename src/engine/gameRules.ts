import type { Outcome, Prediction } from '../types/game';

/** Central, configurable game settings. */
export const CONFIG = {
  STARTING_BALANCE: 1000,
  MIN_BET: 10,
  MAX_BET: 500,
  /** 3% house edge, applied to every bet type. */
  HOUSE_EDGE: 0.03,
  DAILY_BONUS: 250,
  QUICK_BETS: [10, 25, 50, 100, 250] as const,
  HISTORY_LIMIT: 500,
  TRANSACTION_LIMIT: 300,
  BALANCE_HISTORY_LIMIT: 100,
} as const;

export const TOTAL_COMBINATIONS = 36;
export const PUSH_TOTAL = 7;

export type Combo = [number, number];

/** All 36 equally likely (die1, die2) combinations. */
export function allCombinations(): Combo[] {
  const out: Combo[] = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) out.push([a, b]);
  return out;
}

/** Number of ways two dice can total `t` (2..12). */
export function waysToTotal(t: number): number {
  if (!Number.isInteger(t) || t < 2 || t > 12) return 0;
  return 6 - Math.abs(t - 7);
}

/** Decide the outcome of a prediction against a dice result. Pure & deterministic. */
export function evaluatePrediction(prediction: Prediction, d1: number, d2: number): Outcome {
  const total = d1 + d2;
  switch (prediction.mode) {
    case 'exact':
      return total === prediction.value ? 'win' : 'lose';
    case 'highlow':
      if (total === PUSH_TOTAL) return 'push';
      if (prediction.side === 'low') return total <= 6 ? 'win' : 'lose';
      return total >= 8 ? 'win' : 'lose';
    case 'evenodd':
      return (total % 2 === 0) === (prediction.side === 'even') ? 'win' : 'lose';
    case 'doubles':
      return d1 === d2 ? 'win' : 'lose';
  }
}

/** Count winning / pushing combinations out of 36 by enumerating the rules. */
export function countOutcomes(prediction: Prediction): { win: number; push: number; lose: number } {
  const counts = { win: 0, push: 0, lose: 0 };
  for (const [a, b] of allCombinations()) counts[evaluatePrediction(prediction, a, b)]++;
  return counts;
}

export function winProbability(prediction: Prediction): number {
  return countOutcomes(prediction).win / TOTAL_COMBINATIONS;
}

export function pushProbability(prediction: Prediction): number {
  return countOutcomes(prediction).push / TOTAL_COMBINATIONS;
}

export function describePrediction(p: Prediction): string {
  switch (p.mode) {
    case 'exact':
      return `Exact ${p.value}`;
    case 'highlow':
      return p.side === 'high' ? 'High (8–12)' : 'Low (2–6)';
    case 'evenodd':
      return p.side === 'even' ? 'Even' : 'Odd';
    case 'doubles':
      return 'Doubles';
  }
}

export const MODE_LABELS = {
  exact: 'Exact Number',
  highlow: 'High / Low',
  evenodd: 'Even / Odd',
  doubles: 'Doubles',
} as const;

/** Every selectable prediction, grouped for the payout table in Settings. */
export function allPredictions(): Prediction[] {
  const list: Prediction[] = [];
  for (let v = 2; v <= 12; v++) list.push({ mode: 'exact', value: v });
  list.push({ mode: 'highlow', side: 'low' }, { mode: 'highlow', side: 'high' });
  list.push({ mode: 'evenodd', side: 'even' }, { mode: 'evenodd', side: 'odd' });
  list.push({ mode: 'doubles' });
  return list;
}
