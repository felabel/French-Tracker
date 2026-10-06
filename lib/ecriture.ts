import { EcritureEntry, EcritureTache } from "@/lib/types";

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function truncateText(text: string, maxLength = 80): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export const ECRITURE_TACHES: EcritureTache[] = ["T1", "T2", "T3", "mix"];

export const TACHE_LABELS: Record<EcritureTache, string> = {
  T1: "Tâche 1",
  T2: "Tâche 2",
  T3: "Tâche 3",
  mix: "Mix",
};

export function getTache(entry: EcritureEntry): EcritureTache {
  return entry.tache ?? "mix";
}
