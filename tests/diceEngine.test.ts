import { describe, expect, it } from 'vitest';
import { makeRoll, rollDice, rollDie, secureRandomInt } from '../src/engine/diceEngine';
import { allCombinations, waysToTotal } from '../src/engine/gameRules';

describe('diceEngine', () => {
  it('secureRandomInt stays within [0, max)', () => {
    for (let i = 0; i < 2000; i++) {
      const n = secureRandomInt(6);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
    }
  });

  it('secureRandomInt rejects invalid ranges', () => {
    expect(() => secureRandomInt(0)).toThrow();
    expect(() => secureRandomInt(-3)).toThrow();
    expect(() => secureRandomInt(2.5)).toThrow();
  });

  it('rollDie maps the random source to faces 1..6', () => {
    expect(rollDie(() => 0)).toBe(1);
    expect(rollDie(() => 5)).toBe(6);
  });

  it('rollDice produces two independent dice and a correct total', () => {
    const seq = [2, 4];
    let i = 0;
    const roll = rollDice(() => seq[i++]);
    expect(roll.dice).toEqual([3, 5]);
    expect(roll.total).toBe(8);
  });

  it('rollDice always yields faces 1..6 with matching total', () => {
    for (let i = 0; i < 2000; i++) {
      const r = rollDice();
      expect(r.dice[0]).toBeGreaterThanOrEqual(1);
      expect(r.dice[0]).toBeLessThanOrEqual(6);
      expect(r.dice[1]).toBeGreaterThanOrEqual(1);
      expect(r.dice[1]).toBeLessThanOrEqual(6);
      expect(r.total).toBe(r.dice[0] + r.dice[1]);
    }
  });

  it('every one of the 36 combinations is reachable and totals are correct', () => {
    const combos = allCombinations();
    expect(combos).toHaveLength(36);
    const seen = new Set<string>();
    for (const [a, b] of combos) {
      const r = rollDice((() => {
        const q = [a - 1, b - 1];
        let k = 0;
        return () => q[k++];
      })());
      expect(r.dice).toEqual([a, b]);
      expect(r.total).toBe(a + b);
      seen.add(`${a}-${b}`);
    }
    expect(seen.size).toBe(36);
  });

  it('total frequencies match the 1-2-3-4-5-6-5-4-3-2-1 distribution', () => {
    const ways: Record<number, number> = {};
    for (const [a, b] of allCombinations()) ways[a + b] = (ways[a + b] ?? 0) + 1;
    for (let t = 2; t <= 12; t++) expect(ways[t]).toBe(waysToTotal(t));
  });

  it('makeRoll validates faces', () => {
    expect(makeRoll(6, 1).total).toBe(7);
    expect(() => makeRoll(0, 3)).toThrow();
    expect(() => makeRoll(3, 7)).toThrow();
    expect(() => makeRoll(2.5, 3)).toThrow();
  });
});
