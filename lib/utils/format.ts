/** Formatting helpers shared across the UI. */

export function fmtNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function fmtPct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function fmtTemp(celsius: number): string {
  return `${celsius.toFixed(1)}\u00b0C`;
}

export function fmtCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function fmtHours(hours: number): string {
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}
