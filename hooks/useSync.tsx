"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onDataChange, syncWithCloud, SyncStatus } from "@/lib/sync";
import { getSyncId } from "@/lib/storage";
import { useProfile } from "./useProfile";

interface SyncContextValue {
  syncId: string | null;
  status: SyncStatus;
  lastSynced: string | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isReady, refreshProfiles } = useProfile();
  const [syncId, setSyncIdState] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const syncNow = useCallback(async () => {
    const id = getSyncId();
    if (!id) {
      setStatus("idle");
      return;
    }
    setStatus("syncing");
    const result = await syncWithCloud();
    setStatus(result.status);
    if (result.status === "synced") {
      setLastSynced(new Date().toISOString());
      refreshProfiles();
      window.dispatchEvent(new Event("tcf-data-synced"));
    }
  }, [refreshProfiles]);

  useEffect(() => {
    setSyncIdState(getSyncId());
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const id = getSyncId();
    if (id) syncNow();
  }, [isReady, syncNow]);

  useEffect(() => {
    return onDataChange(() => {
      setSyncIdState(getSyncId());
    });
  }, []);

  useEffect(() => {
    const handler = () => syncNow();
    window.addEventListener("tcf-sync-request", handler);
    return () => window.removeEventListener("tcf-sync-request", handler);
  }, [syncNow]);

  const value = useMemo(
    () => ({ syncId, status, lastSynced, syncNow }),
    [syncId, status, lastSynced, syncNow]
  );

  return (
    <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}
