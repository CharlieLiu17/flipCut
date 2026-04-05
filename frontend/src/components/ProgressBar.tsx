import { STATUS_PROGRESS } from "../constants";

export function ProgressBar({ status }: { status: string }) {
  const pct = STATUS_PROGRESS[status] ?? 0;
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
