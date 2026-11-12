import { waysToTotal } from '../engine/gameRules';
import { winRate } from '../store/gameStore';
import type { GameState } from '../types/game';
import { formatCoins, formatPercent, formatSigned } from '../utils/formatCoins';

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className={`tile-value ${tone ?? ''}`}>{value}</div>
    </div>
  );
}

function BalanceChart({ points }: { points: number[] }) {
  const W = 320;
  const H = 120;
  const pad = 8;
  const data = points.length > 1 ? points : [points[0] ?? 0, points[0] ?? 0];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Balance over time">
      <defs>
        <linearGradient id="balfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#balfill)" />
      <path d={line} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="4" fill="var(--gold)" />
    </svg>
  );
}

function Donut({ wins, losses, pushes }: { wins: number; losses: number; pushes: number }) {
  const total = wins + losses + pushes;
  const r = 38;
  const c = 2 * Math.PI * r;
  const segs = [
    { v: wins, color: 'var(--win)' },
    { v: pushes, color: 'var(--push)' },
    { v: losses, color: 'var(--lose)' },
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="donut" role="img" aria-label="Wins, pushes and losses">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" />
      {total > 0 &&
        segs.map((s, i) => {
          const len = (s.v / total) * c;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += len;
          return el;
        })}
      <text x="50" y="48" textAnchor="middle" className="donut-big">{total}</text>
      <text x="50" y="62" textAnchor="middle" className="donut-small">rounds</text>
    </svg>
  );
}

function TotalsChart({ history }: { history: GameState['history'] }) {
  const counts: number[] = Array(13).fill(0);
  history.forEach((r) => counts[r.total]++);
  const n = history.length;
  const expected = (t: number) => (n * waysToTotal(t)) / 36;
  const maxV = Math.max(1, ...counts.slice(2), ...Array.from({ length: 11 }, (_, i) => expected(i + 2)));
  const W = 320;
  const H = 120;
  const bw = (W - 16) / 11;
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="chart" role="img" aria-label="How often each total was rolled">
      {Array.from({ length: 11 }, (_, i) => i + 2).map((t, i) => {
        const h = (counts[t] / maxV) * (H - 10);
        const ex = (expected(t) / maxV) * (H - 10);
        const x = 8 + i * bw;
        return (
          <g key={t}>
            <rect x={x + 3} y={H - h} width={bw - 6} height={Math.max(h, 0)} rx="3" fill="var(--purple)" />
            {n > 0 && <line x1={x + 1} x2={x + bw - 1} y1={H - ex} y2={H - ex} stroke="var(--gold)" strokeWidth="2" strokeDasharray="3 2" />}
            <text x={x + bw / 2} y={H + 12} textAnchor="middle" className="axis">{t}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Statistics({ state }: { state: GameState }) {
  const s = state.stats;
  const streakText = s.streak === 0 ? '–' : s.streak > 0 ? `${s.streak} win${s.streak > 1 ? 's' : ''}` : `${-s.streak} loss${s.streak < -1 ? 'es' : ''}`;

  return (
    <section className="card stats" aria-label="Statistics">
      <div className="card-title">Statistics</div>
      <div className="tiles">
        <Tile label="Rounds" value={formatCoins(s.rounds)} />
        <Tile label="Wins" value={formatCoins(s.wins)} tone="pos" />
        <Tile label="Losses" value={formatCoins(s.losses)} tone="neg" />
        <Tile label="Win rate" value={s.wins + s.losses === 0 ? '–' : formatPercent(winRate(s))} />
        <Tile label="Wagered" value={formatCoins(s.wagered)} />
        <Tile label="Profit / loss" value={formatSigned(s.profit)} tone={s.profit > 0 ? 'pos' : s.profit < 0 ? 'neg' : undefined} />
        <Tile label="Biggest win" value={s.biggestWin ? `+${formatCoins(s.biggestWin)}` : '–'} />
        <Tile label="Streak" value={streakText} tone={s.streak > 0 ? 'pos' : s.streak < 0 ? 'neg' : undefined} />
      </div>

      <div className="charts">
        <figure>
          <figcaption>Balance</figcaption>
          <BalanceChart points={s.balanceHistory} />
        </figure>
        <figure className="donut-fig">
          <figcaption>Results</figcaption>
          <Donut wins={s.wins} losses={s.losses} pushes={s.pushes} />
          <div className="legend">
            <span><i className="dot win" /> Win {s.wins}</span>
            <span><i className="dot push" /> Push {s.pushes}</span>
            <span><i className="dot lose" /> Loss {s.losses}</span>
          </div>
        </figure>
        <figure>
          <figcaption>Totals rolled <span className="muted">(dashed = expected)</span></figcaption>
          <TotalsChart history={state.history} />
        </figure>
      </div>
    </section>
  );
}
