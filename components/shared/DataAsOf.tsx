"use client";

import * as React from "react";

const FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/**
 * Data-freshness label showing the current date/time in UTC. Computed on the
 * client after mount so it always reflects "today" without a hydration mismatch.
 */
export function DataAsOf({ className }: { className?: string }) {
  const [ts, setTs] = React.useState("");
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTs(FMT.format(new Date()));
  }, []);
  return <span className={className}>Data as of {ts ? `${ts} UTC` : "today"}</span>;
}
