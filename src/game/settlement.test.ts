import { describe, expect, it } from "vitest";
import type { Card, DealerHand, PlayerHand } from "../types";
import { playDealerTurn, createInitialGameState } from "./gameState";
import { resolveHand, settleRound } from "./settlement";

function card(rank: Card["rank"], suit: Card["suit"] = "spades"): Card {
  return { rank, suit };
}

function dealerHand(cards: Card[]): DealerHand {
  return {
    cards,
    holeCardRevealed: true,
  };
}

function playerHand(overrides: Partial<PlayerHand>): PlayerHand {
  return {
    id: "hand-1",
    cards: [card("10"), card("10", "hearts")],
    bet: 100,
    status: "standing",
    isNaturalBlackjack: false,
    isFromSplit: false,
    isSplitAces: false,
    hasActed: true,
    canSplit: false,
    ...overrides,
  };
}

describe("resolveHand", () => {
  it("pushes a live hand when dealer finishes on 22", () => {
    const result = resolveHand(
      playerHand({ cards: [card("10"), card("Q", "hearts")] }),
      dealerHand([card("10"), card("6", "clubs"), card("6", "diamonds")]),
    );

    expect(result.outcome).toBe("push");
    expect(result.amount).toBe(0);
  });

  it("keeps natural blackjack as a win against dealer 22", () => {
    const result = resolveHand(
      playerHand({
        cards: [card("A"), card("K", "hearts")],
        isNaturalBlackjack: true,
      }),
      dealerHand([card("10"), card("6", "clubs"), card("6", "diamonds")]),
    );

    expect(result.outcome).toBe("win");
    expect(result.amount).toBe(100);
  });
});

describe("settleRound", () => {
  it("applies insurance loss when dealer does not have blackjack", () => {
    const settled = settleRound({
      ...createInitialGameState(),
      chips: 1000,
      insuranceTaken: true,
      insuranceBet: 100,
      playerHands: [playerHand({ id: "hand-1" }), playerHand({ id: "hand-2", cards: [card("9"), card("9", "hearts")] })],
      dealerHand: dealerHand([card("10"), card("7", "clubs")]),
    });

    expect(settled.roundResults.find((result) => result.handId === "insurance")?.amount).toBe(-100);
  });
});

describe("playDealerTurn", () => {
  it("stands on soft 17", () => {
    const nextState = playDealerTurn({
      ...createInitialGameState(),
      phase: "dealerTurn",
      chips: 1000,
      deck: [card("5"), card("4", "clubs")],
      playerHands: [playerHand({ id: "hand-1" })],
      dealerHand: {
        cards: [card("A"), card("6", "hearts")],
        holeCardRevealed: false,
      },
    });

    expect(nextState.dealerHand.cards).toHaveLength(2);
  });

  it("hits on 16 or lower", () => {
    const nextState = playDealerTurn({
      ...createInitialGameState(),
      phase: "dealerTurn",
      chips: 1000,
      deck: [card("5"), card("4", "clubs")],
      playerHands: [playerHand({ id: "hand-1" })],
      dealerHand: {
        cards: [card("10"), card("6", "hearts")],
        holeCardRevealed: false,
      },
    });

    expect(nextState.dealerHand.cards).toHaveLength(3);
  });
});
