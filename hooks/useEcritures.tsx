"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EcritureEntry, EcritureTache } from "@/lib/types";
import {
  addEcriture,
  deleteEcriture,
  getEcritures,
  saveEcritures,
  setEcrituresTache,
  updateEcriture,
} from "@/lib/storage";
import { useProfile } from "./useProfile";

interface EcrituresContextValue {
  ecritures: EcritureEntry[];
  isLoading: boolean;
  addEntry: (entry: Omit<EcritureEntry, "id" | "createdAt">) => void;
  updateEntry: (entry: EcritureEntry) => void;
  deleteEntry: (entryId: string) => void;
  setTache: (entryIds: string[], tache: EcritureTache) => void;
  replaceAll: (entries: EcritureEntry[]) => void;
  refreshEcritures: () => void;
}

const EcrituresContext = createContext<EcrituresContextValue | null>(null);

export function EcrituresProvider({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useProfile();
  const [ecritures, setEcritures] = useState<EcritureEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshEcritures = useCallback(() => {
    if (!activeProfile) {
      setEcritures([]);
      setIsLoading(false);
      return;
    }
    setEcritures(getEcritures(activeProfile.id));
    setIsLoading(false);
  }, [activeProfile]);

  useEffect(() => {
    setIsLoading(true);
    refreshEcritures();
  }, [refreshEcritures]);

  useEffect(() => {
    const handler = () => refreshEcritures();
    window.addEventListener("tcf-data-synced", handler);
    return () => window.removeEventListener("tcf-data-synced", handler);
  }, [refreshEcritures]);

  const addEntry = useCallback(
    (entry: Omit<EcritureEntry, "id" | "createdAt">) => {
      if (!activeProfile) return;
      addEcriture(activeProfile.id, entry);
      refreshEcritures();
    },
    [activeProfile, refreshEcritures]
  );

  const updateEntry = useCallback(
    (entry: EcritureEntry) => {
      if (!activeProfile) return;
      updateEcriture(activeProfile.id, entry);
      refreshEcritures();
    },
    [activeProfile, refreshEcritures]
  );

  const deleteEntry = useCallback(
    (entryId: string) => {
      if (!activeProfile) return;
      deleteEcriture(activeProfile.id, entryId);
      refreshEcritures();
    },
    [activeProfile, refreshEcritures]
  );

  const setTache = useCallback(
    (entryIds: string[], tache: EcritureTache) => {
      if (!activeProfile) return;
      setEcrituresTache(activeProfile.id, entryIds, tache);
      refreshEcritures();
    },
    [activeProfile, refreshEcritures]
  );

  const replaceAll = useCallback(
    (entries: EcritureEntry[]) => {
      if (!activeProfile) return;
      saveEcritures(activeProfile.id, entries);
      refreshEcritures();
    },
    [activeProfile, refreshEcritures]
  );

  const value = useMemo(
    () => ({
      ecritures,
      isLoading,
      addEntry,
      updateEntry,
      deleteEntry,
      setTache,
      replaceAll,
      refreshEcritures,
    }),
    [
      ecritures,
      isLoading,
      addEntry,
      updateEntry,
      deleteEntry,
      setTache,
      replaceAll,
      refreshEcritures,
    ]
  );

  return (
    <EcrituresContext.Provider value={value}>
      {children}
    </EcrituresContext.Provider>
  );
}

export function useEcritures() {
  const context = useContext(EcrituresContext);
  if (!context) {
    throw new Error("useEcritures must be used within EcrituresProvider");
  }
  return context;
}
