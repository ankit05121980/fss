import { cn } from "@/lib/utils/cn";

/**
 * Compact pill that visualizes a 0-100 risk score with a color ramp.
 * Higher = riskier (green -> amber -> red).
 */
export function RiskScorePill({
  score,
  showLabel = true,
  className,
}: {
  score: number;
  showLabel?: boolean;
  className?: string;
}) {
  const rounded = Math.round(score);
  const tone =
    rounded >= 70
      ? "bg-danger/15 text-danger"
      : rounded >= 40
        ? "bg-warning/15 text-warning"
        : "bg-success/15 text-success";
  const label = rounded >= 70 ? "High" : rounded >= 40 ? "Medium" : "Low";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        tone,
        className,
      )}
      title={`Risk score ${rounded}/100`}
    >
      {rounded}
      {showLabel && <span className="font-medium opacity-80">{label}</span>}
    </span>
  );
}
