import { useEffect, useState } from 'react';
import { formatCoins, formatSigned } from '../utils/formatCoins';
import type { RoundRecord } from '../types/game';

interface Props {
  rolling: boolean;
  round: RoundRecord | null;
}

export default function ResultDisplay({ rolling, round }: Props) {
  // Cosmetic only: flickering digits while the dice tumble. Never used for results.
  const [flicker, setFlicker] = useState(7);
  useEffect(() => {
    if (!rolling) return;
    const id = window.setInterval(() => setFlicker(2 + Math.floor(Math.random() * 11)), 70);
    return () => window.clearInterval(id);
  }, [rolling]);

  let shown: string = '–';
  if (rolling) shown = String(flicker);
  else if (round) shown = String(round.total);

  let status = 'Place your bet and roll the dice!';
  let tone = 'idle';
  if (rolling) {
    status = 'Dice are rolling…';
    tone = 'rolling';
  } else if (round) {
    tone = round.outcome;
    if (round.outcome === 'win') status = `WIN  ${formatSigned(round.net)} coins`;
    else if (round.outcome === 'lose') status = `LOSE  ${formatSigned(round.net)} coins`;
    else status = `PUSH – ${formatCoins(round.bet)} coins refunded`;
  }

  return (
    <div className={`result result-${tone}`} aria-live="polite">
      <div className="total-label">TOTAL</div>
      <div key={rolling ? 'rolling' : (round?.id ?? 'none')} className={`total-number ${rolling ? 'flicker' : 'pop'}`}>
        {shown}
      </div>
      <div className={`status status-${tone}`}>{status}</div>
    </div>
  );
}
