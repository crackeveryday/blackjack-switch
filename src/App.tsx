import { useEffect, useState } from "react";
import ActionControls from "./components/ActionControls";
import BettingControls from "./components/BettingControls";
import DealerView from "./components/DealerView";
import HandView from "./components/HandView";
import ResultPanel from "./components/ResultPanel";
import {
  clampBet,
  createInitialGameState,
  dealInitialCards,
  declineInsurance,
  formatHandLabel,
  getAvailableChips,
  hit,
  keepCards,
  MAX_BET,
  MIN_BET,
  resetGame,
  startNewRound,
  startNextRound,
  stand,
  switchCards,
  takeInsurance,
  doubleDown,
  splitHand,
  surrender,
} from "./game/gameState";
import { calculateHandValue } from "./game/hand";
import { canDoubleDown, canSplit, canSurrender } from "./game/rules";
import type { GamePhase, PlayerHand } from "./types";

const STORAGE_KEY = "blackjack-switch-chips";

const PHASE_LABELS: Record<GamePhase, string> = {
  betting: "Betting",
  insurance: "Insurance",
  switch: "Switch",
  playerTurn: "Player Turn",
  dealerTurn: "Dealer Turn",
  settlement: "Settlement",
  gameOver: "Game Over",
};

function readInitialState() {
  if (typeof window === "undefined") {
    return createInitialGameState();
  }

  const storedChips = window.localStorage.getItem(STORAGE_KEY);
  const parsedChips = storedChips ? Number(storedChips) : Number.NaN;

  return createInitialGameState(Number.isFinite(parsedChips) ? parsedChips : undefined);
}

function canHitHand(hand: PlayerHand): boolean {
  return hand.status === "active" && calculateHandValue(hand.cards).total < 21 && !hand.isSplitAces;
}

function canStandHand(hand: PlayerHand): boolean {
  return hand.status === "active";
}

export default function App() {
  const [gameState, setGameState] = useState(readInitialState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(gameState.chips));
  }, [gameState.chips]);

  const activeHand = gameState.playerHands[gameState.activeHandIndex];
  const availableChips = getAvailableChips(gameState);

  const handleChangeBet = (bet: number) => {
    setGameState((previous) => ({
      ...previous,
      currentBet: clampBet(Math.max(MIN_BET, Math.min(MAX_BET, Number.isNaN(bet) ? previous.currentBet : bet)), previous.chips),
    }));
  };

  const handleDeal = () => {
    setGameState((previous) => dealInitialCards(startNewRound(previous, previous.currentBet)));
  };

  const handleReset = () => {
    window.localStorage.setItem(STORAGE_KEY, String(1000));
    setGameState(resetGame());
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Single Player Table</p>
          <h1>Blackjack Switch</h1>
          <p className="hero-copy">2 ハンドを操り、Switch で形勢をひっくり返すブラックジャックです。</p>
        </div>
        <div className="score-strip">
          <div className="score-card">
            <span>Chips</span>
            <strong>{gameState.chips}</strong>
          </div>
          <div className="score-card">
            <span>Phase</span>
            <strong>{PHASE_LABELS[gameState.phase]}</strong>
          </div>
          <div className="score-card">
            <span>Available</span>
            <strong>{availableChips}</strong>
          </div>
        </div>
      </section>

      <section className="message-banner" aria-live="polite">
        {gameState.message}
      </section>

      <DealerView dealerHand={gameState.dealerHand} />

      <section className="player-grid">
        {gameState.playerHands.map((hand, index) => (
          <HandView key={hand.id} hand={hand} isActive={gameState.phase === "playerTurn" && index === gameState.activeHandIndex} />
        ))}
      </section>

      {gameState.phase === "betting" && (
        <BettingControls
          chips={gameState.chips}
          currentBet={gameState.currentBet}
          onChangeBet={handleChangeBet}
          onDeal={handleDeal}
        />
      )}

      {gameState.phase === "insurance" && (
        <section className="control-panel">
          <p className="helper-text">
            Insurance は {gameState.currentBet} チップです。ディーラーが BJ なら 2:1 で支払われます。
          </p>
          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              disabled={availableChips < gameState.currentBet}
              onClick={() => setGameState((previous) => takeInsurance(previous))}
            >
              Take Insurance
            </button>
            <button type="button" onClick={() => setGameState((previous) => declineInsurance(previous))}>
              No Insurance
            </button>
          </div>
        </section>
      )}

      {gameState.phase === "switch" && (
        <section className="control-panel">
          <p className="helper-text">2 つの手札の 2 枚目同士を 1 回だけ交換できます。</p>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => setGameState((previous) => switchCards(previous))}>
              Switch
            </button>
            <button type="button" onClick={() => setGameState((previous) => keepCards(previous))}>
              Keep
            </button>
          </div>
        </section>
      )}

      {gameState.phase === "playerTurn" && activeHand && (
        <section className="turn-panel">
          <p className="helper-text">{formatHandLabel(activeHand.id)} をプレイ中です。</p>
          <ActionControls
            canHit={canHitHand(activeHand)}
            canStand={canStandHand(activeHand)}
            canDouble={canDoubleDown(activeHand, availableChips)}
            canSplit={canSplit(activeHand, availableChips)}
            canSurrender={canSurrender(activeHand)}
            onHit={() => setGameState((previous) => hit(previous))}
            onStand={() => setGameState((previous) => stand(previous))}
            onDouble={() => setGameState((previous) => doubleDown(previous))}
            onSplit={() => setGameState((previous) => splitHand(previous))}
            onSurrender={() => setGameState((previous) => surrender(previous))}
          />
        </section>
      )}

      <ResultPanel results={gameState.roundResults} />

      {gameState.phase === "settlement" && (
        <section className="control-panel">
          <button type="button" className="primary-button" onClick={() => setGameState((previous) => startNextRound(previous))}>
            Next Round
          </button>
        </section>
      )}

      <section className="footer-actions">
        <button type="button" className="ghost-button" onClick={handleReset}>
          {gameState.phase === "gameOver" ? "Reset Game" : "Reset"}
        </button>
      </section>
    </main>
  );
}
