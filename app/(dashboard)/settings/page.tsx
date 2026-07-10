"use client";

import { useRouter } from "next/navigation";
import { Check, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils/cn";
import { useRole } from "@/components/shared/RoleProvider";
import { useToast } from "@/components/shared/Toast";
import { ROLE_LIST } from "@/lib/utils/roles";
import { DataAsOf } from "@/components/shared/DataAsOf";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const router = useRouter();
  const { roleId, setRole } = useRole();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your role, workspace and appearance preferences." />

      {/* Role & workspace */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role &amp; workspace</CardTitle>
          <CardDescription>
            Switch persona to tailor your landing page and the &ldquo;Your workspace&rdquo; modules. All
            modules remain accessible.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {ROLE_LIST.map((r) => {
            const Icon = r.icon;
            const active = r.id === roleId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id);
                  toast(`Viewing as ${r.label}`, "success");
                  router.push(r.landing);
                }}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                  active
                    ? "border-brand-blue bg-brand-surface-2/50"
                    : "border-border hover:border-brand-blue hover:bg-accent/40",
                )}
              >
                <span className="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground text-sm font-semibold">{r.label}</p>
                    {active && (
                      <Badge variant="info" className="gap-1">
                        <Check className="size-3" /> Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{r.person} · {r.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{r.blurb}</p>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Choose how NetTrace looks.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Monitor },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.id;
              return (
                <Button
                  key={opt.id}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(opt.id)}
                  className="gap-1.5"
                >
                  <Icon className="size-4" /> {opt.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Environment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Environment</CardTitle>
            <CardDescription>About this deployment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Environment" value="Demo — representative data" />
            <div className="flex items-center justify-between gap-4 border-b border-border py-1.5">
              <span className="text-muted-foreground">Data as of</span>
              <DataAsOf className="text-foreground font-medium" />
            </div>
            <Row label="Product" value="NetTrace · Netlink's Flagship AI Product" />
            <Row label="Integration mode" value="Mock data-access layer (swappable)" />
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast("Sign-out is disabled in the demo environment", "info")}
              >
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
