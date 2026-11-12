import { CONFIG } from '../engine/gameRules';
import { describePrediction } from '../engine/gameRules';
import type { useGame } from '../hooks/useGame';
import { useWallet } from '../hooks/useWallet';
import { formatCoins, formatMultiplier, formatPercent } from '../utils/formatCoins';
import GameModeSelector from './GameModeSelector';

type Game = ReturnType<typeof useGame>;

export default function BettingPanel({ game }: { game: Game }) {
  const { maxBet, canAffordMinBet, canClaim, dailyBonus } = useWallet();
  const { prediction, rolling, betInput, bet, profit, multiplier, winChance } = game;
  const message = game.error ?? (betInput === '' ? null : game.validationMessage);
  const showBroke = !canAffordMinBet && !rolling;

  return (
    <section className="card betting" aria-label="Betting panel">
      <GameModeSelector prediction={prediction} onChange={game.choosePrediction} disabled={rolling} />

      <div className="bet-row">
        <label htmlFor="bet-input" className="field-label">
          Bet amount <span className="muted">(min {CONFIG.MIN_BET} · max {formatCoins(maxBet || CONFIG.MAX_BET)})</span>
        </label>
        <div className="bet-input-wrap">
          <input
            id="bet-input"
            className="bet-input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={betInput}
            disabled={rolling}
            onChange={(e) => game.changeBet(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && game.roll()}
            aria-invalid={!!message}
            aria-describedby="bet-message"
          />
          <span className="bet-suffix">coins</span>
        </div>
        <div className="quick-bets">
          {CONFIG.QUICK_BETS.map((q) => (
            <button key={q} type="button" className="chip" disabled={rolling || q > maxBet} onClick={() => game.quickBet(q)}>
              {q}
            </button>
          ))}
          <button type="button" className="chip chip-max" disabled={rolling || maxBet < CONFIG.MIN_BET} onClick={() => game.quickBet('max')}>
            MAX
          </button>
        </div>
      </div>

      <div className="payout-box" aria-label="Potential winnings">
        <div>
          <span className="muted">Betting on</span>
          <strong>{describePrediction(prediction)}</strong>
        </div>
        <div>
          <span className="muted">Payout</span>
          <strong>{formatMultiplier(multiplier)}</strong>
        </div>
        <div>
          <span className="muted">Win chance</span>
          <strong>{formatPercent(winChance)}</strong>
        </div>
        <div className="payout-profit">
          <span className="muted">Potential profit</span>
          <strong data-testid="potential-profit">+{formatCoins(profit)}</strong>
        </div>
      </div>

      <div id="bet-message" className={`message ${message ? 'error' : ''}`} role="alert">
        {message ?? '\u00a0'}
      </div>

      {showBroke && (
        <div className="message info">
          Not enough coins to bet. {canClaim ? `Claim your daily +${dailyBonus} bonus above, or ` : ''}reset your balance in Settings.
        </div>
      )}

      <button type="button" className="btn btn-roll" disabled={!game.canRoll} onClick={game.roll}>
        {rolling ? 'ROLLING…' : `ROLL DICE${Number.isFinite(bet) && bet > 0 ? ` · ${formatCoins(bet)}` : ''}`}
      </button>
    </section>
  );
}
