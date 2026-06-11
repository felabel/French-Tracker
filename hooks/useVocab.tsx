"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { VocabCategory, VocabEntry } from "@/lib/types";
import {
  addVocabCategory,
  addVocabEntry,
  deleteVocabCategory,
  deleteVocabEntry,
  getVocabCategories,
  getVocabEntries,
  seedVocabCategories,
  updateVocabEntry,
} from "@/lib/storage";
import { useProfile } from "./useProfile";

interface VocabContextValue {
  categories: VocabCategory[];
  entries: VocabEntry[];
  isLoading: boolean;
  addCategory: (name: string) => void;
  deleteCategory: (categoryId: string) => void;
  addEntry: (entry: Omit<VocabEntry, "id" | "createdAt">) => void;
  updateEntry: (entry: VocabEntry) => void;
  deleteEntry: (entryId: string) => void;
  refreshVocab: () => void;
}

const VocabContext = createContext<VocabContextValue | null>(null);

export function VocabProvider({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useProfile();
  const [categories, setCategories] = useState<VocabCategory[]>([]);
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshVocab = useCallback(() => {
    if (!activeProfile) {
      setCategories([]);
      setEntries([]);
      setIsLoading(false);
      return;
    }
    seedVocabCategories(activeProfile.id);
    setCategories(getVocabCategories(activeProfile.id));
    setEntries(getVocabEntries(activeProfile.id));
    setIsLoading(false);
  }, [activeProfile]);

  useEffect(() => {
    setIsLoading(true);
    refreshVocab();
  }, [refreshVocab]);

  useEffect(() => {
    const handler = () => refreshVocab();
    window.addEventListener("tcf-data-synced", handler);
    return () => window.removeEventListener("tcf-data-synced", handler);
  }, [refreshVocab]);

  const addCategory = useCallback(
    (name: string) => {
      if (!activeProfile) return;
      addVocabCategory(activeProfile.id, name);
      refreshVocab();
    },
    [activeProfile, refreshVocab]
  );

  const deleteCategory = useCallback(
    (categoryId: string) => {
      if (!activeProfile) return;
      deleteVocabCategory(activeProfile.id, categoryId);
      refreshVocab();
    },
    [activeProfile, refreshVocab]
  );

  const addEntry = useCallback(
    (entry: Omit<VocabEntry, "id" | "createdAt">) => {
      if (!activeProfile) return;
      addVocabEntry(activeProfile.id, entry);
      refreshVocab();
    },
    [activeProfile, refreshVocab]
  );

  const updateEntry = useCallback(
    (entry: VocabEntry) => {
      if (!activeProfile) return;
      updateVocabEntry(activeProfile.id, entry);
      refreshVocab();
    },
    [activeProfile, refreshVocab]
  );

  const deleteEntry = useCallback(
    (entryId: string) => {
      if (!activeProfile) return;
      deleteVocabEntry(activeProfile.id, entryId);
      refreshVocab();
    },
    [activeProfile, refreshVocab]
  );

  const value = useMemo(
    () => ({
      categories,
      entries,
      isLoading,
      addCategory,
      deleteCategory,
      addEntry,
      updateEntry,
      deleteEntry,
      refreshVocab,
    }),
    [
      categories,
      entries,
      isLoading,
      addCategory,
      deleteCategory,
      addEntry,
      updateEntry,
      deleteEntry,
      refreshVocab,
    ]
  );

  return (
    <VocabContext.Provider value={value}>{children}</VocabContext.Provider>
  );
}

export function useVocab() {
  const context = useContext(VocabContext);
  if (!context) {
    throw new Error("useVocab must be used within VocabProvider");
  }
  return context;
}
