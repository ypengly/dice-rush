import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { setSoundEnabled, sfx } from '../audio/sound';
import { payoutMultiplier, potentialProfit } from '../engine/payoutEngine';
import { CONFIG, winProbability } from '../engine/gameRules';
import { maxBetFor, validateBet, validatePrediction } from '../engine/validation';
import { gameStore } from '../store/gameStore';
import type { Prediction, RoundRecord } from '../types/game';

/** How long the dice tumble before the (already decided) result is revealed. */
export const ROLL_MS = 1800;

export interface DiceAnimation {
  rollId: number;
  dice: [number, number];
  rolling: boolean;
}

export function useGame() {
  const state = useSyncExternalStore(gameStore.subscribe, gameStore.getState);

  const [prediction, setPrediction] = useState<Prediction>({ mode: 'highlow', side: 'high' });
  const [betInput, setBetInput] = useState<string>('50');
  const [error, setError] = useState<string | null>(null);
  const [lastRound, setLastRound] = useState<RoundRecord | null>(state.history[0] ?? null);
  const [animation, setAnimation] = useState<DiceAnimation>({
    rollId: 0,
    dice: state.history[0]?.dice ?? [1, 6],
    rolling: false,
  });

  const lock = useRef(false); // synchronous guard: blocks double clicks before React re-renders
  const timer = useRef<number | null>(null);
  const rolling = animation.rolling;

  useEffect(() => {
    setSoundEnabled(state.soundOn);
  }, [state.soundOn]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const bet = betInput.trim() === '' ? Number.NaN : Number(betInput);
  const betCheck = validateBet(bet, state.balance);
  const predictionCheck = validatePrediction(prediction);
  const multiplier = payoutMultiplier(prediction);
  const winChance = winProbability(prediction);
  const profit = betCheck.ok ? potentialProfit(prediction, bet) : 0;

  const changeBet = useCallback(
    (raw: string) => {
      if (lock.current) return;
      const cleaned = raw.replace(/[^\d]/g, '').slice(0, 7);
      setBetInput(cleaned);
      setError(null);
    },
    [],
  );

  const quickBet = useCallback(
    (amount: number | 'max') => {
      if (lock.current) return;
      const value = amount === 'max' ? maxBetFor(state.balance) : Math.min(amount, maxBetFor(state.balance));
      setBetInput(String(value));
      setError(null);
      sfx.click();
    },
    [state.balance],
  );

  const choosePrediction = useCallback((p: Prediction) => {
    if (lock.current) return; // predictions are frozen during a roll
    setPrediction(p);
    setError(null);
    sfx.click();
  }, []);

  const roll = useCallback(() => {
    if (lock.current) return;
    const p = validatePrediction(prediction);
    if (!p.ok) return setError(p.error);
    const result = gameStore.startRound(prediction, bet);
    if (!result.ok) return setError(result.error);

    lock.current = true;
    setError(null);
    setLastRound(null);
    setAnimation((a) => ({ rollId: a.rollId + 1, dice: result.round.roll.dice, rolling: true }));
    sfx.roll();
    // On single-column (mobile/tablet) layouts the arena sits above the betting panel – bring it into view.
    if (window.matchMedia('(max-width: 960px)').matches) {
      document.querySelector('.arena')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    timer.current = window.setTimeout(() => {
      const record = gameStore.finishRound();
      lock.current = false;
      timer.current = null;
      setAnimation((a) => ({ ...a, rolling: false }));
      setLastRound(record);
      if (record) {
        if (record.outcome === 'win') sfx.win();
        else if (record.outcome === 'lose') sfx.lose();
        else sfx.push();
        // keep the bet within what the wallet can now afford
        const cap = maxBetFor(gameStore.getState().balance);
        setBetInput((prev) => (Number(prev) > cap && cap >= CONFIG.MIN_BET ? String(cap) : prev));
      }
    }, ROLL_MS);
  }, [prediction, bet]);

  const toggleSound = useCallback(() => {
    gameStore.setSound(!gameStore.getState().soundOn);
  }, []);

  const canRoll = !rolling && betCheck.ok && predictionCheck.ok;
  const validationMessage = !betCheck.ok ? betCheck.error : !predictionCheck.ok ? predictionCheck.error : null;

  return {
    state,
    prediction,
    betInput,
    bet,
    error,
    validationMessage,
    lastRound,
    animation,
    rolling,
    canRoll,
    multiplier,
    winChance,
    profit,
    changeBet,
    quickBet,
    choosePrediction,
    roll,
    toggleSound,
  };
}
