import { Network, Truck } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/**
 * Brand-accurate connector marks. HubSpot uses its official CC0 logo
 * (simple-icons); the others use each brand's signature colour with a
 * monogram or category glyph. Drop a real file at `public/connectors/<id>.svg`
 * and reference it here to swap in an exact official logo.
 */

interface Brand {
  color: string;
  mono?: string;
  glyph?: "hubspot" | "truck" | "registry";
}

const BRAND: Record<string, Brand> = {
  netsuite: { color: "#C74634", mono: "NS" }, // Oracle NetSuite red
  datex: { color: "#F26F21", mono: "DX" }, // Datex orange
  eupry: { color: "#10A37F", mono: "EU" }, // Eupry teal/green
  transport: { color: "#2E75B6", glyph: "truck" },
  "partner-registry": { color: "#6D4AFF", glyph: "registry" },
  hubspot: { color: "#FF7A59", glyph: "hubspot" },
};

const HUBSPOT_PATH =
  "M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z";

export function ConnectorLogo({ id, className }: { id: string; className?: string }) {
  const brand = BRAND[id] ?? { color: "#2E75B6", mono: id.slice(0, 2).toUpperCase() };
  return (
    <span
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-lg border border-border bg-white",
        className,
      )}
      aria-hidden="true"
    >
      {brand.glyph === "hubspot" ? (
        <svg viewBox="0 0 24 24" className="size-[62%]" fill={brand.color}>
          <path d={HUBSPOT_PATH} />
        </svg>
      ) : brand.glyph === "truck" ? (
        <Truck className="size-[58%]" style={{ color: brand.color }} />
      ) : brand.glyph === "registry" ? (
        <Network className="size-[58%]" style={{ color: brand.color }} />
      ) : (
        <span className="text-sm font-extrabold tracking-tight" style={{ color: brand.color }}>
          {brand.mono}
        </span>
      )}
    </span>
  );
}
