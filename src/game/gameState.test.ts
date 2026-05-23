import { describe, expect, it } from "vitest";
import type { Card, GameState, PlayerHand } from "../types";
import {
  createInitialGameState,
  doubleDown,
  keepCards,
  splitHand,
  switchCards,
  takeInsurance,
} from "./gameState";

function card(rank: Card["rank"], suit: Card["suit"] = "spades"): Card {
  return { rank, suit };
}

function hand(overrides: Partial<PlayerHand>): PlayerHand {
  return {
    id: "hand-1",
    cards: [card("8"), card("8", "hearts")],
    bet: 100,
    status: "active",
    isNaturalBlackjack: false,
    isFromSplit: false,
    isSplitAces: false,
    hasActed: false,
    canSplit: true,
    ...overrides,
  };
}

function basePlayerTurnState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialGameState(),
    phase: "playerTurn",
    deck: [card("5"), card("K", "hearts"), card("3", "clubs")],
    playerHands: [
      hand({ id: "hand-1", cards: [card("9"), card("2")] }),
      hand({ id: "hand-2", cards: [card("7"), card("9")], canSplit: false }),
    ],
    dealerHand: {
      cards: [card("10"), card("7", "hearts")],
      holeCardRevealed: false,
    },
    activeHandIndex: 0,
    currentBet: 100,
    chips: 1000,
    ...overrides,
  };
}

describe("switchCards", () => {
  it("swaps only the second card of each starting hand and marks the round as switched", () => {
    const state: GameState = {
      ...createInitialGameState(),
      phase: "switch",
      playerHands: [
        hand({ id: "hand-1", cards: [card("A"), card("8")] }),
        hand({ id: "hand-2", cards: [card("10"), card("6", "hearts")] }),
      ],
      dealerHand: {
        cards: [card("9"), card("5", "clubs")],
        holeCardRevealed: false,
      },
    };

    const nextState = switchCards(state);

    expect(nextState.wasSwitched).toBe(true);
    expect(nextState.playerHands[0].cards).toEqual([card("A"), card("6", "hearts")]);
    expect(nextState.playerHands[1].cards).toEqual([card("10"), card("8")]);
  });
});

describe("takeInsurance", () => {
  it("books the insurance bet and settles immediately on dealer blackjack", () => {
    const state: GameState = {
      ...createInitialGameState(),
      phase: "insurance",
      currentBet: 100,
      playerHands: [
        hand({ id: "hand-1", cards: [card("10"), card("9")] }),
        hand({ id: "hand-2", cards: [card("8"), card("8", "hearts")] }),
      ],
      dealerHand: {
        cards: [card("A"), card("K", "clubs")],
        holeCardRevealed: false,
      },
    };

    const nextState = takeInsurance(state);

    expect(nextState.insuranceTaken).toBe(true);
    expect(nextState.insuranceBet).toBe(100);
    expect(nextState.roundResults.find((result) => result.handId === "insurance")?.amount).toBe(200);
  });
});

describe("doubleDown", () => {
  it("doubles the hand bet, draws one card, and ends the hand", () => {
    const nextState = doubleDown(basePlayerTurnState());

    expect(nextState.playerHands[0].bet).toBe(200);
    expect(nextState.playerHands[0].cards).toHaveLength(3);
    expect(nextState.playerHands[0].status).toBe("doubled");
  });
});

describe("splitHand", () => {
  it("creates two hands in place and deals one extra card to each", () => {
    const state = basePlayerTurnState({
      deck: [card("3"), card("4", "hearts"), card("9", "clubs")],
      playerHands: [
        hand({ id: "hand-1", cards: [card("8"), card("8", "hearts")] }),
        hand({ id: "hand-2", cards: [card("10"), card("7")], canSplit: false }),
      ],
    });

    const nextState = splitHand(state);

    expect(nextState.playerHands.map((currentHand) => currentHand.id)).toEqual([
      "hand-1a",
      "hand-1b",
      "hand-2",
    ]);
    expect(nextState.playerHands[0].cards).toEqual([card("8"), card("3")]);
    expect(nextState.playerHands[1].cards).toEqual([card("8", "hearts"), card("4", "hearts")]);
  });
});

describe("keepCards", () => {
  it("skips switched behavior and preserves an untouched natural blackjack", () => {
    const state: GameState = {
      ...createInitialGameState(),
      phase: "switch",
      playerHands: [
        hand({ id: "hand-1", cards: [card("A"), card("K")], canSplit: false, isNaturalBlackjack: true }),
        hand({ id: "hand-2", cards: [card("9"), card("7")], canSplit: false }),
      ],
      dealerHand: {
        cards: [card("8"), card("5", "clubs")],
        holeCardRevealed: false,
      },
    };

    const nextState = keepCards(state);

    expect(nextState.playerHands[0].isNaturalBlackjack).toBe(true);
    expect(nextState.playerHands[0].status).toBe("standing");
  });
});
