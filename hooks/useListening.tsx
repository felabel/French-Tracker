"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ListeningDailyEntry, ListeningWeeklyReview } from "@/lib/types";
import {
  deleteListeningDaily,
  deleteListeningWeekly,
  getListeningDaily,
  getListeningWeekly,
  saveListeningDaily,
  saveListeningWeekly,
  updateListeningDaily,
  updateListeningWeekly,
  upsertListeningDaily,
  upsertListeningWeekly,
} from "@/lib/storage";
import { useProfile } from "./useProfile";

interface ListeningContextValue {
  listeningDaily: ListeningDailyEntry[];
  listeningWeekly: ListeningWeeklyReview[];
  isLoading: boolean;
  upsertDailyEntry: (
    entry: Omit<ListeningDailyEntry, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateDailyEntry: (entry: ListeningDailyEntry) => void;
  deleteDailyEntry: (entryId: string) => void;
  upsertWeeklyReview: (
    review: Omit<ListeningWeeklyReview, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateWeeklyReview: (review: ListeningWeeklyReview) => void;
  deleteWeeklyReview: (reviewId: string) => void;
  replaceAllDaily: (entries: ListeningDailyEntry[]) => void;
  replaceAllWeekly: (reviews: ListeningWeeklyReview[]) => void;
  refreshListening: () => void;
}

const ListeningContext = createContext<ListeningContextValue | null>(null);

export function ListeningProvider({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useProfile();
  const [listeningDaily, setListeningDaily] = useState<ListeningDailyEntry[]>(
    []
  );
  const [listeningWeekly, setListeningWeekly] = useState<
    ListeningWeeklyReview[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshListening = useCallback(() => {
    if (!activeProfile) {
      setListeningDaily([]);
      setListeningWeekly([]);
      setIsLoading(false);
      return;
    }
    setListeningDaily(getListeningDaily(activeProfile.id));
    setListeningWeekly(getListeningWeekly(activeProfile.id));
    setIsLoading(false);
  }, [activeProfile]);

  useEffect(() => {
    setIsLoading(true);
    refreshListening();
  }, [refreshListening]);

  useEffect(() => {
    const handler = () => refreshListening();
    window.addEventListener("tcf-data-synced", handler);
    return () => window.removeEventListener("tcf-data-synced", handler);
  }, [refreshListening]);

  const upsertDailyEntry = useCallback(
    (entry: Omit<ListeningDailyEntry, "id" | "createdAt" | "updatedAt">) => {
      if (!activeProfile) return;
      upsertListeningDaily(activeProfile.id, entry);
      refreshListening();
    },
    [activeProfile, refreshListening]
  );

  const updateDailyEntry = useCallback(
    (entry: ListeningDailyEntry) => {
      if (!activeProfile) return;
      updateListeningDaily(activeProfile.id, entry);
      refreshListening();
    },
    [activeProfile, refreshListening]
  );

  const deleteDailyEntry = useCallback(
    (entryId: string) => {
      if (!activeProfile) return;
      deleteListeningDaily(activeProfile.id, entryId);
      refreshListening();
    },
    [activeProfile, refreshListening]
  );

  const upsertWeeklyReview = useCallback(
    (
      review: Omit<ListeningWeeklyReview, "id" | "createdAt" | "updatedAt">
    ) => {
      if (!activeProfile) return;
      upsertListeningWeekly(activeProfile.id, review);
      refreshListening();
    },
    [activeProfile, refreshListening]
  );

  const updateWeeklyReview = useCallback(
    (review: ListeningWeeklyReview) => {
      if (!activeProfile) return;
      updateListeningWeekly(activeProfile.id, review);
      refreshListening();
    },
    [activeProfile, refreshListening]
  );

  const deleteWeeklyReview = useCallback(
    (reviewId: string) => {
      if (!activeProfile) return;
      deleteListeningWeekly(activeProfile.id, reviewId);
      refreshListening();
    },
    [activeProfile, refreshListening]
  );

  const replaceAllDaily = useCallback(
    (entries: ListeningDailyEntry[]) => {
      if (!activeProfile) return;
      saveListeningDaily(activeProfile.id, entries);
      refreshListening();
    },
    [activeProfile, refreshListening]
  );

  const replaceAllWeekly = useCallback(
    (reviews: ListeningWeeklyReview[]) => {
      if (!activeProfile) return;
      saveListeningWeekly(activeProfile.id, reviews);
      refreshListening();
    },
    [activeProfile, refreshListening]
  );

  const value = useMemo(
    () => ({
      listeningDaily,
      listeningWeekly,
      isLoading,
      upsertDailyEntry,
      updateDailyEntry,
      deleteDailyEntry,
      upsertWeeklyReview,
      updateWeeklyReview,
      deleteWeeklyReview,
      replaceAllDaily,
      replaceAllWeekly,
      refreshListening,
    }),
    [
      listeningDaily,
      listeningWeekly,
      isLoading,
      upsertDailyEntry,
      updateDailyEntry,
      deleteDailyEntry,
      upsertWeeklyReview,
      updateWeeklyReview,
      deleteWeeklyReview,
      replaceAllDaily,
      replaceAllWeekly,
      refreshListening,
    ]
  );

  return (
    <ListeningContext.Provider value={value}>
      {children}
    </ListeningContext.Provider>
  );
}

export function useListening() {
  const context = useContext(ListeningContext);
  if (!context) {
    throw new Error("useListening must be used within ListeningProvider");
  }
  return context;
}
