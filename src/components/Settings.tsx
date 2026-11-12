import { useEffect, useState } from 'react';
import { allPredictions, CONFIG, describePrediction, TOTAL_COMBINATIONS } from '../engine/gameRules';
import { payoutMultiplier, potentialProfit } from '../engine/payoutEngine';
import { winProbability } from '../engine/gameRules';
import { useWallet } from '../hooks/useWallet';
import { formatCoins, formatMultiplier, formatPercent } from '../utils/formatCoins';

interface Props {
  open: boolean;
  soundOn: boolean;
  rolling: boolean;
  onToggleSound: () => void;
  onClose: () => void;
}

export default function Settings({ open, soundOn, rolling, onToggleSound, onClose }: Props) {
  const { resetBalance } = useWallet();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const doReset = () => {
    if (resetBalance()) {
      setConfirming(false);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal card" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="card-head">
          <div className="card-title">Settings</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="setting-row">
          <div>
            <b>Sound effects</b>
            <div className="muted">Synthesized dice, win and lose sounds</div>
          </div>
          <button type="button" className={`switch ${soundOn ? 'on' : ''}`} role="switch" aria-checked={soundOn} onClick={onToggleSound}>
            <span />
          </button>
        </div>

        <div className="setting-row col">
          <div>
            <b>Reset balance</b>
            <div className="muted">Back to {formatCoins(CONFIG.STARTING_BALANCE)} coins. Clears statistics and history.</div>
          </div>
          {!confirming ? (
            <button type="button" className="btn btn-danger" disabled={rolling} onClick={() => setConfirming(true)}>
              Reset game…
            </button>
          ) : (
            <div className="confirm">
              <span>Really erase all progress?</span>
              <button type="button" className="btn" onClick={() => setConfirming(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={doReset}>Yes, reset</button>
            </div>
          )}
        </div>

        <div className="card-title" style={{ marginTop: 14 }}>Odds &amp; payouts</div>
        <p className="muted small">
          Virtual coins only – no real money. Payouts are computed from the true dice probabilities with a{' '}
          {formatPercent(CONFIG.HOUSE_EDGE, 0)} house edge. Profit shown for a 100-coin bet.
        </p>
        <div className="table-wrap odds">
          <table>
            <thead>
              <tr>
                <th>Bet</th>
                <th className="num">Chance</th>
                <th className="num">Pays</th>
                <th className="num">Profit</th>
              </tr>
            </thead>
            <tbody>
              {allPredictions().map((p) => (
                <tr key={describePrediction(p)}>
                  <td>{describePrediction(p)}</td>
                  <td className="num">{Math.round(winProbability(p) * TOTAL_COMBINATIONS)}/{TOTAL_COMBINATIONS}</td>
                  <td className="num">{formatMultiplier(payoutMultiplier(p))}</td>
                  <td className="num">+{potentialProfit(p, 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
