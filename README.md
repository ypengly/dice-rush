# 🎲 DICE RUSH – Guess. Roll. Win.

A polished, casino-style dice betting game built with **React + TypeScript + Vite**.
Predict the result of two six-sided dice, place a bet with **virtual coins**, and watch the 3D dice tumble.
Odds are transparent and every payout is derived from the real dice probabilities. **No real money is ever involved.**

## Features

- **4 game modes** – Exact Number (2–12), HIGH / LOW (7 is a push), EVEN / ODD, DOUBLES
- **Fair payouts** – computed from true probabilities with a configurable **3 % house edge**; potential profit is shown before every roll
- **Virtual wallet** – 1,000 starting coins, bets 10–500 (never above your balance), quick-bet chips, MAX button, daily +250 bonus, reset with confirmation
- **3D CSS dice** – tumble, bounce and land on the engine's result; gold particle burst on a win, subtle red pulse on a loss, animated total
- **Sound effects** – synthesized with the Web Audio API (no audio files), mute toggle in the header and settings
- **Statistics dashboard** – rounds, wins, losses, win rate, wagered, profit/loss, biggest win, streak + SVG charts (balance over time, results donut, totals histogram vs. expected)
- **History** – every round (dice, total, prediction, bet, result, coins) with All / Wins / Losses / Pushes filters, plus a transaction ledger
- **Persistence** – wallet, stats, history, sound preference and bonus status are saved in `localStorage`
- **Responsive** – desktop, tablet and mobile layouts; respects `prefers-reduced-motion`
- **Odds table** in Settings showing chance, payout multiplier and profit for every bet

## Tech stack

React 18 · TypeScript (strict) · Vite 5 · Vitest · plain CSS (glassmorphism, CSS 3D transforms) · Web Crypto API · Web Audio API

## Getting started

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Run all unit tests once (Vitest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run build` | Type check + production build into `dist/` |
| `npm run preview` | Serve the production build locally |

## Game rules

1. Pick a mode and a prediction, enter a bet (10–500 coins, up to your balance), press **ROLL DICE**.
2. Two dice are rolled by the game engine (cryptographically secure RNG).
3. Outcomes:

| Mode | Wins when | Chance |
| --- | --- | --- |
| Exact Number | total equals your number | 1/36 (2, 12) up to 6/36 (7) |
| LOW | total 2–6 | 15/36 |
| HIGH | total 8–12 | 15/36 |
| EVEN / ODD | total has that parity | 18/36 |
| DOUBLES | both dice show the same number | 6/36 |

A total of **7** on HIGH / LOW is a **push** – your bet is refunded.
The wallet can never go negative, and a new roll cannot start while one is in progress.

## Payout calculation

For a prediction with win probability `pWin` and push probability `pPush`, the payout multiplier (stake included) is

```
multiplier = (1 − houseEdge − pPush) / pWin
```

so the expected return per coin is exactly `1 − houseEdge` (97 %) for **every** bet.

- Net profit on a win = `bet × (multiplier − 1)`, rounded **down** to whole coins (so rounding never reduces the house edge).
- Loss: the wager is deducted. Push: the wager is refunded.

Examples (3 % edge): Exact 7 → 5.82×, Exact 2 or 12 → 34.92×, Doubles → 5.82×, EVEN/ODD → 1.94×,
HIGH/LOW → ≈1.93× (slightly lower than 1.94× because the refunded 7 is accounted for).
Change `CONFIG.HOUSE_EDGE` in `src/engine/gameRules.ts` to tune it – all payouts, UI and tests follow.

## Architecture

```
src/
├── engine/        Pure, framework-free game logic
│   ├── diceEngine.ts    secure RNG (crypto.getRandomValues, rejection sampling), rollDice()
│   ├── gameRules.ts     CONFIG, outcome rules, exact win/push counts by enumerating all 36 combos
│   ├── payoutEngine.ts  multiplier, potential profit, settlement
│   └── validation.ts    bet & prediction validation with user-facing messages
├── store/gameStore.ts   Framework-agnostic store: wallet, stats, history, ledger, bonus, reset
├── storage/             StorageAdapter interface + localStorage / in-memory adapters
├── hooks/               useGame (UI state + roll flow), useWallet, useCountUp
├── components/          Header, Wallet, DiceArena, Dice, ResultDisplay, BettingPanel,
│                        GameModeSelector, Statistics, GameHistory, Settings
├── audio/sound.ts       Synthesized sound effects
├── types/game.ts        Shared types
└── utils/formatCoins.ts Formatting helpers
tests/                   Vitest suites for engine, payouts, rules and the store
```

**The animation never decides the result.** `startRound()` validates the bet, rolls the dice with the engine,
settles the outcome and locks the table *before* any animation starts; the dice component only receives the
already-decided faces and chooses a flashy path to land on them (extra spins are multiples of 360°).
`finishRound()` then pays out exactly once. If the page is closed mid-roll, the pending round is settled on the
next load, so refreshing can't be used to dodge a loss.

**Swapping in a backend:** implement `StorageAdapter` (`load` / `save` / `clear`) and pass it to
`createGameStore(adapter)`. Nothing else needs to change.

## Testing

`npm test` covers: dice generation and RNG bounds, **all 36 combinations** for every prediction type,
win / lose / push logic, probabilities, payout maths and RTP = 97 % for every bet, invalid bets,
insufficient balance, wallet updates (exactly once per round), duplicate-roll prevention, stats and streaks,
persistence across reloads, interrupted rounds, daily bonus and reset.

## License

MIT – for demonstration and entertainment. Virtual coins have no monetary value.
