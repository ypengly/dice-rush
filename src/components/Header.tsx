import Wallet from './Wallet';

interface Props {
  soundOn: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
}

export default function Header({ soundOn, onToggleSound, onOpenSettings }: Props) {
  return (
    <header className="header">
      <div className="logo" aria-label="Dice Rush">
        <span className="logo-dice" aria-hidden="true">⚄</span>
        <div>
          <div className="logo-title">DICE <b>RUSH</b></div>
          <div className="logo-sub">Guess. Roll. Win.</div>
        </div>
      </div>
      <Wallet />
      <div className="header-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          title={soundOn ? 'Mute' : 'Unmute'}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
        <button type="button" className="icon-btn" onClick={onOpenSettings} aria-label="Open settings" title="Settings">
          ⚙️
        </button>
      </div>
    </header>
  );
}
