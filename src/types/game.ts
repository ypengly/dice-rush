export type GameMode = 'exact' | 'highlow' | 'evenodd' | 'doubles';

export type Prediction =
  | { mode: 'exact'; value: number }
  | { mode: 'highlow'; side: 'high' | 'low' }
  | { mode: 'evenodd'; side: 'even' | 'odd' }
  | { mode: 'doubles' };

export type Outcome = 'win' | 'lose' | 'push';

export interface DiceRoll {
  dice: [number, number];
  total: number;
}

export interface Settlement {
  outcome: Outcome;
  /** Payout multiplier applied to the stake on a win (stake included). */
  multiplier: number;
  /** Coins returned to the wallet (0 on loss, bet on push, bet+profit on win). */
  payout: number;
  /** Net change relative to before the bet: +profit, -bet, or 0. */
  net: number;
}

export interface RoundRecord {
  id: number;
  timestamp: number;
  dice: [number, number];
  total: number;
  prediction: Prediction;
  predictionLabel: string;
  bet: number;
  outcome: Outcome;
  multiplier: number;
  payout: number;
  net: number;
}

export interface PendingRound {
  id: number;
  timestamp: number;
  roll: DiceRoll;
  prediction: Prediction;
  bet: number;
  settlement: Settlement;
}

export type TransactionType = 'win' | 'loss' | 'push' | 'bonus' | 'reset';

export interface Transaction {
  id: string;
  timestamp: number;
  type: TransactionType;
  description: string;
  amount: number;
  balanceAfter: number;
}

export interface PlayerStats {
  rounds: number;
  wins: number;
  losses: number;
  pushes: number;
  wagered: number;
  profit: number;
  biggestWin: number;
  /** Positive = current win streak, negative = current losing streak. */
  streak: number;
  bestWinStreak: number;
  /** Balance after each of the most recent rounds (starts with the initial balance). */
  balanceHistory: number[];
}

export interface GameState {
  version: 1;
  balance: number;
  stats: PlayerStats;
  history: RoundRecord[];
  transactions: Transaction[];
  soundOn: boolean;
  lastBonusDate: string | null;
  roundCounter: number;
  pending: PendingRound | null;
}

export type ValidationResult = { ok: true } | { ok: false; error: string };
