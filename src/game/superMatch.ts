import type { Card, InitialHandSnapshot, RoundResult, SuperMatchOutcome, SuperMatchSummary } from "../types";

type SuperMatchPayout = {
  outcome: SuperMatchOutcome;
  label: string;
  displayLabel: string;
  multiplier: number;
};

const PAYOUTS: Record<SuperMatchOutcome, SuperMatchPayout> = {
  "four-of-a-kind": {
    outcome: "four-of-a-kind",
    label: "Four of a Kind",
    displayLabel: "Four of a Kind",
    multiplier: 40,
  },
  "two-pair": {
    outcome: "two-pair",
    label: "Two Pair",
    displayLabel: "Two Pair",
    multiplier: 8,
  },
  "three-of-a-kind": {
    outcome: "three-of-a-kind",
    label: "Three of a Kind",
    displayLabel: "Three of a Kind",
    multiplier: 5,
  },
  "one-pair-same-hand": {
    outcome: "one-pair-same-hand",
    label: "One Pair in same hand",
    displayLabel: "One Pair",
    multiplier: 3,
  },
  "one-pair": {
    outcome: "one-pair",
    label: "One Pair",
    displayLabel: "One Pair",
    multiplier: 1,
  },
  "no-match": {
    outcome: "no-match",
    label: "No Match",
    displayLabel: "No Match",
    multiplier: 0,
  },
};

function getRankCounts(cards: Card[]): Map<Card["rank"], number> {
  return cards.reduce((counts, card) => {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
    return counts;
  }, new Map<Card["rank"], number>());
}

export function evaluateSuperMatch(initialHands: InitialHandSnapshot): SuperMatchPayout {
  const cards = initialHands.flat();
  const counts = [...getRankCounts(cards).values()].sort((a, b) => b - a);

  if (counts[0] === 4) {
    return PAYOUTS["four-of-a-kind"];
  }

  if (counts[0] === 2 && counts[1] === 2) {
    return PAYOUTS["two-pair"];
  }

  if (counts[0] === 3) {
    return PAYOUTS["three-of-a-kind"];
  }

  if (counts[0] === 2) {
    const sameHandPair = initialHands.some((hand) => hand.length === 2 && hand[0].rank === hand[1].rank);

    return sameHandPair ? PAYOUTS["one-pair-same-hand"] : PAYOUTS["one-pair"];
  }

  return PAYOUTS["no-match"];
}

export function createSuperMatchSummary(
  bet: number,
  initialHands: InitialHandSnapshot | null,
): SuperMatchSummary {
  if (bet <= 0 || !initialHands) {
    return {
      placed: false,
      outcome: "no-side-bet",
      label: "No Side Bet",
      displayLabel: "No Side Bet",
      multiplier: 0,
      bet: 0,
      profit: 0,
      returned: 0,
      logMessage: null,
    };
  }

  const result = evaluateSuperMatch(initialHands);
  const profit = result.outcome === "no-match" ? -bet : bet * result.multiplier;
  const returned = result.outcome === "no-match" ? 0 : bet + profit;
  const payoutText = `${result.multiplier}:1`;
  const profitText = `${profit >= 0 ? "+" : ""}${profit}`;

  return {
    placed: true,
    outcome: result.outcome,
    label: result.label,
    displayLabel: result.displayLabel,
    multiplier: result.multiplier,
    bet,
    profit,
    returned,
    logMessage:
      result.outcome === "no-match"
        ? `Super Match side bet: ${result.displayLabel}. Bet ${bet}, profit ${profitText}.`
        : `Super Match side bet: ${result.displayLabel}. Bet ${bet}, payout ${payoutText}, profit ${profitText}.`,
  };
}

export function createSuperMatchResult(summary: SuperMatchSummary): RoundResult | null {
  if (!summary.placed) {
    return null;
  }

  if (summary.outcome === "no-match") {
    return {
      handId: "super-match",
      outcome: "lose",
      amount: summary.profit,
      reason: summary.logMessage ?? "Super Match side bet lost.",
    };
  }

  return {
    handId: "super-match",
    outcome: "win",
    amount: summary.profit,
    reason: summary.logMessage ?? "Super Match side bet won.",
  };
}
