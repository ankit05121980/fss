"use client";

import * as React from "react";
import { ArrowRight, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_STORAGE_KEY } from "@/lib/utils/roles";
import { AUTH_STORAGE_KEY } from "@/lib/utils/auth";

// netlink.com sign-in IDs mapped to workspace roles.
const LOGIN_IDS: { email: string; role: string; label: string }[] = [
  { email: "admin@netlink.com", role: "ADMIN", label: "Administrator" },
  { email: "executive@netlink.com", role: "EXECUTIVE", label: "Executive" },
  { email: "compliance@netlink.com", role: "COMPLIANCE", label: "Compliance Officer" },
  { email: "operations@netlink.com", role: "OPERATIONS", label: "Operations Manager" },
];

function roleForEmail(email: string): string {
  const match = LOGIN_IDS.find((l) => l.email.toLowerCase() === email.trim().toLowerCase());
  return match?.role ?? "ADMIN";
}

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false);

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value ?? "";
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, roleForEmail(email));
      localStorage.setItem(AUTH_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    window.location.assign("/executive");
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4">
      {/* soft brand backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, rgba(46,117,182,0.16), transparent 60%), radial-gradient(50rem 40rem at 110% 110%, rgba(88,195,212,0.18), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl lg:grid-cols-2">
        {/* Left: brand panel */}
        <div className="hidden flex-col justify-between gap-8 bg-primary/[0.03] p-10 lg:flex">
          <Logo />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Pharmaceutical supply-chain visibility &amp; DSCSA readiness
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              One intelligence layer across traceability, cold chain, recall readiness, trading
              partners and predictive risk — with conversational and automated insights.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {[
                "End-to-end serialized traceability",
                "Cold-chain excursion root-cause",
                "Recall readiness & partner compliance",
                "AI: Ask Me, Do You Know, Predictive",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-success" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: sign-in form */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Sign in to your workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Enter your credentials to continue.
          </p>

          <form onSubmit={signIn} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  defaultValue="admin@netlink.com"
                  placeholder="name@netlink.com"
                  className="pl-9"
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="cursor-pointer text-xs text-brand-blue hover:underline">Forgot?</span>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  defaultValue="demo"
                  placeholder="••••••••"
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"} <ArrowRight className="size-4" />
            </Button>

            <div className="relative py-2 text-center">
              <span className="relative z-10 bg-card px-2 text-xs text-muted-foreground">or</span>
              <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
            </div>

            <Button type="submit" variant="outline" size="lg" className="w-full" disabled={loading}>
              <KeyRound className="size-4" /> Continue with SSO
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
