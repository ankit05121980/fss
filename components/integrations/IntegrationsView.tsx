"use client";

import * as React from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Plug,
  RefreshCw,
  Settings2,
  UploadCloud,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useToast } from "@/components/shared/Toast";
import {
  ARCH_ICON,
  ARCH_LAYERS,
  CONNECTORS,
  type Connector,
  type ConnectorStatus,
} from "@/lib/utils/integrations";
import type { BadgeProps } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/shared/ChartCard";

const STATUS_META: Record<ConnectorStatus, { label: string; variant: NonNullable<BadgeProps["variant"]> }> = {
  CONNECTED: { label: "Connected", variant: "success" },
  AVAILABLE: { label: "Available", variant: "info" },
  OPTIONAL: { label: "Optional", variant: "muted" },
};

interface UploadResult {
  name: string;
  sizeKb: number;
  type: string;
  columns: string[];
  rows: string[][];
  detectedRows: number;
}

function syncLabel(hours: number | null): string {
  if (hours === null) return "Not synced";
  if (hours === 0) return "Synced just now";
  return `Synced ${hours}h ago`;
}

export function IntegrationsView() {
  const { toast } = useToast();
  const [connectors, setConnectors] = React.useState<Connector[]>(() =>
    CONNECTORS.map((c) => ({ ...c })),
  );
  const [upload, setUpload] = React.useState<UploadResult | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const isText = /\.(csv|tsv|txt)$/i.test(file.name) || file.type.includes("csv");
    let columns: string[] = [];
    let rows: string[][] = [];
    let detectedRows = 0;
    if (isText) {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      detectedRows = Math.max(0, lines.length - 1);
      const delim = lines[0]?.includes("\t") ? "\t" : ",";
      columns = (lines[0] ?? "").split(delim).map((c) => c.trim());
      rows = lines.slice(1, 6).map((l) => l.split(delim).map((c) => c.trim()));
    } else {
      // Binary workbook (.xlsx) — metadata only in this demo.
      columns = ["Column A", "Column B", "Column C", "Column D"];
      detectedRows = Math.round(sizeKb * 8.5);
    }
    setUpload({ name: file.name, sizeKb, type: file.type || "spreadsheet", columns, rows, detectedRows });
    toast(`Parsed ${file.name}`, "success");
  }

  function onImport() {
    if (!upload) return;
    toast(`Imported ${upload.detectedRows.toLocaleString()} rows — mapped to the unified model (demo)`, "success");
    setUpload(null);
  }

  function setStatus(id: string, status: ConnectorStatus, lastSyncHours: number | null) {
    setConnectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, lastSyncHours } : c)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <ChartCard
        title="Upload data file"
        description="Bring data in directly from Excel or CSV — Lumenore maps it into the unified model."
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-brand-blue bg-accent/40" : "border-border hover:border-brand-blue hover:bg-accent/20",
          )}
        >
          <UploadCloud className="text-brand-blue size-8" />
          <p className="text-foreground mt-2 text-sm font-medium">
            Drop an Excel / CSV file here, or click to browse
          </p>
          <p className="text-muted-foreground text-xs">.xlsx, .xls, .csv up to ~10 MB</p>
        </div>

        {upload && (
          <div className="mt-4 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-success size-5" />
                <div>
                  <p className="text-foreground text-sm font-semibold">{upload.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {upload.sizeKb.toLocaleString()} KB · {upload.detectedRows.toLocaleString()} rows ·{" "}
                    {upload.columns.length} columns detected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info">Maps to: Shipment events</Badge>
                <Button size="sm" onClick={onImport}>
                  <CheckCircle2 className="size-4" /> Map &amp; import
                </Button>
              </div>
            </div>
            {upload.rows.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60">
                    <tr>
                      {upload.columns.map((c, i) => (
                        <th key={i} className="text-muted-foreground px-2 py-1.5 text-left font-semibold">
                          {c || `Col ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {upload.rows.map((r, ri) => (
                      <tr key={ri} className="border-t border-border">
                        {upload.columns.map((_, ci) => (
                          <td key={ci} className="text-foreground px-2 py-1.5">
                            {r[ci] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </ChartCard>

      {/* Connectors */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Plug className="text-brand-blue size-4" />
          <h2 className="text-foreground text-sm font-semibold">Source-system connectors</h2>
          <Badge variant="muted">Read-only intelligence layer</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {connectors.map((c) => {
            const Icon = c.icon;
            const meta = STATUS_META[c.status];
            return (
              <Card key={c.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-secondary text-secondary-foreground flex size-9 items-center justify-center rounded-lg">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <CardTitle className="text-sm">{c.name}</CardTitle>
                      <p className="text-muted-foreground text-xs">{c.category}</p>
                    </div>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="text-muted-foreground text-xs">{c.description}</p>
                  <dl className="mt-3 space-y-1.5 text-xs">
                    <Row label="Provides" value={c.dataProvided} />
                    <Row label="Method" value={c.method} />
                    <Row label="Refresh" value={c.cadence} />
                    <Row label="Status" value={syncLabel(c.lastSyncHours)} />
                  </dl>
                  <div className="mt-auto pt-3">
                    {c.status === "CONNECTED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setStatus(c.id, "CONNECTED", 0);
                          toast(`${c.name}: sync queued (demo)`, "info");
                        }}
                      >
                        <RefreshCw className="size-4" /> Sync now
                      </Button>
                    )}
                    {c.status === "AVAILABLE" && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setStatus(c.id, "CONNECTED", 0);
                          toast(`${c.name} connected (demo)`, "success");
                        }}
                      >
                        <Plug className="size-4" /> Connect
                      </Button>
                    )}
                    {c.status === "OPTIONAL" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => toast(`${c.name} is an optional production enrichment`, "info")}
                      >
                        <Settings2 className="size-4" /> Configure
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Architecture flow */}
      <ChartCard
        title="How it fits together"
        description="Lumenore conforms every source into one model — without replacing your systems of record."
      >
        <div className="flex flex-col gap-2 overflow-x-auto md:flex-row md:items-stretch">
          {ARCH_LAYERS.map((layer, i) => {
            const ArchIcon = ARCH_ICON;
            return (
              <React.Fragment key={layer.label}>
                <div className="border-border bg-muted/30 flex min-w-[150px] flex-1 flex-col rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md text-[11px] font-bold">
                      {i + 1}
                    </span>
                    <ArchIcon className="text-muted-foreground size-4" />
                  </div>
                  <p className="text-foreground mt-2 text-sm font-semibold">{layer.label}</p>
                  <p className="text-muted-foreground text-xs">{layer.detail}</p>
                </div>
                {i < ARCH_LAYERS.length - 1 && (
                  <div className="hidden items-center justify-center md:flex">
                    <ArrowRight className="text-muted-foreground size-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <p className="text-muted-foreground mt-3 text-[11px]">
          In this POC the data-access layer is mocked; swapping to live connectors is isolated to
          <code className="bg-muted mx-1 rounded px-1">lib/data/access.ts</code> — the dashboards and
          APIs stay unchanged.
        </p>
      </ChartCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}
