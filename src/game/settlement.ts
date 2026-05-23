import type { DealerHand, GameState, PlayerHand, RoundResult } from "../types";
import { calculateHandValue, isNaturalBlackjack } from "./hand";

function createInsuranceResult(state: GameState): RoundResult | null {
  if (!state.insuranceTaken || state.insuranceBet <= 0) {
    return null;
  }

  const dealerNaturalBlackjack = isNaturalBlackjack(state.dealerHand.cards, false, false);

  if (dealerNaturalBlackjack) {
    return {
      handId: "insurance",
      outcome: "win",
      amount: state.insuranceBet * 2,
      reason: "ディーラーがナチュラルブラックジャックでした。",
    };
  }

  return {
    handId: "insurance",
    outcome: "lose",
    amount: -state.insuranceBet,
    reason: "ディーラーはナチュラルブラックジャックではありませんでした。",
  };
}

export function resolveHand(hand: PlayerHand, dealerHand: DealerHand): RoundResult {
  const playerTotal = calculateHandValue(hand.cards).total;
  const dealerTotal = calculateHandValue(dealerHand.cards).total;
  const dealerNaturalBlackjack = isNaturalBlackjack(dealerHand.cards, false, false);

  if (hand.status === "surrendered") {
    return {
      handId: hand.id,
      outcome: "surrender",
      amount: -hand.bet / 2,
      reason: "サレンダーで半額を失いました。",
    };
  }

  if (hand.status === "busted" || playerTotal > 21) {
    return {
      handId: hand.id,
      outcome: "lose",
      amount: -hand.bet,
      reason: "プレイヤーがバーストしました。",
    };
  }

  if (hand.isNaturalBlackjack && !dealerNaturalBlackjack) {
    return {
      handId: hand.id,
      outcome: "win",
      amount: hand.bet,
      reason: "ナチュラルブラックジャックです。",
    };
  }

  if (dealerNaturalBlackjack && !hand.isNaturalBlackjack) {
    return {
      handId: hand.id,
      outcome: "lose",
      amount: -hand.bet,
      reason: "ディーラーがナチュラルブラックジャックです。",
    };
  }

  if (dealerNaturalBlackjack && hand.isNaturalBlackjack) {
    return {
      handId: hand.id,
      outcome: "push",
      amount: 0,
      reason: "お互いにナチュラルブラックジャックでした。",
    };
  }

  if (dealerTotal === 22) {
    return {
      handId: hand.id,
      outcome: "push",
      amount: 0,
      reason: "ディーラー22ルールでプッシュです。",
    };
  }

  if (dealerTotal > 21) {
    return {
      handId: hand.id,
      outcome: "win",
      amount: hand.bet,
      reason: "ディーラーがバーストしました。",
    };
  }

  if (playerTotal > dealerTotal) {
    return {
      handId: hand.id,
      outcome: "win",
      amount: hand.bet,
      reason: `プレイヤー ${playerTotal} がディーラー ${dealerTotal} を上回りました。`,
    };
  }

  if (playerTotal < dealerTotal) {
    return {
      handId: hand.id,
      outcome: "lose",
      amount: -hand.bet,
      reason: `ディーラー ${dealerTotal} がプレイヤー ${playerTotal} を上回りました。`,
    };
  }

  return {
    handId: hand.id,
    outcome: "push",
    amount: 0,
    reason: `${playerTotal} の同点でプッシュです。`,
  };
}

export function settleRound(state: GameState): GameState {
  const handResults = state.playerHands.map((hand) => resolveHand(hand, state.dealerHand));
  const insuranceResult = createInsuranceResult(state);
  const roundResults = insuranceResult ? [...handResults, insuranceResult] : handResults;
  const amountDelta = roundResults.reduce((total, result) => total + result.amount, 0);
  const chips = state.chips + amountDelta;
  const phase = chips <= 0 ? "gameOver" : "settlement";

  return {
    ...state,
    phase,
    chips,
    roundResults,
    dealerHand: {
      ...state.dealerHand,
      holeCardRevealed: true,
    },
    message:
      phase === "gameOver"
        ? "チップがなくなりました。リセットしてください。"
        : `ラウンド精算: ${amountDelta >= 0 ? "+" : ""}${amountDelta}`,
  };
}
