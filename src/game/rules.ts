import type { Card, PlayerHand } from "../types";
import { calculateHandValue } from "./hand";

function hasSameRank(cards: PlayerHand["cards"]): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank;
}

export function canDoubleDown(hand: PlayerHand, chips: number): boolean {
  return (
    hand.status === "active" &&
    !hand.hasActed &&
    hand.cards.length === 2 &&
    !hand.isNaturalBlackjack &&
    chips >= hand.bet
  );
}

export function canSplit(hand: PlayerHand, chips: number): boolean {
  return (
    hand.status === "active" &&
    !hand.hasActed &&
    !hand.isFromSplit &&
    hasSameRank(hand.cards) &&
    chips >= hand.bet
  );
}

export function canSurrender(hand: PlayerHand): boolean {
  return (
    hand.status === "active" &&
    !hand.hasActed &&
    hand.cards.length === 2 &&
    !hand.isFromSplit &&
    !hand.isSplitAces
  );
}

export function shouldDealerHit(dealerCards: Card[]): boolean {
  const { total } = calculateHandValue(dealerCards);
  return total < 17;
}
