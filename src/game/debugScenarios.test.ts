import { describe, expect, it } from "vitest";
import { createDebugScenarioState } from "./debugScenarios";
import { getDisplayAvailableChips, hit, splitHand } from "./gameState";

describe("getDisplayAvailableChips", () => {
  it("returns chips during settlement", () => {
    const state = createDebugScenarioState("settlement-available");

    expect(state.chips).toBe(850);
    expect(getDisplayAvailableChips(state)).toBe(850);
  });

  it("returns committed-adjusted chips during insurance", () => {
    const state = createDebugScenarioState("insurance-blackjack");

    expect(getDisplayAvailableChips(state)).toBe(800);
  });
});

describe("createDebugScenarioState", () => {
  it("creates a split aces scenario that can be played from the UI", () => {
    const state = createDebugScenarioState("split-aces");

    expect(state.phase).toBe("playerTurn");
    expect(state.playerHands[0].cards.map((card) => card.rank)).toEqual(["A", "A"]);
    expect(state.playerHands[0].canSplit).toBe(true);
    expect(state.deck.slice(0, 2).map((card) => card.rank)).toEqual(["10", "9"]);
    expect(state.deck.length).toBeGreaterThan(2);
  });

  it("keeps enough cards to hit after splitting aces", () => {
    const state = createDebugScenarioState("split-aces");
    const splitState = splitHand(state);
    const hitState = hit(splitState);

    expect(splitState.phase).toBe("playerTurn");
    expect(splitState.activeHandIndex).toBe(1);
    expect(splitState.playerHands[0].cards.map((card) => card.rank)).toEqual(["A", "10"]);
    expect(splitState.playerHands[1].cards.map((card) => card.rank)).toEqual(["A", "9"]);
    expect(hitState.playerHands[1].cards.map((card) => card.rank)).toEqual(["A", "9", "2"]);
  });

  it("creates a game over scenario with reset-ready chips", () => {
    const state = createDebugScenarioState("game-over");

    expect(state.phase).toBe("gameOver");
    expect(state.chips).toBe(0);
    expect(getDisplayAvailableChips(state)).toBe(0);
  });
});
