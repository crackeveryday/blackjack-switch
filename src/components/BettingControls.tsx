import { BET_STEP, MAX_BET, MIN_BET } from "../game/gameState";

type BettingControlsProps = {
  chips: number;
  currentBet: number;
  onChangeBet: (bet: number) => void;
  onDeal: () => void;
};

export default function BettingControls({
  chips,
  currentBet,
  onChangeBet,
  onDeal,
}: BettingControlsProps) {
  const maxBet = Math.min(MAX_BET, Math.floor(chips / 2 / BET_STEP) * BET_STEP);

  return (
    <section className="control-panel">
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
      <button type="button" className="primary-button" disabled={chips < currentBet * 2} onClick={onDeal}>
        Deal
      </button>
    </section>
  );
}
