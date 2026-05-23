import type { Card, GameState, PlayerHand } from "../types";
import { drawCard, shuffleDeck, createDeck } from "./deck";
import { calculateHandValue, isBust, isNaturalBlackjack } from "./hand";
import { canDoubleDown, canSplit, canSurrender, shouldDealerHit } from "./rules";
import { settleRound } from "./settlement";

export const INITIAL_CHIPS = 1000;
export const MIN_BET = 10;
export const MAX_BET = 500;
export const BET_STEP = 10;
export const NUMBER_OF_DECKS = 6;
export const TOTAL_CARDS_IN_SHOE = NUMBER_OF_DECKS * 52;
export const SHUFFLE_THRESHOLD = TOTAL_CARDS_IN_SHOE * 0.25;

function createPlayerHand(id: string, bet: number): PlayerHand {
  return {
    id,
    cards: [],
    bet,
    status: "active",
    isNaturalBlackjack: false,
    isFromSplit: false,
    isSplitAces: false,
    hasActed: false,
    canSplit: false,
  };
}

function resetRoundFields(state: GameState): GameState {
  return {
    ...state,
    playerHands: [],
    dealerHand: {
      cards: [],
      holeCardRevealed: false,
    },
    activeHandIndex: 0,
    insuranceBet: 0,
    insuranceTaken: false,
    roundResults: [],
    message: "",
    wasSwitched: false,
  };
}

function refreshHand(hand: PlayerHand, wasSwitched: boolean): PlayerHand {
  const total = calculateHandValue(hand.cards).total;
  const natural = isNaturalBlackjack(hand.cards, hand.isFromSplit, wasSwitched);
  const pair =
    hand.cards.length === 2 &&
    hand.cards[0].rank === hand.cards[1].rank &&
    !hand.isFromSplit &&
    !hand.hasActed &&
    hand.status === "active";

  if (hand.isSplitAces && hand.cards.length >= 2) {
    return {
      ...hand,
      isNaturalBlackjack: false,
      status: "standing",
      hasActed: true,
      canSplit: false,
    };
  }

  if (hand.status === "active" && (natural || total === 21)) {
    return {
      ...hand,
      isNaturalBlackjack: natural,
      status: "standing",
      hasActed: true,
      canSplit: false,
    };
  }

  return {
    ...hand,
    isNaturalBlackjack: natural,
    canSplit: pair,
  };
}

function formatHandLabel(id: string): string {
  const match = id.match(/^hand-(\d)([ab])?$/);

  if (!match) {
    return id;
  }

  const [, handNumber, suffix = ""] = match;
  return `Hand ${handNumber}${suffix.toUpperCase()}`;
}

function prepareShoe(state: GameState): GameState {
  if (!state.needsShuffle) {
    return state;
  }

  const combined = [...state.deck, ...state.discardPile];

  return {
    ...state,
    deck: shuffleDeck(combined.length > 0 ? combined : createDeck(NUMBER_OF_DECKS)),
    discardPile: [],
    needsShuffle: false,
    message: "シューをシャッフルしました。",
  };
}

function replacePlayerHand(state: GameState, handIndex: number, hand: PlayerHand): GameState {
  return {
    ...state,
    playerHands: state.playerHands.map((currentHand, index) => (index === handIndex ? hand : currentHand)),
  };
}

function getNextActiveIndex(playerHands: PlayerHand[], startIndex: number): number {
  return playerHands.findIndex((hand, index) => index >= startIndex && hand.status === "active");
}

function moveToNextPlayableHand(state: GameState, startIndex: number): GameState {
  const nextIndex = getNextActiveIndex(state.playerHands, startIndex);

  if (nextIndex !== -1) {
    return {
      ...state,
      phase: "playerTurn",
      activeHandIndex: nextIndex,
      message: `${formatHandLabel(state.playerHands[nextIndex].id)} のアクションを選んでください。`,
    };
  }

  return playDealerTurn({
    ...state,
    phase: "dealerTurn",
    message: "ディーラーのターンです。",
  });
}

function enterPlayerTurn(state: GameState): GameState {
  const playerHands = state.playerHands.map((hand) => refreshHand(hand, state.wasSwitched));

  return moveToNextPlayableHand(
    {
      ...state,
      phase: "playerTurn",
      playerHands,
    },
    0,
  );
}

function getActiveHand(state: GameState): PlayerHand | null {
  return state.playerHands[state.activeHandIndex] ?? null;
}

function withPlayerCard(state: GameState, handIndex: number, card: Card): GameState {
  const hand = state.playerHands[handIndex];

  return replacePlayerHand(state, handIndex, {
    ...hand,
    cards: [...hand.cards, card],
  });
}

function withDealerCard(state: GameState, card: Card): GameState {
  return {
    ...state,
    dealerHand: {
      ...state.dealerHand,
      cards: [...state.dealerHand.cards, card],
    },
  };
}

function addUsedCardsToDiscard(state: GameState): Card[] {
  return [
    ...state.discardPile,
    ...state.playerHands.flatMap((hand) => hand.cards),
    ...state.dealerHand.cards,
  ];
}

export function createInitialGameState(initialChips = INITIAL_CHIPS): GameState {
  return {
    phase: initialChips <= 0 ? "gameOver" : "betting",
    deck: shuffleDeck(createDeck(NUMBER_OF_DECKS)),
    discardPile: [],
    playerHands: [],
    dealerHand: {
      cards: [],
      holeCardRevealed: false,
    },
    activeHandIndex: 0,
    chips: initialChips,
    currentBet: 100,
    insuranceBet: 0,
    insuranceTaken: false,
    roundResults: [],
    message:
      initialChips <= 0 ? "チップがありません。リセットしてください。" : "ベットを決めて Deal してください。",
    wasSwitched: false,
    needsShuffle: false,
  };
}

export function getCommittedAmount(state: GameState): number {
  return state.playerHands.reduce((total, hand) => total + hand.bet, 0) + state.insuranceBet;
}

export function getAvailableChips(state: GameState): number {
  return state.chips - getCommittedAmount(state);
}

export function getDisplayAvailableChips(state: GameState): number {
  if (state.phase === "settlement" || state.phase === "gameOver") {
    return state.chips;
  }

  return getAvailableChips(state);
}

export function clampBet(bet: number, chips: number): number {
  const rounded = Math.floor(bet / BET_STEP) * BET_STEP;
  const maxAffordable = Math.min(MAX_BET, Math.floor(chips / 2 / BET_STEP) * BET_STEP);
  const lowerBound = Math.max(MIN_BET, rounded);
  const upperBound = maxAffordable >= MIN_BET ? maxAffordable : MIN_BET;

  return Math.max(MIN_BET, Math.min(lowerBound, upperBound));
}

export function startNewRound(state: GameState, bet: number): GameState {
  if (state.phase === "gameOver") {
    return state;
  }

  if (bet < MIN_BET || bet > MAX_BET || bet % BET_STEP !== 0 || state.chips < bet * 2) {
    return {
      ...state,
      message: "ベット額が不正です。10-500 の範囲で 10 単位にしてください。",
    };
  }

  const preparedState = prepareShoe(resetRoundFields(state));

  return {
    ...preparedState,
    currentBet: bet,
    playerHands: [createPlayerHand("hand-1", bet), createPlayerHand("hand-2", bet)],
    dealerHand: {
      cards: [],
      holeCardRevealed: false,
    },
    message: "カードを配ります。",
  };
}

export function dealInitialCards(state: GameState): GameState {
  if (state.playerHands.length !== 2 || state.playerHands.some((hand) => hand.cards.length > 0)) {
    return state;
  }

  let nextState = state;
  const order: Array<{ target: "player" | "dealer"; handIndex?: number }> = [
    { target: "player", handIndex: 0 },
    { target: "player", handIndex: 1 },
    { target: "dealer" },
    { target: "player", handIndex: 0 },
    { target: "player", handIndex: 1 },
    { target: "dealer" },
  ];

  for (const step of order) {
    const draw = drawCard(nextState);
    nextState = draw.state;

    if (step.target === "dealer") {
      nextState = withDealerCard(nextState, draw.card);
      continue;
    }

    nextState = withPlayerCard(nextState, step.handIndex!, draw.card);
  }

  const playerHands = nextState.playerHands.map((hand) => ({
    ...hand,
    isNaturalBlackjack: isNaturalBlackjack(hand.cards, false, false),
    canSplit: hand.cards[0].rank === hand.cards[1].rank,
  }));
  const dealerShowsAce = nextState.dealerHand.cards[0]?.rank === "A";

  return {
    ...nextState,
    playerHands,
    phase: dealerShowsAce ? "insurance" : "switch",
    message: dealerShowsAce
      ? "ディーラーが A を見せています。Insurance を選んでください。"
      : "Switch するか Keep するか選んでください。",
  };
}

function resolveInsuranceChoice(state: GameState, insuranceTaken: boolean): GameState {
  if (state.phase !== "insurance") {
    return state;
  }

  const insuranceBet = insuranceTaken ? state.currentBet : 0;

  if (insuranceTaken && getAvailableChips(state) < insuranceBet) {
    return {
      ...state,
      message: "Insurance 用のチップが足りません。",
    };
  }

  const dealerNaturalBlackjack = isNaturalBlackjack(state.dealerHand.cards, false, false);
  const nextState: GameState = {
    ...state,
    insuranceTaken,
    insuranceBet,
    dealerHand: {
      ...state.dealerHand,
      holeCardRevealed: dealerNaturalBlackjack,
    },
  };

  if (dealerNaturalBlackjack) {
    return settleRound({
      ...nextState,
      phase: "settlement",
      message: "ディーラーはナチュラルブラックジャックです。",
    });
  }

  return {
    ...nextState,
    phase: "switch",
    dealerHand: {
      ...nextState.dealerHand,
      holeCardRevealed: false,
    },
    message: insuranceTaken
      ? "Insurance を取りました。Switch するか Keep するか選んでください。"
      : "ディーラーはナチュラルブラックジャックではありません。Switch するか Keep するか選んでください。",
  };
}

export function takeInsurance(state: GameState): GameState {
  return resolveInsuranceChoice(state, true);
}

export function declineInsurance(state: GameState): GameState {
  return resolveInsuranceChoice(state, false);
}

export function switchCards(state: GameState): GameState {
  if (state.phase !== "switch" || state.playerHands.length < 2) {
    return state;
  }

  const [firstHand, secondHand] = state.playerHands;
  const firstSwapCard = firstHand.cards[1];
  const secondSwapCard = secondHand.cards[1];

  if (!firstSwapCard || !secondSwapCard) {
    return state;
  }

  const playerHands: PlayerHand[] = [
    {
      ...firstHand,
      cards: [firstHand.cards[0], secondSwapCard],
      isNaturalBlackjack: false,
      hasActed: false,
      status: "active",
      canSplit: false,
    },
    {
      ...secondHand,
      cards: [secondHand.cards[0], firstSwapCard],
      isNaturalBlackjack: false,
      hasActed: false,
      status: "active",
      canSplit: false,
    },
  ];

  return enterPlayerTurn({
    ...state,
    wasSwitched: true,
    playerHands,
    message: "2 枚目同士を入れ替えました。",
  });
}

export function keepCards(state: GameState): GameState {
  if (state.phase !== "switch") {
    return state;
  }

  return enterPlayerTurn({
    ...state,
    message: "Keep を選びました。",
  });
}

export function hit(state: GameState): GameState {
  if (state.phase !== "playerTurn") {
    return state;
  }

  const activeHand = getActiveHand(state);

  if (!activeHand || activeHand.status !== "active") {
    return state;
  }

  const draw = drawCard(state);
  const nextCards = [...activeHand.cards, draw.card];
  const busted = isBust(nextCards);
  const total = calculateHandValue(nextCards).total;
  const nextHand: PlayerHand = refreshHand(
    {
      ...activeHand,
      cards: nextCards,
      hasActed: true,
      status: busted ? "busted" : total === 21 ? "standing" : "active",
      canSplit: false,
    },
    draw.state.wasSwitched,
  );
  const nextState = replacePlayerHand(draw.state, draw.state.activeHandIndex, nextHand);

  if (nextHand.status === "active") {
    return {
      ...nextState,
      message: `${formatHandLabel(nextHand.id)} にカードを 1 枚追加しました。`,
    };
  }

  return moveToNextPlayableHand(nextState, state.activeHandIndex + 1);
}

export function stand(state: GameState): GameState {
  if (state.phase !== "playerTurn") {
    return state;
  }

  const activeHand = getActiveHand(state);

  if (!activeHand || activeHand.status !== "active") {
    return state;
  }

  const nextState = replacePlayerHand(state, state.activeHandIndex, {
    ...activeHand,
    hasActed: true,
    status: "standing",
    canSplit: false,
  });

  return moveToNextPlayableHand(nextState, state.activeHandIndex + 1);
}

export function doubleDown(state: GameState): GameState {
  if (state.phase !== "playerTurn") {
    return state;
  }

  const activeHand = getActiveHand(state);

  if (!activeHand || !canDoubleDown(activeHand, getAvailableChips(state))) {
    return state;
  }

  const doubledHand = replacePlayerHand(state, state.activeHandIndex, {
    ...activeHand,
    bet: activeHand.bet * 2,
    canSplit: false,
  });
  const draw = drawCard(doubledHand);
  const nextCards = [...doubledHand.playerHands[doubledHand.activeHandIndex].cards, draw.card];
  const busted = isBust(nextCards);
  const nextHand: PlayerHand = {
    ...doubledHand.playerHands[doubledHand.activeHandIndex],
    cards: nextCards,
    hasActed: true,
    status: busted ? "busted" : "doubled",
    isNaturalBlackjack: false,
    canSplit: false,
  };
  const nextState = replacePlayerHand(draw.state, draw.state.activeHandIndex, nextHand);

  return moveToNextPlayableHand(nextState, state.activeHandIndex + 1);
}

function finalizeSplitHand(hand: PlayerHand, wasSwitched: boolean): PlayerHand {
  const total = calculateHandValue(hand.cards).total;

  if (hand.isSplitAces) {
    return {
      ...hand,
      isNaturalBlackjack: false,
      hasActed: true,
      status: "standing",
      canSplit: false,
    };
  }

  if (total === 21) {
    return {
      ...hand,
      isNaturalBlackjack: false,
      hasActed: true,
      status: "standing",
      canSplit: false,
    };
  }

  return refreshHand(hand, wasSwitched);
}

export function splitHand(state: GameState): GameState {
  if (state.phase !== "playerTurn") {
    return state;
  }

  const activeHand = getActiveHand(state);

  if (!activeHand || !canSplit(activeHand, getAvailableChips(state))) {
    return state;
  }

  const splitAces = activeHand.cards[0].rank === "A";
  const firstBaseHand: PlayerHand = {
    ...createPlayerHand(`${activeHand.id}a`, activeHand.bet),
    cards: [activeHand.cards[0]],
    isFromSplit: true,
    isSplitAces: splitAces,
  };
  const secondBaseHand: PlayerHand = {
    ...createPlayerHand(`${activeHand.id}b`, activeHand.bet),
    cards: [activeHand.cards[1]],
    isFromSplit: true,
    isSplitAces: splitAces,
  };
  const withoutActive = {
    ...state,
    playerHands: state.playerHands.flatMap((hand, index) =>
      index === state.activeHandIndex ? [firstBaseHand, secondBaseHand] : [hand],
    ),
  };
  const firstDraw = drawCard(withoutActive);
  const withFirstCard = replacePlayerHand(firstDraw.state, state.activeHandIndex, {
    ...firstBaseHand,
    cards: [...firstBaseHand.cards, firstDraw.card],
  });
  const secondDraw = drawCard(withFirstCard);
  const withSecondCard = replacePlayerHand(secondDraw.state, state.activeHandIndex + 1, {
    ...secondBaseHand,
    cards: [...secondBaseHand.cards, secondDraw.card],
  });
  const finalizedHands = withSecondCard.playerHands.map((hand, index) => {
    if (index !== state.activeHandIndex && index !== state.activeHandIndex + 1) {
      return hand;
    }

    return finalizeSplitHand(hand, withSecondCard.wasSwitched);
  });

  return moveToNextPlayableHand(
    {
      ...withSecondCard,
      playerHands: finalizedHands,
      message: `${formatHandLabel(activeHand.id)} を Split しました。`,
    },
    state.activeHandIndex,
  );
}

export function surrender(state: GameState): GameState {
  if (state.phase !== "playerTurn") {
    return state;
  }

  const activeHand = getActiveHand(state);

  if (!activeHand || !canSurrender(activeHand)) {
    return state;
  }

  const nextState = replacePlayerHand(state, state.activeHandIndex, {
    ...activeHand,
    hasActed: true,
    status: "surrendered",
    canSplit: false,
  });

  return moveToNextPlayableHand(nextState, state.activeHandIndex + 1);
}

export function playDealerTurn(state: GameState): GameState {
  if (state.phase !== "dealerTurn") {
    return state;
  }

  let nextState: GameState = {
    ...state,
    dealerHand: {
      ...state.dealerHand,
      holeCardRevealed: true,
    },
  };
  const allHandsClosed = nextState.playerHands.every(
    (hand) => hand.status === "busted" || hand.status === "surrendered",
  );

  if (!allHandsClosed) {
    while (shouldDealerHit(nextState.dealerHand.cards)) {
      const draw = drawCard(nextState);
      nextState = withDealerCard(draw.state, draw.card);
    }
  }

  return settleRound(nextState);
}

export function startNextRound(state: GameState): GameState {
  if (state.phase !== "settlement") {
    return state;
  }

  const discardPile = addUsedCardsToDiscard(state);
  const needsShuffle = state.deck.length < SHUFFLE_THRESHOLD;

  return {
    ...resetRoundFields(state),
    phase: state.chips <= 0 ? "gameOver" : "betting",
    discardPile,
    currentBet: clampBet(state.currentBet, state.chips),
    needsShuffle,
    message:
      state.chips <= 0
        ? "チップがなくなりました。リセットしてください。"
        : needsShuffle
          ? "次のラウンド開始時にシューをシャッフルします。"
          : "ベットを決めて Deal してください。",
  };
}

export function resetGame(): GameState {
  return createInitialGameState(INITIAL_CHIPS);
}

export { formatHandLabel };
