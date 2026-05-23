import type { Card, Rank } from "../types";

const TEN_VALUE_RANKS: Rank[] = ["10", "J", "Q", "K"];

export function getCardValue(card: Card): number {
  if (card.rank === "A") {
    return 1;
  }

  if (TEN_VALUE_RANKS.includes(card.rank)) {
    return 10;
  }

  return Number(card.rank);
}

export function calculateHandValue(cards: Card[]): { total: number; isSoft: boolean } {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    total += getCardValue(card);
    if (card.rank === "A") {
      aces += 1;
    }
  }

  let isSoft = false;

  while (aces > 0 && total + 10 <= 21) {
    total += 10;
    aces -= 1;
    isSoft = true;
  }

  return { total, isSoft };
}

export function isBust(cards: Card[]): boolean {
  return calculateHandValue(cards).total > 21;
}

export function isNaturalBlackjack(
  cards: Card[],
  isFromSplit: boolean,
  wasSwitched: boolean,
): boolean {
  if (cards.length !== 2 || isFromSplit || wasSwitched) {
    return false;
  }

  const hasAce = cards.some((card) => card.rank === "A");
  const hasTenValue = cards.some((card) => TEN_VALUE_RANKS.includes(card.rank));

  return hasAce && hasTenValue && calculateHandValue(cards).total === 21;
}
