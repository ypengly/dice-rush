import { describe, expect, it } from 'vitest';
import { allPredictions, CONFIG } from '../src/engine/gameRules';
import { expectedReturn, payoutMultiplier, potentialProfit, settle } from '../src/engine/payoutEngine';

describe('payoutEngine', () => {
  it('multiplier = (1 - edge) / p for bets without pushes', () => {
    expect(payoutMultiplier({ mode: 'exact', value: 7 })).toBeCloseTo(0.97 * 6, 10); // 5.82
    expect(payoutMultiplier({ mode: 'exact', value: 2 })).toBeCloseTo(0.97 * 36, 10); // 34.92
    expect(payoutMultiplier({ mode: 'evenodd', side: 'even' })).toBeCloseTo(1.94, 10);
    expect(payoutMultiplier({ mode: 'doubles' })).toBeCloseTo(5.82, 10);
  });

  it('HIGH/LOW multiplier accounts for the refunded 7', () => {
    const m = payoutMultiplier({ mode: 'highlow', side: 'high' });
    expect(m).toBeCloseTo((0.97 - 6 / 36) / (15 / 36), 10);
    expect(m).toBeGreaterThan(1.9);
    expect(m).toBeLessThan(1.95);
  });

  it('every prediction returns exactly (1 - house edge) in expectation', () => {
    for (const p of allPredictions()) {
      expect(expectedReturn(p)).toBeCloseTo(1 - CONFIG.HOUSE_EDGE, 10);
    }
  });

  it('house edge is configurable', () => {
    expect(payoutMultiplier({ mode: 'doubles' }, 0)).toBeCloseTo(6, 10);
    expect(payoutMultiplier({ mode: 'doubles' }, 0.1)).toBeCloseTo(5.4, 10);
    for (const p of allPredictions()) expect(expectedReturn(p, 0)).toBeCloseTo(1, 10);
  });

  it('potential profit = bet × (multiplier − 1), floored to whole coins', () => {
    expect(potentialProfit({ mode: 'exact', value: 7 }, 100)).toBe(482);
    expect(potentialProfit({ mode: 'exact', value: 7 }, 10)).toBe(48); // 48.2 floored
    expect(potentialProfit({ mode: 'evenodd', side: 'odd' }, 100)).toBe(94);
    expect(potentialProfit({ mode: 'doubles' }, 50)).toBe(241); // 241.0
    expect(potentialProfit({ mode: 'doubles' }, 0)).toBe(0);
    expect(potentialProfit({ mode: 'doubles' }, -5)).toBe(0);
  });

  it('settles wins, losses and pushes', () => {
    const win = settle({ mode: 'evenodd', side: 'even' }, 100, 'win');
    expect(win).toMatchObject({ outcome: 'win', payout: 194, net: 94 });

    const lose = settle({ mode: 'evenodd', side: 'even' }, 100, 'lose');
    expect(lose).toMatchObject({ outcome: 'lose', payout: 0, net: -100 });

    const push = settle({ mode: 'highlow', side: 'high' }, 100, 'push');
    expect(push).toMatchObject({ outcome: 'push', payout: 100, net: 0 });
  });

  it('a win never pays out less than the stake or more than the fair multiple', () => {
    for (const p of allPredictions()) {
      for (const bet of [10, 25, 50, 100, 250, 500]) {
        const s = settle(p, bet, 'win');
        expect(s.payout).toBeGreaterThanOrEqual(bet);
        expect(s.payout).toBeLessThanOrEqual(bet * payoutMultiplier(p) + 1e-6);
      }
    }
  });
});
