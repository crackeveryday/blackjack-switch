import type { Card } from "../types";

type CardViewProps = {
  card?: Card;
  hidden?: boolean;
};

const SUIT_LABEL: Record<Card["suit"], string> = {
  hearts: "H",
  diamonds: "D",
  clubs: "C",
  spades: "S",
};

export default function CardView({ card, hidden = false }: CardViewProps) {
  if (hidden) {
    return (
      <div className="card card-hidden" aria-label="hidden card">
        <span className="card-back-pattern" />
      </div>
    );
  }

  if (!card) {
    return <div className="card card-empty" aria-hidden="true" />;
  }

  const isRed = card.suit === "hearts" || card.suit === "diamonds";

  return (
    <div className={`card ${isRed ? "card-red" : "card-black"}`}>
      <span className="card-rank">{card.rank}</span>
      <span className="card-suit">{SUIT_LABEL[card.suit]}</span>
    </div>
  );
}
