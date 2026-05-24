export type GamePhase =
  | "betting"
  | "insurance"
  | "switch"
  | "playerTurn"
  | "dealerTurn"
  | "settlement"
  | "gameOver";

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type Card = {
  suit: Suit;
  rank: Rank;
};

export type HandStatus =
  | "active"
  | "standing"
  | "busted"
  | "surrendered"
  | "doubled"
  | "completed";

export type PlayerHand = {
  id: string;
  cards: Card[];
  bet: number;
  status: HandStatus;
  isNaturalBlackjack: boolean;
  isFromSplit: boolean;
  isSplitAces: boolean;
  hasActed: boolean;
  canSplit: boolean;
};

export type DealerHand = {
  cards: Card[];
  holeCardRevealed: boolean;
};

export type RoundResult = {
  handId: string;
  outcome: "win" | "lose" | "push" | "surrender";
  amount: number;
  reason: string;
};

export type GameStateSnapshot = {
  phase: GamePhase;
  deck: Card[];
  discardPile: Card[];
  playerHands: PlayerHand[];
  dealerHand: DealerHand;
  activeHandIndex: number;
  chips: number;
  currentBet: number;
  insuranceBet: number;
  insuranceTaken: boolean;
  roundResults: RoundResult[];
  message: string;
  wasSwitched: boolean;
  needsShuffle: boolean;
};

export type GameState = GameStateSnapshot & {
  undoStack: GameStateSnapshot[];
};
