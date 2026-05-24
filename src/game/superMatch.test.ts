import { describe, expect, it } from "vitest";
import type { Card, InitialHandSnapshot } from "../types";
import { createSuperMatchResult, createSuperMatchSummary, evaluateSuperMatch } from "./superMatch";

function card(rank: Card["rank"], suit: Card["suit"] = "spades"): Card {
  return { rank, suit };
}

function initialHands(first: Card[], second: Card[]): InitialHandSnapshot {
  return [first, second];
}

describe("evaluateSuperMatch", () => {
  it("prioritizes four of a kind", () => {
    const result = evaluateSuperMatch(initialHands(
      [card("8"), card("8", "hearts")],
      [card("8", "clubs"), card("8", "diamonds")],
    ));

    expect(result.outcome).toBe("four-of-a-kind");
    expect(result.multiplier).toBe(40);
  });

  it("recognizes two pair before one pair in same hand", () => {
    const result = evaluateSuperMatch(initialHands(
      [card("8"), card("8", "hearts")],
      [card("K"), card("K", "diamonds")],
    ));

    expect(result.outcome).toBe("two-pair");
    expect(result.multiplier).toBe(8);
  });

  it("recognizes three of a kind", () => {
    const result = evaluateSuperMatch(initialHands(
      [card("8"), card("8", "hearts")],
      [card("8", "clubs"), card("K")],
    ));

    expect(result.outcome).toBe("three-of-a-kind");
    expect(result.multiplier).toBe(5);
  });

  it("pays more for one pair in the same hand", () => {
    const result = evaluateSuperMatch(initialHands(
      [card("8"), card("8", "hearts")],
      [card("7"), card("K")],
    ));

    expect(result.outcome).toBe("one-pair-same-hand");
    expect(result.multiplier).toBe(3);
  });

  it("recognizes one pair across hands", () => {
    const result = evaluateSuperMatch(initialHands(
      [card("8"), card("7", "hearts")],
      [card("8", "clubs"), card("K")],
    ));

    expect(result.outcome).toBe("one-pair");
    expect(result.multiplier).toBe(1);
  });

  it("keeps ten-value ranks separate", () => {
    const result = evaluateSuperMatch(initialHands(
      [card("10"), card("J", "hearts")],
      [card("Q", "clubs"), card("K")],
    ));

    expect(result.outcome).toBe("no-match");
  });
});

describe("createSuperMatchSummary", () => {
  it("creates a winning summary with returned chips", () => {
    const summary = createSuperMatchSummary(20, initialHands(
      [card("8"), card("8", "hearts")],
      [card("7"), card("K")],
    ));

    expect(summary.placed).toBe(true);
    expect(summary.outcome).toBe("one-pair-same-hand");
    expect(summary.displayLabel).toBe("One Pair");
    expect(summary.multiplier).toBe(3);
    expect(summary.profit).toBe(60);
    expect(summary.returned).toBe(80);
  });

  it("creates a losing summary on no match", () => {
    const summary = createSuperMatchSummary(20, initialHands(
      [card("8"), card("7", "hearts")],
      [card("6"), card("K")],
    ));

    expect(summary.placed).toBe(true);
    expect(summary.outcome).toBe("no-match");
    expect(summary.profit).toBe(-20);
    expect(summary.returned).toBe(0);
  });

  it("returns a no-side-bet summary when no bet is placed", () => {
    const summary = createSuperMatchSummary(0, initialHands(
      [card("8"), card("8", "hearts")],
      [card("6"), card("K")],
    ));

    expect(summary.placed).toBe(false);
    expect(summary.outcome).toBe("no-side-bet");
    expect(summary.logMessage).toBeNull();
  });
});

describe("createSuperMatchResult", () => {
  it("creates a bankroll delta result from a winning summary", () => {
    const result = createSuperMatchResult(createSuperMatchSummary(20, initialHands(
      [card("8"), card("8", "hearts")],
      [card("7"), card("K")],
    )));

    expect(result?.handId).toBe("super-match");
    expect(result?.outcome).toBe("win");
    expect(result?.amount).toBe(60);
  });

  it("does not create a result when no side bet is placed", () => {
    const result = createSuperMatchResult(createSuperMatchSummary(0, initialHands(
      [card("8"), card("8", "hearts")],
      [card("7"), card("K")],
    )));

    expect(result).toBeNull();
  });
});
