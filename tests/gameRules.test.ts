import { describe, expect, it } from 'vitest';
import {
  allCombinations,
  countOutcomes,
  describePrediction,
  evaluatePrediction,
  pushProbability,
  winProbability,
} from '../src/engine/gameRules';
import { validateBet, validatePrediction, maxBetFor } from '../src/engine/validation';
import type { Prediction } from '../src/types/game';

describe('evaluatePrediction – all 36 combinations', () => {
  it('EXACT: wins only when the total matches', () => {
    for (let guess = 2; guess <= 12; guess++) {
      for (const [a, b] of allCombinations()) {
        const expected = a + b === guess ? 'win' : 'lose';
        expect(evaluatePrediction({ mode: 'exact', value: guess }, a, b)).toBe(expected);
      }
    }
  });

  it('HIGH/LOW: low 2–6, high 8–12, 7 is a push', () => {
    for (const [a, b] of allCombinations()) {
      const t = a + b;
      const low = evaluatePrediction({ mode: 'highlow', side: 'low' }, a, b);
      const high = evaluatePrediction({ mode: 'highlow', side: 'high' }, a, b);
      if (t === 7) {
        expect(low).toBe('push');
        expect(high).toBe('push');
      } else if (t <= 6) {
        expect(low).toBe('win');
        expect(high).toBe('lose');
      } else {
        expect(low).toBe('lose');
        expect(high).toBe('win');
      }
    }
  });

  it('EVEN/ODD: exactly one side wins on every combination', () => {
    for (const [a, b] of allCombinations()) {
      const even = evaluatePrediction({ mode: 'evenodd', side: 'even' }, a, b);
      const odd = evaluatePrediction({ mode: 'evenodd', side: 'odd' }, a, b);
      expect(even).toBe((a + b) % 2 === 0 ? 'win' : 'lose');
      expect(odd).toBe((a + b) % 2 === 1 ? 'win' : 'lose');
    }
  });

  it('DOUBLES: wins only when both dice match', () => {
    for (const [a, b] of allCombinations()) {
      expect(evaluatePrediction({ mode: 'doubles' }, a, b)).toBe(a === b ? 'win' : 'lose');
    }
  });
});

describe('probabilities', () => {
  it('match known dice odds', () => {
    expect(winProbability({ mode: 'exact', value: 7 })).toBeCloseTo(6 / 36, 10);
    expect(winProbability({ mode: 'exact', value: 2 })).toBeCloseTo(1 / 36, 10);
    expect(winProbability({ mode: 'exact', value: 12 })).toBeCloseTo(1 / 36, 10);
    expect(winProbability({ mode: 'highlow', side: 'high' })).toBeCloseTo(15 / 36, 10);
    expect(pushProbability({ mode: 'highlow', side: 'low' })).toBeCloseTo(6 / 36, 10);
    expect(winProbability({ mode: 'evenodd', side: 'even' })).toBeCloseTo(0.5, 10);
    expect(winProbability({ mode: 'doubles' })).toBeCloseTo(1 / 6, 10);
  });

  it('win + push + lose always equals 36', () => {
    const preds: Prediction[] = [
      { mode: 'exact', value: 9 },
      { mode: 'highlow', side: 'high' },
      { mode: 'evenodd', side: 'odd' },
      { mode: 'doubles' },
    ];
    for (const p of preds) {
      const c = countOutcomes(p);
      expect(c.win + c.push + c.lose).toBe(36);
    }
  });

  it('labels are readable', () => {
    expect(describePrediction({ mode: 'exact', value: 9 })).toBe('Exact 9');
    expect(describePrediction({ mode: 'doubles' })).toBe('Doubles');
  });
});

describe('validation', () => {
  it('accepts valid bets', () => {
    expect(validateBet(10, 1000).ok).toBe(true);
    expect(validateBet(500, 1000).ok).toBe(true);
    expect(validateBet(37, 37).ok).toBe(true);
  });

  it('rejects invalid bets with clear messages', () => {
    const cases: Array<[number, number, string]> = [
      [9, 1000, 'Minimum'],
      [0, 1000, 'Minimum'],
      [-50, 1000, 'Minimum'],
      [501, 1000, 'Maximum'],
      [100, 50, 'Insufficient'],
      [10, 5, 'Insufficient'],
      [10.5, 1000, 'whole'],
      [Number.NaN, 1000, 'Enter'],
      [Number.POSITIVE_INFINITY, 1000, 'Enter'],
    ];
    for (const [amount, balance, fragment] of cases) {
      const r = validateBet(amount, balance);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain(fragment);
    }
  });

  it('maxBetFor is min(500, balance)', () => {
    expect(maxBetFor(1000)).toBe(500);
    expect(maxBetFor(120)).toBe(120);
    expect(maxBetFor(0)).toBe(0);
  });

  it('validates predictions', () => {
    expect(validatePrediction({ mode: 'exact', value: 7 }).ok).toBe(true);
    expect(validatePrediction({ mode: 'exact', value: 1 }).ok).toBe(false);
    expect(validatePrediction({ mode: 'exact', value: 13 }).ok).toBe(false);
    expect(validatePrediction({ mode: 'doubles' }).ok).toBe(true);
    expect(validatePrediction(null).ok).toBe(false);
  });
});
