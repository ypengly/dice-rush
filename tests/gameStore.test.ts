import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/engine/gameRules';
import { createMemoryStorage } from '../src/storage/localStorage';
import { canClaimDailyBonus, createGameStore, winRate } from '../src/store/gameStore';

/** Deterministic dice: each pair of values feeds die 1 then die 2 (faces given as 1..6). */
function fixedDice(...faces: number[]) {
  let i = 0;
  return (max: number) => {
    const v = faces[i++ % faces.length] - 1;
    return v % max;
  };
}

const EVEN = { mode: 'evenodd', side: 'even' } as const;

describe('gameStore – wallet & rounds', () => {
  it('starts with 1,000 coins', () => {
    const s = createGameStore(createMemoryStorage());
    expect(s.getState().balance).toBe(1000);
  });

  it('winning round updates the wallet exactly once', () => {
    const s = createGameStore(createMemoryStorage(), { rand: fixedDice(3, 3) }); // total 6, even
    const start = s.startRound(EVEN, 100);
    expect(start.ok).toBe(true);
    expect(s.getState().balance).toBe(900); // bet held
    const rec = s.finishRound();
    expect(rec?.outcome).toBe('win');
    expect(s.getState().balance).toBe(900 + 194);
    expect(s.finishRound()).toBeNull(); // no second payout
    expect(s.getState().balance).toBe(1094);
  });

  it('losing round deducts the bet', () => {
    const s = createGameStore(createMemoryStorage(), { rand: fixedDice(3, 4) }); // 7, odd
    s.startRound(EVEN, 100);
    const rec = s.finishRound();
    expect(rec?.outcome).toBe('lose');
    expect(s.getState().balance).toBe(900);
  });

  it('HIGH/LOW push refunds the bet', () => {
    const s = createGameStore(createMemoryStorage(), { rand: fixedDice(3, 4) }); // 7
    s.startRound({ mode: 'highlow', side: 'high' }, 100);
    const rec = s.finishRound();
    expect(rec?.outcome).toBe('push');
    expect(s.getState().balance).toBe(1000);
    expect(s.getState().stats.pushes).toBe(1);
  });

  it('rejects a second roll while one is in progress (duplicate roll prevention)', () => {
    const s = createGameStore(createMemoryStorage());
    expect(s.startRound(EVEN, 50).ok).toBe(true);
    const again = s.startRound(EVEN, 50);
    expect(again.ok).toBe(false);
    expect(s.getState().balance).toBe(950); // only one bet taken
    expect(s.getState().roundCounter).toBe(1);
  });

  it('rejects invalid bets and never changes the wallet', () => {
    const s = createGameStore(createMemoryStorage());
    for (const bet of [0, 9, -10, 501, 1001, 12.5, Number.NaN]) {
      const r = s.startRound(EVEN, bet);
      expect(r.ok).toBe(false);
    }
    expect(s.getState().balance).toBe(1000);
    expect(s.getState().pending).toBeNull();
  });

  it('rejects bets above the available balance', () => {
    const s = createGameStore(createMemoryStorage({ version: 1, balance: 40 }));
    const r = s.startRound(EVEN, 50);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Insufficient');
    expect(s.getState().balance).toBe(40);
  });

  it('balance can never go negative across many rounds', () => {
    const s = createGameStore(createMemoryStorage({ version: 1, balance: 100 }));
    for (let i = 0; i < 200; i++) {
      const bal = s.getState().balance;
      const bet = Math.min(CONFIG.MAX_BET, bal);
      if (bet < CONFIG.MIN_BET) break;
      s.startRound({ mode: 'exact', value: 12 }, bet);
      s.finishRound();
      expect(s.getState().balance).toBeGreaterThanOrEqual(0);
    }
  });

  it('rejects an invalid prediction', () => {
    const s = createGameStore(createMemoryStorage());
    expect(s.startRound({ mode: 'exact', value: 1 }, 50).ok).toBe(false);
    expect(s.getState().balance).toBe(1000);
  });
});

describe('gameStore – stats & history', () => {
  it('tracks rounds, wins, losses, wagered, profit, biggest win and streaks', () => {
    // win (3,3), win (2,2), lose (3,4)
    const s = createGameStore(createMemoryStorage(), { rand: fixedDice(3, 3, 2, 2, 3, 4) });
    for (const bet of [100, 50, 10]) {
      s.startRound(EVEN, bet);
      s.finishRound();
    }
    const st = s.getState().stats;
    expect(st.rounds).toBe(3);
    expect(st.wins).toBe(2);
    expect(st.losses).toBe(1);
    expect(st.wagered).toBe(160);
    expect(st.profit).toBe(94 + 47 - 10);
    expect(st.biggestWin).toBe(94);
    expect(st.streak).toBe(-1);
    expect(st.bestWinStreak).toBe(2);
    expect(winRate(st)).toBeCloseTo(2 / 3, 10);
    expect(s.getState().history).toHaveLength(3);
    expect(s.getState().history[0].id).toBe(3); // newest first
    expect(s.getState().transactions).toHaveLength(3);
  });
});

describe('gameStore – persistence', () => {
  it('wallet, history, stats and sound survive a reload', () => {
    const storage = createMemoryStorage();
    const a = createGameStore(storage, { rand: fixedDice(3, 3) });
    a.startRound(EVEN, 100);
    a.finishRound();
    a.setSound(false);

    const b = createGameStore(storage);
    expect(b.getState().balance).toBe(1094);
    expect(b.getState().history).toHaveLength(1);
    expect(b.getState().stats.wins).toBe(1);
    expect(b.getState().soundOn).toBe(false);
  });

  it('a round interrupted by a refresh is settled on load (no dodging losses)', () => {
    const storage = createMemoryStorage();
    const a = createGameStore(storage, { rand: fixedDice(3, 4) }); // lose
    a.startRound(EVEN, 100); // ...page closes before finishRound()

    const b = createGameStore(storage);
    expect(b.getState().pending).toBeNull();
    expect(b.getState().balance).toBe(900);
    expect(b.getState().history).toHaveLength(1);
  });

  it('ignores corrupt saved data', () => {
    const s = createGameStore(createMemoryStorage({ version: 1, balance: Number.NaN as number }));
    expect(s.getState().balance).toBe(1000);
  });
});

describe('gameStore – daily bonus & reset', () => {
  it('daily bonus can be claimed once per day', () => {
    let day = new Date(2026, 10, 6, 10);
    const s = createGameStore(createMemoryStorage(), { now: () => day });
    expect(canClaimDailyBonus(s.getState(), day)).toBe(true);
    expect(s.claimDailyBonus()).toBe(true);
    expect(s.getState().balance).toBe(1000 + CONFIG.DAILY_BONUS);
    expect(s.claimDailyBonus()).toBe(false);
    expect(s.getState().balance).toBe(1000 + CONFIG.DAILY_BONUS);
    day = new Date(2026, 10, 7, 9);
    expect(s.claimDailyBonus()).toBe(true);
  });

  it('reset restores 1,000 coins and clears stats and history', () => {
    const s = createGameStore(createMemoryStorage(), { rand: fixedDice(3, 4) });
    s.startRound(EVEN, 100);
    s.finishRound();
    expect(s.resetGame()).toBe(true);
    const st = s.getState();
    expect(st.balance).toBe(1000);
    expect(st.history).toHaveLength(0);
    expect(st.stats.rounds).toBe(0);
  });

  it('cannot reset or claim a bonus mid-roll', () => {
    const s = createGameStore(createMemoryStorage());
    s.startRound(EVEN, 100);
    expect(s.resetGame()).toBe(false);
    expect(s.claimDailyBonus()).toBe(false);
    expect(s.getState().balance).toBe(900);
  });
});
