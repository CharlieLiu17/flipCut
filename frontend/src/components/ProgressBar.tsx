import { STATUS_PROGRESS, STATUS_LABELS } from "../constants";

export function ProgressBar({ status }: { status: string }) {
  const pct = STATUS_PROGRESS[status] ?? 0;
  const label = STATUS_LABELS[status] ?? status;
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
