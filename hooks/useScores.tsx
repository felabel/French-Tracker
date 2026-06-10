"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ScoreEntry } from "@/lib/types";
import {
  addScoreEntries,
  deleteScoreEntry,
  getScores,
  saveScores,
  updateScoreEntry,
} from "@/lib/storage";
import { useProfile } from "./useProfile";

interface ScoresContextValue {
  scores: ScoreEntry[];
  isLoading: boolean;
  addEntries: (
    entries: Omit<ScoreEntry, "id" | "createdAt" | "maxScore">[]
  ) => void;
  updateEntry: (entry: ScoreEntry) => void;
  deleteEntry: (entryId: string) => void;
  replaceAll: (entries: ScoreEntry[]) => void;
  refreshScores: () => void;
}

const ScoresContext = createContext<ScoresContextValue | null>(null);

export function ScoresProvider({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useProfile();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshScores = useCallback(() => {
    if (!activeProfile) {
      setScores([]);
      setIsLoading(false);
      return;
    }
    setScores(getScores(activeProfile.id));
    setIsLoading(false);
  }, [activeProfile]);

  useEffect(() => {
    setIsLoading(true);
    refreshScores();
  }, [refreshScores]);

  const addEntries = useCallback(
    (entries: Omit<ScoreEntry, "id" | "createdAt" | "maxScore">[]) => {
      if (!activeProfile) return;
      addScoreEntries(activeProfile.id, entries);
      refreshScores();
    },
    [activeProfile, refreshScores]
  );

  const updateEntry = useCallback(
    (entry: ScoreEntry) => {
      if (!activeProfile) return;
      updateScoreEntry(activeProfile.id, entry);
      refreshScores();
    },
    [activeProfile, refreshScores]
  );

  const deleteEntry = useCallback(
    (entryId: string) => {
      if (!activeProfile) return;
      deleteScoreEntry(activeProfile.id, entryId);
      refreshScores();
    },
    [activeProfile, refreshScores]
  );

  const replaceAll = useCallback(
    (entries: ScoreEntry[]) => {
      if (!activeProfile) return;
      saveScores(activeProfile.id, entries);
      refreshScores();
    },
    [activeProfile, refreshScores]
  );

  const value = useMemo(
    () => ({
      scores,
      isLoading,
      addEntries,
      updateEntry,
      deleteEntry,
      replaceAll,
      refreshScores,
    }),
    [
      scores,
      isLoading,
      addEntries,
      updateEntry,
      deleteEntry,
      replaceAll,
      refreshScores,
    ]
  );

  return (
    <ScoresContext.Provider value={value}>{children}</ScoresContext.Provider>
  );
}

export function useScores() {
  const context = useContext(ScoresContext);
  if (!context) {
    throw new Error("useScores must be used within ScoresProvider");
  }
  return context;
}
