import { describe, expect, it } from "vitest";
import type { Card, GameState, PlayerHand } from "../types";
import {
  canRepeatBet,
  canUndoRoundAction,
  createInitialGameState,
  dealNewRound,
  getAvailableChips,
  doubleDown,
  hit,
  keepCards,
  splitHand,
  stand,
  startNextRound,
  startNextRoundWithSameBet,
  switchCards,
  takeInsurance,
  undoLastAction,
} from "./gameState";
import { canDoubleDown, canSurrender } from "./rules";

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

describe("dealNewRound", () => {
  it("starts a round normally when no Super Match bet is placed", () => {
    const state = {
      ...createInitialGameState(),
      deck: [
        card("8"),
        card("7", "hearts"),
        card("2", "clubs"),
        card("K", "diamonds"),
        card("8", "clubs"),
        card("5", "hearts"),
      ],
      currentSuperMatchBet: 0,
    };

    const nextState = dealNewRound(state, 100, 0);

    expect(nextState.phase).toBe("switch");
    expect(nextState.superMatchBet).toBe(0);
    expect(nextState.superMatchSummary).toBeNull();
  });

  it("stores the original four player cards for Super Match before switch", () => {
    const state = {
      ...createInitialGameState(),
      deck: [
        card("8"),
        card("7", "hearts"),
        card("2", "clubs"),
        card("K", "diamonds"),
        card("8", "clubs"),
        card("5", "hearts"),
      ],
      currentSuperMatchBet: 20,
    };

    const nextState = dealNewRound(state, 100, 20);
    const switchedState = switchCards(nextState);

    expect(nextState.superMatchBet).toBe(20);
    expect(nextState.superMatchInitialHands).toEqual([
      [card("8"), card("K", "diamonds")],
      [card("7", "hearts"), card("8", "clubs")],
    ]);
    expect(switchedState.playerHands[0].cards).toEqual([card("8"), card("8", "clubs")]);
    expect(switchedState.superMatchInitialHands).toEqual(nextState.superMatchInitialHands);
  });

  it("rejects a round when chips cannot cover hand bets and Super Match", () => {
    const state = {
      ...createInitialGameState(210),
      currentBet: 100,
      currentSuperMatchBet: 20,
    };

    const nextState = dealNewRound(state, 100, 20);

    expect(nextState.phase).toBe("betting");
    expect(nextState.playerHands).toEqual([]);
    expect(nextState.message).toContain("Super Match");
  });
});

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

describe("undoLastAction", () => {
  it("restores cards, deck, and active hand after hit", () => {
    const state = basePlayerTurnState({
      deck: [card("5"), card("K", "hearts"), card("3", "clubs")],
    });

    const nextState = hit(state);
    const undoneState = undoLastAction(nextState);

    expect(nextState.playerHands[0].cards).toEqual([card("9"), card("2"), card("5")]);
    expect(nextState.deck).toEqual([card("K", "hearts"), card("3", "clubs")]);
    expect(undoneState.playerHands).toEqual(state.playerHands);
    expect(undoneState.deck).toEqual(state.deck);
    expect(undoneState.activeHandIndex).toBe(0);
    expect(undoneState.phase).toBe("playerTurn");
    expect(undoneState.undoStack).toEqual([]);
  });

  it("restores an active hand after stand", () => {
    const state = basePlayerTurnState();
    const nextState = stand(state);
    const undoneState = undoLastAction(nextState);

    expect(nextState.activeHandIndex).toBe(1);
    expect(undoneState.playerHands[0].status).toBe("active");
    expect(undoneState.activeHandIndex).toBe(0);
  });

  it("restores the original hand after split", () => {
    const state = basePlayerTurnState({
      deck: [card("3"), card("4", "hearts"), card("9", "clubs")],
      playerHands: [
        hand({ id: "hand-1", cards: [card("8"), card("8", "hearts")] }),
        hand({ id: "hand-2", cards: [card("10"), card("7")], canSplit: false }),
      ],
    });

    const nextState = splitHand(state);
    const undoneState = undoLastAction(nextState);

    expect(nextState.playerHands.map((currentHand) => currentHand.id)).toEqual([
      "hand-1a",
      "hand-1b",
      "hand-2",
    ]);
    expect(undoneState.playerHands.map((currentHand) => currentHand.id)).toEqual(["hand-1", "hand-2"]);
    expect(undoneState.deck).toEqual(state.deck);
  });

  it("clears undo once the dealer turn starts and settlement is reached", () => {
    const state = basePlayerTurnState({
      playerHands: [hand({ id: "hand-1", cards: [card("10"), card("7")], canSplit: false })],
      dealerHand: {
        cards: [card("10"), card("7", "hearts")],
        holeCardRevealed: false,
      },
    });

    const nextState = stand(state);

    expect(nextState.phase).toBe("settlement");
    expect(canUndoRoundAction(nextState)).toBe(false);
    expect(nextState.undoStack).toEqual([]);
  });

  it("does not carry undo history into the next round", () => {
    const settledState = {
      ...basePlayerTurnState(),
      phase: "settlement" as const,
      playerHands: [
        hand({ id: "hand-1", cards: [card("10"), card("7")], status: "standing", canSplit: false }),
        hand({ id: "hand-2", cards: [card("9"), card("8")], status: "standing", canSplit: false }),
      ],
      dealerHand: {
        cards: [card("10"), card("6"), card("2")],
        holeCardRevealed: true,
      },
      roundResults: [],
      undoStack: [createInitialGameState()],
    };

    const nextState = startNextRound(settledState);

    expect(nextState.phase).toBe("betting");
    expect(nextState.undoStack).toEqual([]);
    expect(canUndoRoundAction(nextState)).toBe(false);
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

  it("continues with the other split hand when one split hand reaches 21", () => {
    const state = basePlayerTurnState({
      deck: [card("A"), card("5", "hearts"), card("9", "clubs")],
      playerHands: [hand({ id: "hand-1", cards: [card("10"), card("10", "hearts")] })],
      dealerHand: {
        cards: [card("10", "clubs"), card("7", "hearts")],
        holeCardRevealed: false,
      },
    });

    const nextState = splitHand(state);

    expect(nextState.phase).toBe("playerTurn");
    expect(nextState.activeHandIndex).toBe(1);
    expect(nextState.playerHands[0].cards).toEqual([card("10"), card("A")]);
    expect(nextState.playerHands[0].status).toBe("standing");
    expect(nextState.playerHands[0].isNaturalBlackjack).toBe(false);
    expect(nextState.playerHands[1].status).toBe("active");
  });

  it("keeps the second split ace hand active when the first split ace hand makes 21", () => {
    const state = basePlayerTurnState({
      deck: [card("10"), card("9", "hearts"), card("8", "clubs")],
      playerHands: [hand({ id: "hand-1", cards: [card("A"), card("A", "hearts")] })],
      dealerHand: {
        cards: [card("6", "clubs"), card("10", "hearts")],
        holeCardRevealed: false,
      },
    });

    const nextState = splitHand(state);

    expect(nextState.phase).toBe("playerTurn");
    expect(nextState.activeHandIndex).toBe(1);
    expect(nextState.playerHands[0].cards).toEqual([card("A"), card("10")]);
    expect(nextState.playerHands[0].status).toBe("standing");
    expect(nextState.playerHands[0].isNaturalBlackjack).toBe(false);
    expect(nextState.playerHands[1].cards).toEqual([card("A", "hearts"), card("9", "hearts")]);
    expect(nextState.playerHands[1].status).toBe("active");
  });

  it("allows hit and double down on the remaining split ace hand", () => {
    const state = basePlayerTurnState({
      deck: [card("10"), card("9", "hearts"), card("2", "clubs")],
      playerHands: [hand({ id: "hand-1", cards: [card("A"), card("A", "hearts")] })],
      dealerHand: {
        cards: [card("10", "clubs"), card("7", "hearts")],
        holeCardRevealed: false,
      },
    });

    const splitState = splitHand(state);
    const activeHand = splitState.playerHands[splitState.activeHandIndex];
    const hitState = hit(splitState);
    const doubleState = doubleDown({
      ...splitState,
      deck: [card("2", "clubs")],
    });

    expect(activeHand.isSplitAces).toBe(true);
    expect(canDoubleDown(activeHand, 700)).toBe(true);
    expect(canSurrender(activeHand)).toBe(false);
    expect(hitState.playerHands[1].cards).toEqual([card("A", "hearts"), card("9", "hearts"), card("2", "clubs")]);
    expect(hitState.playerHands[1].status).toBe("active");
    expect(doubleState.playerHands[1].cards).toEqual([card("A", "hearts"), card("9", "hearts"), card("2", "clubs")]);
    expect(doubleState.playerHands[1].bet).toBe(200);
    expect(doubleState.playerHands[1].status).toBe("doubled");
  });

  it("waits until every split hand is complete before settling", () => {
    const state = basePlayerTurnState({
      deck: [card("A"), card("5", "hearts"), card("9", "clubs")],
      playerHands: [hand({ id: "hand-1", cards: [card("10"), card("10", "hearts")] })],
      dealerHand: {
        cards: [card("10", "clubs"), card("7", "hearts")],
        holeCardRevealed: false,
      },
    });

    const splitState = splitHand(state);
    const settledState = stand(splitState);

    expect(settledState.phase).toBe("settlement");
    expect(settledState.playerHands.every((currentHand) => currentHand.status !== "active")).toBe(true);
  });
});

describe("startNextRoundWithSameBet", () => {
  it("starts a new round with the previous initial bet", () => {
    const state = {
      ...basePlayerTurnState({
        phase: "settlement",
        deck: [card("2"), card("3"), card("4"), card("5"), card("6"), card("7")],
        chips: 1200,
        currentBet: 100,
        currentSuperMatchBet: 20,
        superMatchBet: 20,
        insuranceBet: 100,
        insuranceTaken: true,
        playerHands: [
          hand({ id: "hand-1", cards: [card("8"), card("8", "hearts")], bet: 200, status: "doubled" }),
          hand({ id: "hand-2", cards: [card("10"), card("7")], bet: 100, status: "standing", canSplit: false }),
        ],
        dealerHand: {
          cards: [card("9"), card("7", "hearts")],
          holeCardRevealed: true,
        },
      }),
      roundResults: [],
    };

    const nextState = startNextRoundWithSameBet(state);

    expect(canRepeatBet(state)).toBe(true);
    expect(nextState.phase).toBe("switch");
    expect(nextState.currentBet).toBe(100);
    expect(nextState.currentSuperMatchBet).toBe(20);
    expect(nextState.superMatchBet).toBe(20);
    expect(nextState.playerHands).toHaveLength(2);
    expect(nextState.playerHands.every((currentHand) => currentHand.bet === 100)).toBe(true);
    expect(nextState.insuranceBet).toBe(0);
  });

  it("keeps the user in settlement when chips cannot cover the same bet", () => {
    const state = {
      ...basePlayerTurnState({
        phase: "settlement",
        chips: 210,
        currentBet: 100,
        currentSuperMatchBet: 20,
      }),
      roundResults: [],
    };

    const nextState = startNextRoundWithSameBet(state);

    expect(canRepeatBet(state)).toBe(false);
    expect(nextState.phase).toBe("settlement");
    expect(nextState.message).toBe("前回の通常ベットと Super Match ベットを続けるためのチップが足りません。");
    expect(nextState.undoStack).toEqual([]);
  });

  it("only allows undoing to the new betting state after repeating a bet", () => {
    const state = {
      ...basePlayerTurnState({
        phase: "settlement",
        deck: [card("2"), card("3"), card("4"), card("5"), card("6"), card("7")],
        chips: 1200,
        currentBet: 100,
        playerHands: [
          hand({ id: "hand-1", cards: [card("10"), card("7")], status: "standing", canSplit: false }),
          hand({ id: "hand-2", cards: [card("9"), card("8")], status: "standing", canSplit: false }),
        ],
        dealerHand: {
          cards: [card("10"), card("6"), card("2")],
          holeCardRevealed: true,
        },
      }),
      roundResults: [],
    };

    const nextState = startNextRoundWithSameBet(state);
    const undoneState = undoLastAction(nextState);

    expect(nextState.phase).toBe("switch");
    expect(undoneState.phase).toBe("betting");
    expect(undoneState.roundResults).toEqual([]);
    expect(undoneState.playerHands).toEqual([]);
  });

  it("keeps the normal next-round betting flow available", () => {
    const state = {
      ...basePlayerTurnState({
        phase: "settlement",
        chips: 1200,
        currentBet: 100,
      }),
      roundResults: [],
    };

    const nextState = startNextRound(state);
    const dealtState = dealNewRound({ ...nextState, currentBet: 150 }, 150);

    expect(nextState.phase).toBe("betting");
    expect(dealtState.currentBet).toBe(150);
    expect(dealtState.playerHands.every((currentHand) => currentHand.bet === 150)).toBe(true);
  });

  it("includes Super Match in available chips during a round", () => {
    const state = {
      ...basePlayerTurnState({
        superMatchBet: 30,
      }),
    };

    expect(getAvailableChips(state)).toBe(770);
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
