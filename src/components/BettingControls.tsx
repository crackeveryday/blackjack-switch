import { BET_STEP, MAX_BET, MIN_BET } from "../game/gameState";

type BettingControlsProps = {
  chips: number;
  currentBet: number;
  currentSuperMatchBet: number;
  onChangeBet: (bet: number) => void;
  onChangeSuperMatchBet: (bet: number) => void;
  onDeal: () => void;
};

export default function BettingControls({
  chips,
  currentBet,
  currentSuperMatchBet,
  onChangeBet,
  onChangeSuperMatchBet,
  onDeal,
}: BettingControlsProps) {
  const maxBet = Math.min(MAX_BET, Math.floor((chips - currentSuperMatchBet) / 2 / BET_STEP) * BET_STEP);
  const maxSuperMatchBet = Math.min(MAX_BET, Math.floor((chips - currentBet * 2) / BET_STEP) * BET_STEP);
  const canDeal = chips >= currentBet * 2 + currentSuperMatchBet;
  const totalCommitted = currentBet * 2 + currentSuperMatchBet;

  return (
    <section className="control-panel">
      <div className="bet-grid">
        <div className="bet-input-group">
          <label htmlFor="bet-input">Bet Per Hand</label>
          <input
            id="bet-input"
            type="number"
            min={MIN_BET}
            max={MAX_BET}
            step={BET_STEP}
            value={currentBet}
            onChange={(event) => onChangeBet(Number(event.target.value))}
          />
        </div>
        <div className="bet-input-group">
          <label htmlFor="super-match-bet-input">Super Match</label>
          <input
            id="super-match-bet-input"
            type="number"
            min={0}
            max={MAX_BET}
            step={BET_STEP}
            value={currentSuperMatchBet}
            onChange={(event) => onChangeSuperMatchBet(Number(event.target.value))}
          />
          <span className="helper-text">
            {currentSuperMatchBet === 0 ? "No Side Bet" : `Side Bet ${currentSuperMatchBet}`}
          </span>
        </div>
      </div>
      <p className="helper-text">Total committed on deal: {totalCommitted}</p>
      <div className="button-row">
        <button type="button" onClick={() => onChangeBet(currentBet - BET_STEP)}>
          -10
        </button>
        <button type="button" onClick={() => onChangeBet(currentBet + 10)}>
          +10
        </button>
        <button type="button" onClick={() => onChangeBet(currentBet + 50)}>
          +50
        </button>
        <button type="button" onClick={() => onChangeBet(currentBet + 100)}>
          +100
        </button>
        <button type="button" onClick={() => onChangeBet(maxBet)}>
          Max
        </button>
      </div>
      <div className="button-row">
        <button type="button" onClick={() => onChangeSuperMatchBet(0)}>
          Super Match Off
        </button>
        <button type="button" onClick={() => onChangeSuperMatchBet(currentSuperMatchBet + BET_STEP)}>
          Super Match +10
        </button>
        <button type="button" onClick={() => onChangeSuperMatchBet(maxSuperMatchBet)}>
          Super Match Max
        </button>
      </div>
      <button type="button" className="primary-button" disabled={!canDeal} onClick={onDeal}>
        Deal
      </button>
    </section>
  );
}
