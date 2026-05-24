import type { RoundResult, SuperMatchSummary } from "../types";
import { formatHandLabel } from "../game/gameState";

type ResultPanelProps = {
  results: RoundResult[];
  superMatchSummary: SuperMatchSummary | null;
};

function getResultLabel(result: RoundResult): string {
  if (result.handId === "insurance") {
    return "Insurance";
  }

  if (result.handId === "super-match") {
    return "Super Match";
  }

  return formatHandLabel(result.handId);
}

function formatSignedAmount(amount: number): string {
  return amount >= 0 ? `+${amount}` : `${amount}`;
}

function renderSuperMatch(summary: SuperMatchSummary) {
  if (!summary.placed) {
    return (
      <article className="super-match-summary">
        <div className="super-match-header">
          <strong>Super Match</strong>
          <span className="result-reason">No Side Bet</span>
        </div>
      </article>
    );
  }

  return (
    <article className="super-match-summary">
      <div className="super-match-header">
        <strong>Super Match</strong>
        <span className={summary.profit >= 0 ? "result-win" : "result-lose"}>
          {formatSignedAmount(summary.profit)}
        </span>
      </div>
      <div className="super-match-grid">
        <span>{summary.displayLabel}</span>
        <span>Bet {summary.bet}</span>
        <span>Payout {summary.multiplier}:1</span>
        <span>Returned {summary.returned}</span>
      </div>
      <p className="result-reason">{summary.logMessage}</p>
    </article>
  );
}

export default function ResultPanel({ results, superMatchSummary }: ResultPanelProps) {
  if (results.length === 0 && !superMatchSummary) {
    return null;
  }

  return (
    <section className="result-panel">
      <h2>Round Result</h2>
      {results.length > 0 && (
        <ul>
          {results.map((result) => (
            <li key={`${result.handId}-${result.reason}`}>
              <strong>{getResultLabel(result)}</strong>
              <span className={result.amount >= 0 ? "result-win" : "result-lose"}>
                {result.amount >= 0 ? ` +${result.amount}` : ` ${result.amount}`}
              </span>
              <span className="result-reason"> {result.reason}</span>
            </li>
          ))}
        </ul>
      )}
      {superMatchSummary && renderSuperMatch(superMatchSummary)}
    </section>
  );
}
