import type { Outcome, Prediction, Settlement } from '../types/game';
import { CONFIG, pushProbability, winProbability } from './gameRules';

/**
 * Fair payout multiplier (stake included) for a prediction.
 *
 * Expected return per coin must equal (1 - houseEdge):
 *     pWin * m + pPush * 1 = 1 - edge
 *  => m = (1 - edge - pPush) / pWin
 *
 * Pushes (HIGH/LOW on a 7) refund the stake, so they are accounted for here.
 */
export function payoutMultiplier(prediction: Prediction, houseEdge: number = CONFIG.HOUSE_EDGE): number {
  const pWin = winProbability(prediction);
  const pPush = pushProbability(prediction);
  if (pWin <= 0) return 0;
  return (1 - houseEdge - pPush) / pWin;
}

/** Expected return per coin wagered (RTP). Always 1 - houseEdge before rounding. */
export function expectedReturn(prediction: Prediction, houseEdge: number = CONFIG.HOUSE_EDGE): number {
  return winProbability(prediction) * payoutMultiplier(prediction, houseEdge) + pushProbability(prediction);
}

/**
 * Net profit for a winning bet: bet × (multiplier − 1).
 * Rounded down to whole coins so the house edge is never accidentally reduced.
 */
export function potentialProfit(prediction: Prediction, bet: number, houseEdge: number = CONFIG.HOUSE_EDGE): number {
  if (!Number.isFinite(bet) || bet <= 0) return 0;
  const profit = Math.floor(bet * (payoutMultiplier(prediction, houseEdge) - 1) + 1e-9);
  return Math.max(0, profit);
}

/** Turn an outcome into coin movements. */
export function settle(
  prediction: Prediction,
  bet: number,
  outcome: Outcome,
  houseEdge: number = CONFIG.HOUSE_EDGE,
): Settlement {
  const multiplier = payoutMultiplier(prediction, houseEdge);
  switch (outcome) {
    case 'win': {
      const profit = potentialProfit(prediction, bet, houseEdge);
      return { outcome, multiplier, payout: bet + profit, net: profit };
    }
    case 'push':
      return { outcome, multiplier, payout: bet, net: 0 };
    case 'lose':
      return { outcome, multiplier, payout: 0, net: -bet };
  }
}
