import { describe, expect, it } from "vitest";
import { calculateHandValue, isNaturalBlackjack } from "./hand";
import type { Card } from "../types";

function card(rank: Card["rank"], suit: Card["suit"] = "spades"): Card {
  return { rank, suit };
}

describe("calculateHandValue", () => {
  it("treats ace as 11 when possible", () => {
    expect(calculateHandValue([card("A"), card("6")])).toEqual({ total: 17, isSoft: true });
  });

  it("downgrades aces to avoid busting", () => {
    expect(calculateHandValue([card("A"), card("9"), card("A")])).toEqual({ total: 21, isSoft: true });
  });

  it("handles hard totals over 21", () => {
    expect(calculateHandValue([card("K"), card("9"), card("5")])).toEqual({ total: 24, isSoft: false });
  });
});

describe("isNaturalBlackjack", () => {
  it("recognizes an untouched initial blackjack", () => {
    expect(isNaturalBlackjack([card("A"), card("K")], false, false)).toBe(true);
  });

  it("does not treat switched blackjack as natural", () => {
    expect(isNaturalBlackjack([card("A"), card("K")], false, true)).toBe(false);
  });

  it("does not treat split blackjack as natural", () => {
    expect(isNaturalBlackjack([card("A"), card("K")], true, false)).toBe(false);
  });
});
