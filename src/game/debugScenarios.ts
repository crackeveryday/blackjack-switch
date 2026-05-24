import type { Card, GameState, PlayerHand, RoundResult } from "../types";
import { createInitialGameState } from "./gameState";

export type DebugScenarioId =
  | "settlement-available"
  | "insurance-blackjack"
  | "insurance-safe"
  | "dealer-22"
  | "split-aces"
  | "game-over";

export const DEBUG_SCENARIOS: Array<{ id: DebugScenarioId; label: string }> = [
  { id: "settlement-available", label: "Settlement Available" },
  { id: "insurance-blackjack", label: "Insurance BJ" },
  { id: "insurance-safe", label: "Insurance No BJ" },
  { id: "dealer-22", label: "Dealer 22" },
  { id: "split-aces", label: "Split Aces" },
  { id: "game-over", label: "Game Over" },
];

function card(rank: Card["rank"], suit: Card["suit"]): Card {
  return { rank, suit };
}

function hand(overrides: Partial<PlayerHand>): PlayerHand {
  return {
    id: "hand-1",
    cards: [card("10", "spades"), card("8", "hearts")],
    bet: 100,
    status: "active",
    isNaturalBlackjack: false,
    isFromSplit: false,
    isSplitAces: false,
    hasActed: false,
    canSplit: false,
    ...overrides,
  };
}

function baseState(chips = 1000): GameState {
  return {
    ...createInitialGameState(chips),
    deck: [],
    discardPile: [],
    insuranceBet: 0,
    insuranceTaken: false,
    roundResults: [],
    wasSwitched: false,
    needsShuffle: false,
  };
}

function settlementResult(handId: string, outcome: RoundResult["outcome"], amount: number, reason: string): RoundResult {
  return {
    handId,
    outcome,
    amount,
    reason,
  };
}

export function createDebugScenarioState(id: DebugScenarioId): GameState {
  switch (id) {
    case "settlement-available":
      return {
        ...baseState(850),
        phase: "settlement",
        playerHands: [
          hand({
            id: "hand-1",
            cards: [card("6", "clubs"), card("J", "diamonds")],
            status: "surrendered",
            hasActed: true,
          }),
          hand({
            id: "hand-2",
            cards: [card("6", "diamonds"), card("8", "diamonds")],
            status: "standing",
            hasActed: true,
          }),
        ],
        dealerHand: {
          cards: [card("2", "spades"), card("7", "diamonds"), card("Q", "clubs")],
          holeCardRevealed: true,
        },
        roundResults: [
          settlementResult("hand-1", "surrender", -50, "サレンダーで半額を失いました。"),
          settlementResult("hand-2", "lose", -100, "ディーラー 19 がプレイヤー 14 を上回りました。"),
        ],
        message: "ラウンド精算: -150",
        wasSwitched: true,
      };
    case "insurance-blackjack":
      return {
        ...baseState(1000),
        phase: "insurance",
        currentBet: 100,
        playerHands: [
          hand({
            id: "hand-1",
            cards: [card("10", "hearts"), card("9", "clubs")],
          }),
          hand({
            id: "hand-2",
            cards: [card("8", "spades"), card("8", "hearts")],
            canSplit: true,
          }),
        ],
        dealerHand: {
          cards: [card("A", "spades"), card("K", "clubs")],
          holeCardRevealed: false,
        },
        message: "ディーラーが A を見せています。Insurance を選んでください。",
      };
    case "insurance-safe":
      return {
        ...baseState(1000),
        phase: "insurance",
        currentBet: 100,
        playerHands: [
          hand({
            id: "hand-1",
            cards: [card("10", "hearts"), card("9", "clubs")],
          }),
          hand({
            id: "hand-2",
            cards: [card("8", "spades"), card("8", "hearts")],
            canSplit: true,
          }),
        ],
        dealerHand: {
          cards: [card("A", "spades"), card("9", "clubs")],
          holeCardRevealed: false,
        },
        message: "ディーラーが A を見せています。Insurance を選んでください。",
      };
    case "dealer-22":
      return {
        ...baseState(1100),
        phase: "settlement",
        playerHands: [
          hand({
            id: "hand-1",
            cards: [card("10", "spades"), card("Q", "hearts")],
            status: "standing",
            hasActed: true,
          }),
          hand({
            id: "hand-2",
            cards: [card("A", "diamonds"), card("K", "diamonds")],
            status: "standing",
            hasActed: true,
            isNaturalBlackjack: true,
          }),
        ],
        dealerHand: {
          cards: [card("10", "clubs"), card("6", "clubs"), card("6", "diamonds")],
          holeCardRevealed: true,
        },
        roundResults: [
          settlementResult("hand-1", "push", 0, "ディーラー22ルールでプッシュです。"),
          settlementResult("hand-2", "win", 100, "ナチュラルブラックジャックです。"),
        ],
        message: "ラウンド精算: +100",
      };
    case "split-aces":
      return {
        ...baseState(1000),
        phase: "playerTurn",
        deck: [
          card("10", "clubs"),
          card("9", "diamonds"),
          card("2", "clubs"),
          card("3", "hearts"),
          card("4", "diamonds"),
          card("5", "spades"),
        ],
        activeHandIndex: 0,
        playerHands: [
          hand({
            id: "hand-1",
            cards: [card("A", "spades"), card("A", "hearts")],
            canSplit: true,
          }),
          hand({
            id: "hand-2",
            cards: [card("9", "clubs"), card("7", "spades")],
            canSplit: false,
          }),
        ],
        dealerHand: {
          cards: [card("5", "hearts"), card("10", "spades")],
          holeCardRevealed: false,
        },
        message: "Hand 1 をプレイ中です。",
      };
    case "game-over":
      return {
        ...baseState(0),
        phase: "gameOver",
        playerHands: [
          hand({
            id: "hand-1",
            cards: [card("10", "spades"), card("9", "hearts"), card("5", "clubs")],
            status: "busted",
            hasActed: true,
          }),
          hand({
            id: "hand-2",
            cards: [card("7", "diamonds"), card("8", "clubs"), card("9", "spades")],
            status: "busted",
            hasActed: true,
          }),
        ],
        dealerHand: {
          cards: [card("10", "clubs"), card("7", "clubs")],
          holeCardRevealed: true,
        },
        roundResults: [
          settlementResult("hand-1", "lose", -100, "プレイヤーがバーストしました。"),
          settlementResult("hand-2", "lose", -100, "プレイヤーがバーストしました。"),
        ],
        message: "チップがなくなりました。リセットしてください。",
      };
  }
}
