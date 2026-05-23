import type { RoundResult } from "../types";
import { formatHandLabel } from "../game/gameState";

type ResultPanelProps = {
  results: RoundResult[];
};

function getResultLabel(result: RoundResult): string {
  if (result.handId === "insurance") {
    return "Insurance";
  }

  return formatHandLabel(result.handId);
}

export default function ResultPanel({ results }: ResultPanelProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <section className="result-panel">
      <h2>Round Result</h2>
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
    </section>
  );
}
