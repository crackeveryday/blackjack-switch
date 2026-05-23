type ActionControlsProps = {
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
};

export default function ActionControls({
  canHit,
  canStand,
  canDouble,
  canSplit,
  canSurrender,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
}: ActionControlsProps) {
  return (
    <section className="control-panel">
      <div className="button-row">
        <button type="button" disabled={!canHit} onClick={onHit}>
          Hit
        </button>
        <button type="button" disabled={!canStand} onClick={onStand}>
          Stand
        </button>
        <button type="button" disabled={!canDouble} onClick={onDouble}>
          Double Down
        </button>
        <button type="button" disabled={!canSplit} onClick={onSplit}>
          Split
        </button>
        <button type="button" disabled={!canSurrender} onClick={onSurrender}>
          Surrender
        </button>
      </div>
    </section>
  );
}
