import { useMemo, type CSSProperties } from 'react';
import type { DiceAnimation } from '../hooks/useGame';
import type { RoundRecord } from '../types/game';
import Dice from './Dice';
import ResultDisplay from './ResultDisplay';

interface Props {
  animation: DiceAnimation;
  round: RoundRecord | null;
}

const PARTICLE_COUNT = 42;

function GoldBurst({ seed }: { seed: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 90 + Math.random() * 160;
        return {
          key: `${seed}-${i}`,
          style: {
            '--dx': `${Math.cos(angle) * dist}px`,
            '--dy': `${Math.sin(angle) * dist - 40}px`,
            '--size': `${4 + Math.random() * 7}px`,
            animationDelay: `${Math.random() * 180}ms`,
          } as CSSProperties,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );
  return (
    <div className="burst" aria-hidden="true">
      {particles.map((p) => (
        <span key={p.key} className="particle" style={p.style} />
      ))}
    </div>
  );
}

export default function DiceArena({ animation, round }: Props) {
  const showWin = !animation.rolling && round?.outcome === 'win';
  const showLose = !animation.rolling && round?.outcome === 'lose';

  return (
    <section className={`card arena ${showLose ? 'lose-flash' : ''} ${showWin ? 'win-glow' : ''}`} aria-label="Dice arena">
      <div className="arena-felt">
        <div className="dice-row">
          <Dice value={animation.dice[0]} rollId={animation.rollId} rolling={animation.rolling} index={0} />
          <Dice value={animation.dice[1]} rollId={animation.rollId} rolling={animation.rolling} index={1} />
        </div>
        {showWin && round && <GoldBurst key={round.id} seed={round.id} />}
        {showLose && round && <div key={round.id} className="red-pulse" aria-hidden="true" />}
      </div>
      <ResultDisplay rolling={animation.rolling} round={round} />
    </section>
  );
}
