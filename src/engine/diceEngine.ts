import type { DiceRoll } from '../types/game';

/** Returns an integer in [0, maxExclusive). Injectable so tests can be deterministic. */
export type RandomSource = (maxExclusive: number) => number;

/**
 * Unbiased random integer using crypto.getRandomValues (rejection sampling avoids modulo bias).
 * Falls back to Math.random only where Web Crypto is unavailable.
 */
export const secureRandomInt: RandomSource = (maxExclusive) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('maxExclusive must be a positive integer');
  }
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const range = 0x100000000;
    const limit = range - (range % maxExclusive);
    const buf = new Uint32Array(1);
    do {
      c.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
};

/** One fair six-sided die: 1..6. */
export function rollDie(rand: RandomSource = secureRandomInt): number {
  return rand(6) + 1;
}

/** Two independent dice. The visual animation only *displays* this result. */
export function rollDice(rand: RandomSource = secureRandomInt): DiceRoll {
  const a = rollDie(rand);
  const b = rollDie(rand);
  return { dice: [a, b], total: a + b };
}

/** Build a roll from known faces (validated). */
export function makeRoll(a: number, b: number): DiceRoll {
  for (const v of [a, b]) {
    if (!Number.isInteger(v) || v < 1 || v > 6) throw new RangeError(`Invalid die face: ${v}`);
  }
  return { dice: [a, b], total: a + b };
}
