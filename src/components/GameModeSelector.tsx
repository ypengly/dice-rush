import { MODE_LABELS } from '../engine/gameRules';
import { payoutMultiplier } from '../engine/payoutEngine';
import type { GameMode, Prediction } from '../types/game';
import { formatMultiplier } from '../utils/formatCoins';

interface Props {
  prediction: Prediction;
  onChange: (p: Prediction) => void;
  disabled: boolean;
}

const MODES: GameMode[] = ['exact', 'highlow', 'evenodd', 'doubles'];
const DEFAULT_FOR_MODE: Record<GameMode, Prediction> = {
  exact: { mode: 'exact', value: 7 },
  highlow: { mode: 'highlow', side: 'high' },
  evenodd: { mode: 'evenodd', side: 'even' },
  doubles: { mode: 'doubles' },
};

function Choice({
  label,
  hint,
  selected,
  disabled,
  onClick,
  wide,
}: {
  label: string;
  hint: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      className={`choice ${selected ? 'selected' : ''} ${wide ? 'wide' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="choice-label">{label}</span>
      <span className="choice-hint">{hint}</span>
    </button>
  );
}

export default function GameModeSelector({ prediction, onChange, disabled }: Props) {
  const hint = (p: Prediction) => formatMultiplier(payoutMultiplier(p));

  return (
    <div className="mode-selector">
      <div className="tabs" role="tablist" aria-label="Game mode">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={prediction.mode === m}
            className={`tab ${prediction.mode === m ? 'active' : ''}`}
            disabled={disabled}
            onClick={() => prediction.mode !== m && onChange(DEFAULT_FOR_MODE[m])}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="choices" aria-label="Prediction">
        {prediction.mode === 'exact' && (
          <div className="exact-grid">
            {Array.from({ length: 11 }, (_, i) => i + 2).map((v) => {
              const p: Prediction = { mode: 'exact', value: v };
              return (
                <Choice
                  key={v}
                  label={String(v)}
                  hint={hint(p)}
                  selected={prediction.mode === 'exact' && prediction.value === v}
                  disabled={disabled}
                  onClick={() => onChange(p)}
                />
              );
            })}
          </div>
        )}

        {prediction.mode === 'highlow' && (
          <div className="pair">
            {(['low', 'high'] as const).map((side) => {
              const p: Prediction = { mode: 'highlow', side };
              return (
                <Choice
                  key={side}
                  label={side === 'low' ? 'LOW 2–6' : 'HIGH 8–12'}
                  hint={`${hint(p)} · 7 refunds`}
                  selected={prediction.mode === 'highlow' && prediction.side === side}
                  disabled={disabled}
                  onClick={() => onChange(p)}
                />
              );
            })}
          </div>
        )}

        {prediction.mode === 'evenodd' && (
          <div className="pair">
            {(['even', 'odd'] as const).map((side) => {
              const p: Prediction = { mode: 'evenodd', side };
              return (
                <Choice
                  key={side}
                  label={side.toUpperCase()}
                  hint={hint(p)}
                  selected={prediction.mode === 'evenodd' && prediction.side === side}
                  disabled={disabled}
                  onClick={() => onChange(p)}
                />
              );
            })}
          </div>
        )}

        {prediction.mode === 'doubles' && (
          <Choice
            wide
            label="DOUBLES"
            hint={`${hint({ mode: 'doubles' })} · both dice match`}
            selected
            disabled={disabled}
            onClick={() => onChange({ mode: 'doubles' })}
          />
        )}
      </div>
    </div>
  );
}
