import type { Prediction, ValidationResult } from '../types/game';
import { CONFIG } from './gameRules';

/** Highest bet currently allowed: min(500, balance). */
export function maxBetFor(balance: number): number {
  return Math.max(0, Math.min(CONFIG.MAX_BET, Math.floor(balance)));
}

export function validateBet(amount: number, balance: number): ValidationResult {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return { ok: false, error: 'Enter a bet amount.' };
  }
  if (!Number.isInteger(amount)) return { ok: false, error: 'Bets must be whole coins.' };
  if (amount < CONFIG.MIN_BET) return { ok: false, error: `Minimum bet is ${CONFIG.MIN_BET} coins.` };
  if (amount > CONFIG.MAX_BET) return { ok: false, error: `Maximum bet is ${CONFIG.MAX_BET} coins.` };
  if (amount > balance) return { ok: false, error: 'Insufficient balance for that bet.' };
  return { ok: true };
}

export function validatePrediction(p: Prediction | null | undefined): ValidationResult {
  if (!p) return { ok: false, error: 'Choose a prediction first.' };
  switch (p.mode) {
    case 'exact':
      if (!Number.isInteger(p.value) || p.value < 2 || p.value > 12) {
        return { ok: false, error: 'Exact number must be between 2 and 12.' };
      }
      return { ok: true };
    case 'highlow':
      return p.side === 'high' || p.side === 'low'
        ? { ok: true }
        : { ok: false, error: 'Choose HIGH or LOW.' };
    case 'evenodd':
      return p.side === 'even' || p.side === 'odd'
        ? { ok: true }
        : { ok: false, error: 'Choose EVEN or ODD.' };
    case 'doubles':
      return { ok: true };
    default:
      return { ok: false, error: 'Unknown prediction type.' };
  }
}
