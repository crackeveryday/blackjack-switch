import { useEffect, useState } from "react";
import ActionControls from "./components/ActionControls";
import BettingControls from "./components/BettingControls";
import DealerView from "./components/DealerView";
import HandView from "./components/HandView";
import ResultPanel from "./components/ResultPanel";
import { DEBUG_SCENARIOS, createDebugScenarioState, type DebugScenarioId } from "./game/debugScenarios";
import {
  clampBet,
  clampOptionalBet,
  canRepeatBet,
  canUndoRoundAction,
  createInitialGameState,
  dealNewRound,
  declineInsurance,
  formatHandLabel,
  getAvailableChips,
  getDisplayAvailableChips,
  hit,
  keepCards,
  MAX_BET,
  MIN_BET,
  resetGame,
  startNextRound,
  startNextRoundWithSameBet,
  stand,
  switchCards,
  takeInsurance,
  doubleDown,
  splitHand,
  surrender,
  undoLastAction,
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
  return hand.status === "active" && calculateHandValue(hand.cards).total < 21;
}

function canStandHand(hand: PlayerHand): boolean {
  return hand.status === "active";
}

export default function App() {
  const [gameState, setGameState] = useState(readInitialState);
  const [debugScenarioId, setDebugScenarioId] = useState<DebugScenarioId>("settlement-available");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(gameState.chips));
  }, [gameState.chips]);

  const activeHand = gameState.playerHands[gameState.activeHandIndex];
  const availableChips = getAvailableChips(gameState);
  const displayAvailableChips = getDisplayAvailableChips(gameState);
  const canUndo = canUndoRoundAction(gameState);

  const handleChangeBet = (bet: number) => {
    setGameState((previous) => ({
      ...previous,
      currentBet: clampBet(
        Math.max(MIN_BET, Math.min(MAX_BET, Number.isNaN(bet) ? previous.currentBet : bet)),
        Math.max(0, previous.chips - previous.currentSuperMatchBet),
      ),
    }));
  };

  const handleChangeSuperMatchBet = (bet: number) => {
    setGameState((previous) => ({
      ...previous,
      currentSuperMatchBet: clampOptionalBet(
        Math.max(0, Math.min(MAX_BET, Number.isNaN(bet) ? previous.currentSuperMatchBet : bet)),
        Math.max(0, previous.chips - previous.currentBet * 2),
      ),
    }));
  };

  const handleDeal = () => {
    setGameState((previous) => dealNewRound(previous, previous.currentBet, previous.currentSuperMatchBet));
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
            <strong>{displayAvailableChips}</strong>
          </div>
        </div>
      </section>

      <section className="message-banner" aria-live="polite">
        {gameState.message}
      </section>

      {canUndo && (
        <section className="round-action-bar">
          <button type="button" className="ghost-button" onClick={() => setGameState((previous) => undoLastAction(previous))}>
            Undo
          </button>
        </section>
      )}

      {import.meta.env.DEV && (
        <section className="control-panel debug-panel">
          <p className="helper-text">開発用シナリオを読み込んで、再現しづらいケースをブラウザ確認できます。</p>
          <div className="debug-row">
            <label htmlFor="debug-scenario">Debug Scenario</label>
            <select
              id="debug-scenario"
              value={debugScenarioId}
              onChange={(event) => setDebugScenarioId(event.target.value as DebugScenarioId)}
            >
              {DEBUG_SCENARIOS.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setGameState(createDebugScenarioState(debugScenarioId))}>
              Load Scenario
            </button>
          </div>
        </section>
      )}

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
          currentSuperMatchBet={gameState.currentSuperMatchBet}
          onChangeBet={handleChangeBet}
          onChangeSuperMatchBet={handleChangeSuperMatchBet}
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

      <ResultPanel results={gameState.roundResults} superMatchSummary={gameState.superMatchSummary} />

      {gameState.phase === "settlement" && (
        <section className="control-panel">
          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              disabled={!canRepeatBet(gameState)}
              onClick={() => setGameState((previous) => startNextRoundWithSameBet(previous))}
            >
              Same Bet & Deal
            </button>
            <button type="button" onClick={() => setGameState((previous) => startNextRound(previous))}>
              Next Round
            </button>
          </div>
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
