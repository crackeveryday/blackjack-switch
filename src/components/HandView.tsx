import type { PlayerHand } from "../types";
import { calculateHandValue } from "../game/hand";
import { formatHandLabel } from "../game/gameState";
import CardView from "./CardView";

type HandViewProps = {
  hand: PlayerHand;
  isActive: boolean;
};

function getStatusText(hand: PlayerHand): string {
  if (hand.isNaturalBlackjack) {
    return "Natural BJ";
  }

  switch (hand.status) {
    case "busted":
      return "Busted";
    case "standing":
      return "Standing";
    case "surrendered":
      return "Surrendered";
    case "doubled":
      return "Doubled";
    default:
      return hand.hasActed ? "Playing" : "Ready";
  }
}

export default function HandView({ hand, isActive }: HandViewProps) {
  const { total } = calculateHandValue(hand.cards);

  return (
    <section className={`hand-panel ${isActive ? "hand-panel-active" : ""}`}>
      <div className="hand-header">
        <div>
          <h3>{formatHandLabel(hand.id)}</h3>
          <p className="hand-meta">Bet {hand.bet}</p>
        </div>
        <span className={`hand-status hand-status-${hand.status}`}>{getStatusText(hand)}</span>
      </div>
      <div className="card-row">
        {hand.cards.map((card, index) => (
          <CardView key={`${hand.id}-${index}-${card.rank}-${card.suit}`} card={card} />
        ))}
      </div>
      <div className="hand-summary">
        <span>Total {total}</span>
        {hand.isFromSplit && <span>Split Hand</span>}
        {hand.isSplitAces && <span>Split Aces</span>}
      </div>
    </section>
  );
}
