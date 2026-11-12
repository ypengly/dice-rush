import { useCallback, useSyncExternalStore } from 'react';
import { sfx } from '../audio/sound';
import { CONFIG } from '../engine/gameRules';
import { maxBetFor } from '../engine/validation';
import { canClaimDailyBonus, gameStore } from '../store/gameStore';

export function useWallet() {
  const state = useSyncExternalStore(gameStore.subscribe, gameStore.getState);
  const canClaim = canClaimDailyBonus(state) && !state.pending;

  const claimBonus = useCallback(() => {
    if (gameStore.claimDailyBonus()) sfx.bonus();
  }, []);

  const resetBalance = useCallback(() => gameStore.resetGame(), []);

  return {
    balance: state.balance,
    maxBet: maxBetFor(state.balance),
    canAffordMinBet: state.balance >= CONFIG.MIN_BET,
    canClaim,
    dailyBonus: CONFIG.DAILY_BONUS,
    claimBonus,
    resetBalance,
  };
}
