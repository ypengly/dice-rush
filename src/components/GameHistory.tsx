import { useState } from 'react';
import type { GameState, Outcome } from '../types/game';
import { formatCoins, formatSigned } from '../utils/formatCoins';

type Filter = 'all' | Outcome;
type View = 'rounds' | 'transactions';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'win', label: 'Wins' },
  { id: 'lose', label: 'Losses' },
  { id: 'push', label: 'Pushes' },
];

const OUTCOME_LABEL: Record<Outcome, string> = { win: 'WIN', lose: 'LOSS', push: 'PUSH' };

/** Strip of the last results (newest first). */
export function RecentResults({ history }: { history: GameState['history'] }) {
  const recent = history.slice(0, 14);
  return (
    <div className="card recent" aria-label="Recent results">
      <div className="card-title">Recent results</div>
      {recent.length === 0 ? (
        <div className="empty">No rounds yet – roll to get started.</div>
      ) : (
        <div className="recent-strip">
          {recent.map((r) => (
            <div key={r.id} className={`recent-chip ${r.outcome}`} title={`#${r.id} · ${r.predictionLabel} · ${formatSigned(r.net)}`}>
              <b>{r.total}</b>
              <small>{r.dice[0]}+{r.dice[1]}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GameHistory({ state }: { state: GameState }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('rounds');

  const rows = state.history.filter((r) => filter === 'all' || r.outcome === filter).slice(0, 100);
  const txs = state.transactions.slice(0, 100);

  return (
    <section className="card history" aria-label="History">
      <div className="card-head">
        <div className="card-title">History</div>
        <div className="seg" role="tablist" aria-label="History view">
          <button type="button" role="tab" aria-selected={view === 'rounds'} className={view === 'rounds' ? 'active' : ''} onClick={() => setView('rounds')}>
            Rounds
          </button>
          <button type="button" role="tab" aria-selected={view === 'transactions'} className={view === 'transactions' ? 'active' : ''} onClick={() => setView('transactions')}>
            Transactions
          </button>
        </div>
      </div>

      {view === 'rounds' ? (
        <>
          <div className="filters" role="group" aria-label="Filter rounds">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className={`chip ${filter === f.id ? 'on' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          {rows.length === 0 ? (
            <div className="empty">{state.history.length === 0 ? 'No rounds played yet.' : 'No rounds match this filter.'}</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dice</th>
                    <th>Total</th>
                    <th>Prediction</th>
                    <th className="num">Bet</th>
                    <th>Result</th>
                    <th className="num">Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.dice[0]} · {r.dice[1]}</td>
                      <td><b>{r.total}</b></td>
                      <td>{r.predictionLabel}</td>
                      <td className="num">{formatCoins(r.bet)}</td>
                      <td><span className={`badge ${r.outcome}`}>{OUTCOME_LABEL[r.outcome]}</span></td>
                      <td className={`num ${r.net > 0 ? 'pos' : r.net < 0 ? 'neg' : ''}`}>{formatSigned(r.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : txs.length === 0 ? (
        <div className="empty">No transactions yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Description</th>
                <th className="num">Amount</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{t.description}</td>
                  <td className={`num ${t.amount > 0 ? 'pos' : t.amount < 0 ? 'neg' : ''}`}>{formatSigned(t.amount)}</td>
                  <td className="num">{formatCoins(t.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
