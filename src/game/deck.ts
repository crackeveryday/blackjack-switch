import type { Card, GameState, Rank, Suit } from "../types";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function createDeck(numberOfDecks: number): Card[] {
  const deck: Card[] = [];

  for (let deckIndex = 0; deckIndex < numberOfDecks; deckIndex += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
  }

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];

    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

export function drawCard(state: GameState): { card: Card; state: GameState } {
  let nextDeck = state.deck;
  let nextDiscardPile = state.discardPile;

  if (nextDeck.length === 0) {
    nextDeck = shuffleDeck(nextDiscardPile);
    nextDiscardPile = [];
  }

  if (nextDeck.length === 0) {
    throw new Error("The shoe is empty.");
  }

  const [card, ...remainingDeck] = nextDeck;

  return {
    card,
    state: {
      ...state,
      deck: remainingDeck,
      discardPile: nextDiscardPile,
    },
  };
}
