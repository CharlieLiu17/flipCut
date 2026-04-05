export type ErrorType = "upload" | "timeout" | "network" | "delete" | "validation";

const CONFIG: Record<ErrorType, { icon: string; bg: string; border: string; color: string }> = {
  upload:     { icon: "⚠", bg: "rgba(234, 179, 8, 0.08)",  border: "rgba(234, 179, 8, 0.3)",  color: "#a16207" },
  timeout:    { icon: "⏱", bg: "rgba(249, 115, 22, 0.08)", border: "rgba(249, 115, 22, 0.3)", color: "#c2410c" },
  network:    { icon: "⚡", bg: "rgba(220, 38, 38, 0.08)",  border: "rgba(220, 38, 38, 0.3)",  color: "#dc2626" },
  delete:     { icon: "🗑", bg: "rgba(220, 38, 38, 0.08)",  border: "rgba(220, 38, 38, 0.3)",  color: "#dc2626" },
  validation: { icon: "ℹ", bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.3)", color: "#2563eb" },
};

interface Props {
  type: ErrorType;
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ type, message, onDismiss }: Props) {
  const c = CONFIG[type];
  return (
    <div className="error-banner-v2" role="alert" style={{ background: c.bg, borderColor: c.border, color: c.color }}>
      <span>{c.icon} {message}</span>
      {onDismiss && <button className="error-dismiss" style={{ color: c.color }} onClick={onDismiss} aria-label="Dismiss">×</button>}
    </div>
  );
}
