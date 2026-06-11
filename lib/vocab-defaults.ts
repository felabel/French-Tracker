import { VocabCategory } from "./types";

export const DEFAULT_VOCAB_CATEGORIES: Omit<
  VocabCategory,
  "id" | "createdAt"
>[] = [
  { name: "Connecteurs logiques", isDefault: true },
  { name: "Verbes et expressions utiles", isDefault: true },
  { name: "Formules d'opinion", isDefault: true },
  { name: "Vocabulaire — travail", isDefault: true },
  { name: "Vocabulaire — immigration & vie quotidienne", isDefault: true },
  { name: "Vocabulaire — loisirs & culture", isDefault: true },
  { name: "Faux amis", isDefault: true },
  { name: "Mots de liaison (CE)", isDefault: true },
];

export function createDefaultCategories(): VocabCategory[] {
  return DEFAULT_VOCAB_CATEGORIES.map((cat) => ({
    ...cat,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }));
}
