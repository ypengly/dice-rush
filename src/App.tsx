import { useState } from 'react';
import BettingPanel from './components/BettingPanel';
import DiceArena from './components/DiceArena';
import GameHistory, { RecentResults } from './components/GameHistory';
import Header from './components/Header';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import { useGame } from './hooks/useGame';

export default function App() {
  const game = useGame();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <Header soundOn={game.state.soundOn} onToggleSound={game.toggleSound} onOpenSettings={() => setSettingsOpen(true)} />

      <main className="layout">
        <div className="col-main">
          <DiceArena animation={game.animation} round={game.lastRound} />
          <RecentResults history={game.state.history} />
        </div>
        <BettingPanel game={game} />
      </main>

      <div className="bottom">
        <Statistics state={game.state} />
        <GameHistory state={game.state} />
      </div>

      <footer className="footer">Virtual coins only · no real-money play · play responsibly</footer>

      <Settings
        open={settingsOpen}
        soundOn={game.state.soundOn}
        rolling={game.rolling}
        onToggleSound={game.toggleSound}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
