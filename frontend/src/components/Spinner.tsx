export function Spinner({ label }: { label: string }) {
  return (
    <div className="processing-overlay">
      <div className="spinner" />
      <div className="processing-label">{label}</div>
    </div>
  );
}
