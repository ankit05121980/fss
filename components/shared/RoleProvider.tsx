"use client";

import * as React from "react";

import { DEFAULT_ROLE, ROLES, ROLE_STORAGE_KEY, type RoleDef, type RoleId } from "@/lib/utils/roles";

interface RoleContextValue {
  roleId: RoleId;
  role: RoleDef;
  setRole: (id: RoleId) => void;
}

const RoleContext = React.createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [roleId, setRoleId] = React.useState<RoleId>(DEFAULT_ROLE);

  // Restore the persisted role on the client.
  React.useEffect(() => {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored && stored in ROLES) setRoleId(stored as RoleId);
  }, []);

  const setRole = React.useCallback((id: RoleId) => {
    setRoleId(id);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo<RoleContextValue>(
    () => ({ roleId, role: ROLES[roleId], setRole }),
    [roleId, setRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
