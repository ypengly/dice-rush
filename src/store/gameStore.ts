import { rollDice, type RandomSource, secureRandomInt } from '../engine/diceEngine';
import { CONFIG, describePrediction, evaluatePrediction } from '../engine/gameRules';
import { settle } from '../engine/payoutEngine';
import { validateBet, validatePrediction } from '../engine/validation';
import { localStorageAdapter, type StorageAdapter } from '../storage/localStorage';
import type {
  GameState,
  PendingRound,
  PlayerStats,
  Prediction,
  RoundRecord,
  Transaction,
} from '../types/game';

export type StartResult = { ok: true; round: PendingRound } | { ok: false; error: string };

export function createInitialStats(): PlayerStats {
  return {
    rounds: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    wagered: 0,
    profit: 0,
    biggestWin: 0,
    streak: 0,
    bestWinStreak: 0,
    balanceHistory: [CONFIG.STARTING_BALANCE],
  };
}

export function createInitialState(): GameState {
  return {
    version: 1,
    balance: CONFIG.STARTING_BALANCE,
    stats: createInitialStats(),
    history: [],
    transactions: [],
    soundOn: true,
    lastBonusDate: null,
    roundCounter: 0,
    pending: null,
  };
}

/** Pure: fold a finished round into the running statistics. */
export function applyRoundToStats(stats: PlayerStats, round: RoundRecord, balanceAfter: number): PlayerStats {
  let streak = stats.streak;
  if (round.outcome === 'win') streak = streak > 0 ? streak + 1 : 1;
  else if (round.outcome === 'lose') streak = streak < 0 ? streak - 1 : -1;
  return {
    rounds: stats.rounds + 1,
    wins: stats.wins + (round.outcome === 'win' ? 1 : 0),
    losses: stats.losses + (round.outcome === 'lose' ? 1 : 0),
    pushes: stats.pushes + (round.outcome === 'push' ? 1 : 0),
    wagered: stats.wagered + round.bet,
    profit: stats.profit + round.net,
    biggestWin: Math.max(stats.biggestWin, round.outcome === 'win' ? round.net : 0),
    streak,
    bestWinStreak: Math.max(stats.bestWinStreak, streak),
    balanceHistory: [...stats.balanceHistory, balanceAfter].slice(-CONFIG.BALANCE_HISTORY_LIMIT),
  };
}

export function winRate(stats: PlayerStats): number {
  const decided = stats.wins + stats.losses;
  return decided === 0 ? 0 : stats.wins / decided;
}

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function canClaimDailyBonus(state: GameState, now: Date = new Date()): boolean {
  return state.lastBonusDate !== todayKey(now);
}

/** Defensive merge of whatever was persisted into a complete, valid state. */
function hydrate(saved: Partial<GameState> | null): GameState {
  const base = createInitialState();
  if (!saved || saved.version !== 1) return base;
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  const stats = { ...base.stats, ...(saved.stats ?? {}) };
  if (!Array.isArray(stats.balanceHistory) || stats.balanceHistory.length === 0) {
    stats.balanceHistory = [num(saved.balance, base.balance)];
  }
  return {
    version: 1,
    balance: Math.max(0, Math.floor(num(saved.balance, base.balance))),
    stats,
    history: Array.isArray(saved.history) ? saved.history.slice(0, CONFIG.HISTORY_LIMIT) : [],
    transactions: Array.isArray(saved.transactions) ? saved.transactions.slice(0, CONFIG.TRANSACTION_LIMIT) : [],
    soundOn: typeof saved.soundOn === 'boolean' ? saved.soundOn : true,
    lastBonusDate: typeof saved.lastBonusDate === 'string' ? saved.lastBonusDate : null,
    roundCounter: Math.max(0, Math.floor(num(saved.roundCounter, 0))),
    pending: saved.pending ?? null,
  };
}

export interface GameStoreOptions {
  rand?: RandomSource;
  now?: () => Date;
}

/**
 * Framework-agnostic game store.
 *
 * A round is two-phase so the animation can never influence the result:
 *   startRound()  – validates, rolls with the engine, locks the table, deducts the bet,
 *                   and persists the pending round (the result is already decided here).
 *   finishRound() – pays out exactly once, writes history/stats, unlocks the table.
 * If the page is closed mid-roll, the pending round is settled on the next load,
 * so refreshing can never be used to dodge a loss.
 */
export function createGameStore(storage: StorageAdapter = localStorageAdapter, options: GameStoreOptions = {}) {
  const rand = options.rand ?? secureRandomInt;
  const now = options.now ?? (() => new Date());
  let state: GameState = hydrate(storage.load());
  const listeners = new Set<() => void>();
  let txCounter = 0;

  const commit = (next: GameState) => {
    state = next;
    storage.save(state);
    listeners.forEach((l) => l());
  };

  const nextTxId = () => `${now().getTime()}-${txCounter++}`;

  const addTransaction = (s: GameState, tx: Omit<Transaction, 'id' | 'timestamp'>): Transaction[] =>
    [{ ...tx, id: nextTxId(), timestamp: now().getTime() }, ...s.transactions].slice(0, CONFIG.TRANSACTION_LIMIT);

  function startRound(prediction: Prediction, bet: number): StartResult {
    if (state.pending) return { ok: false, error: 'A round is already in progress.' };
    const p = validatePrediction(prediction);
    if (!p.ok) return p;
    const b = validateBet(bet, state.balance);
    if (!b.ok) return b;

    const roll = rollDice(rand);
    const outcome = evaluatePrediction(prediction, roll.dice[0], roll.dice[1]);
    const settlement = settle(prediction, bet, outcome);
    const round: PendingRound = {
      id: state.roundCounter + 1,
      timestamp: now().getTime(),
      roll,
      prediction,
      bet,
      settlement,
    };
    commit({ ...state, balance: state.balance - bet, roundCounter: round.id, pending: round });
    return { ok: true, round };
  }

  function finishRound(): RoundRecord | null {
    const pending = state.pending;
    if (!pending) return null; // nothing to settle: prevents double payouts
    const { settlement } = pending;
    const balance = state.balance + settlement.payout;
    const record: RoundRecord = {
      id: pending.id,
      timestamp: pending.timestamp,
      dice: pending.roll.dice,
      total: pending.roll.total,
      prediction: pending.prediction,
      predictionLabel: describePrediction(pending.prediction),
      bet: pending.bet,
      outcome: settlement.outcome,
      multiplier: settlement.multiplier,
      payout: settlement.payout,
      net: settlement.net,
    };
    const txType = settlement.outcome === 'win' ? 'win' : settlement.outcome === 'lose' ? 'loss' : 'push';
    commit({
      ...state,
      balance,
      pending: null,
      history: [record, ...state.history].slice(0, CONFIG.HISTORY_LIMIT),
      stats: applyRoundToStats(state.stats, record, balance),
      transactions: addTransaction(state, {
        type: txType,
        description: `Round #${record.id} · ${record.predictionLabel} · rolled ${record.total}`,
        amount: record.net,
        balanceAfter: balance,
      }),
    });
    return record;
  }

  function claimDailyBonus(): boolean {
    if (state.pending || !canClaimDailyBonus(state, now())) return false;
    const balance = state.balance + CONFIG.DAILY_BONUS;
    commit({
      ...state,
      balance,
      lastBonusDate: todayKey(now()),
      transactions: addTransaction(state, {
        type: 'bonus',
        description: 'Daily bonus',
        amount: CONFIG.DAILY_BONUS,
        balanceAfter: balance,
      }),
      stats: { ...state.stats, balanceHistory: [...state.stats.balanceHistory, balance].slice(-CONFIG.BALANCE_HISTORY_LIMIT) },
    });
    return true;
  }

  /** Wipes balance, stats and history. Sound preference and bonus status are kept. */
  function resetGame(): boolean {
    if (state.pending) return false;
    const fresh = createInitialState();
    commit({
      ...fresh,
      soundOn: state.soundOn,
      lastBonusDate: state.lastBonusDate,
      transactions: addTransaction(fresh, {
        type: 'reset',
        description: 'Balance reset',
        amount: 0,
        balanceAfter: fresh.balance,
      }),
    });
    return true;
  }

  function setSound(on: boolean): void {
    commit({ ...state, soundOn: on });
  }

  // Settle any round that was interrupted by a refresh/close.
  if (state.pending) finishRound();

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    startRound,
    finishRound,
    claimDailyBonus,
    resetGame,
    setSound,
  };
}

export type GameStore = ReturnType<typeof createGameStore>;

/** App-wide singleton backed by localStorage. */
export const gameStore: GameStore = createGameStore();
