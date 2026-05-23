import type { DealerHand } from "../types";
import { calculateHandValue } from "../game/hand";
import CardView from "./CardView";

type DealerViewProps = {
  dealerHand: DealerHand;
};

export default function DealerView({ dealerHand }: DealerViewProps) {
  const visibleCards = dealerHand.holeCardRevealed ? dealerHand.cards : dealerHand.cards.slice(0, 1);
  const { total } = calculateHandValue(visibleCards);

  return (
    <section className="dealer-panel">
      <div className="hand-header">
        <div>
          <h2>Dealer</h2>
          <p className="hand-meta">{dealerHand.holeCardRevealed ? "Open Hand" : "Hole Card Hidden"}</p>
        </div>
        <span className="dealer-total">Total {total}</span>
      </div>
      <div className="card-row">
        {dealerHand.cards.map((card, index) => (
          <CardView
            key={`dealer-${index}-${card.rank}-${card.suit}`}
            card={card}
            hidden={index === 1 && !dealerHand.holeCardRevealed}
          />
        ))}
      </div>
    </section>
  );
}
