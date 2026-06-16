import {
  EcritureEntry,
  ListeningDailyEntry,
  ListeningWeeklyReview,
  Profile,
  ScoreEntry,
  SyncBlob,
  UserDataBundle,
  UserExportData,
  VocabCategory,
  VocabEntry,
} from "./types";
import { createDefaultCategories } from "./vocab-defaults";

const SCHEMA_VERSION = 1;
const PROFILES_KEY = "tcf_profiles";
const ACTIVE_USER_KEY = "tcf_active_user";
const SCHEMA_KEY = "tcf_schema_version";
const SYNC_ID_KEY = "tcf_sync_id";
const LOCAL_UPDATED_KEY = "tcf_local_updated_at";

function scoresKey(userId: string): string {
  return `tcf_scores_${userId}`;
}

function ecrituresKey(userId: string): string {
  return `tcf_ecritures_${userId}`;
}

function vocabCategoriesKey(userId: string): string {
  return `tcf_vocab_categories_${userId}`;
}

function vocabEntriesKey(userId: string): string {
  return `tcf_vocab_entries_${userId}`;
}

function listeningDailyKey(userId: string): string {
  return `tcf_listening_daily_${userId}`;
}

function listeningWeeklyKey(userId: string): string {
  return `tcf_listening_weekly_${userId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeItem(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
    touchLocalUpdated();
  } catch (error) {
    console.error("localStorage write failed:", error);
    throw new Error("Could not save data. Storage may be full.");
  }
}

function removeItem(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
    touchLocalUpdated();
  } catch {
    // ignore
  }
}

function touchLocalUpdated(): void {
  if (!isBrowser()) return;
  localStorage.setItem(LOCAL_UPDATED_KEY, new Date().toISOString());
}

function notifyChange(): void {
  if (!isBrowser()) return;
  import("./sync").then(({ scheduleSyncPush }) => scheduleSyncPush());
}

function writeAndNotify(key: string, value: unknown): void {
  writeItem(key, value);
  notifyChange();
}

export function getSyncId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(SYNC_ID_KEY);
}

export function setSyncId(syncId: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(SYNC_ID_KEY, syncId.trim());
  window.dispatchEvent(new Event("tcf-sync-id-changed"));
}

export function clearSyncId(): void {
  removeItem(SYNC_ID_KEY);
}

export function getLocalUpdatedAt(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LOCAL_UPDATED_KEY);
}

export function setLocalUpdatedAt(iso: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(LOCAL_UPDATED_KEY, iso);
}

export function generateSyncId(): string {
  const slug = crypto.randomUUID().slice(0, 8);
  return `tcf-${slug}`;
}

export function getProfiles(): Profile[] {
  return readItem<Profile[]>(PROFILES_KEY, []);
}

export function saveProfiles(profiles: Profile[]): void {
  writeAndNotify(PROFILES_KEY, profiles);
}

export function getActiveUserId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACTIVE_USER_KEY);
}

export function setActiveUserId(userId: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACTIVE_USER_KEY, userId);
  touchLocalUpdated();
  notifyChange();
}

export function createProfile(displayName: string): Profile {
  const profile: Profile = {
    id: crypto.randomUUID(),
    displayName: displayName.trim(),
    createdAt: new Date().toISOString(),
  };

  const profiles = getProfiles();
  profiles.push(profile);
  saveProfiles(profiles);
  setActiveUserId(profile.id);
  writeAndNotify(scoresKey(profile.id), []);
  writeAndNotify(ecrituresKey(profile.id), []);
  writeAndNotify(listeningDailyKey(profile.id), []);
  writeAndNotify(listeningWeeklyKey(profile.id), []);
  seedVocabCategories(profile.id);
  return profile;
}

export function updateProfile(profile: Profile): void {
  const profiles = getProfiles().map((p) =>
    p.id === profile.id ? profile : p
  );
  saveProfiles(profiles);
}

export function deleteProfile(userId: string): void {
  const profiles = getProfiles().filter((p) => p.id !== userId);
  saveProfiles(profiles);
  removeItem(scoresKey(userId));
  removeItem(ecrituresKey(userId));
  removeItem(vocabCategoriesKey(userId));
  removeItem(vocabEntriesKey(userId));
  removeItem(listeningDailyKey(userId));
  removeItem(listeningWeeklyKey(userId));

  const activeId = getActiveUserId();
  if (activeId === userId) {
    if (profiles.length > 0) {
      setActiveUserId(profiles[0].id);
    } else {
      removeItem(ACTIVE_USER_KEY);
    }
  }
}

export function getScores(userId: string): ScoreEntry[] {
  return readItem<ScoreEntry[]>(scoresKey(userId), []);
}

export function saveScores(userId: string, scores: ScoreEntry[]): void {
  writeAndNotify(scoresKey(userId), scores);
}

export function addScoreEntries(
  userId: string,
  entries: Omit<ScoreEntry, "id" | "createdAt" | "maxScore">[]
): ScoreEntry[] {
  const existing = getScores(userId);
  const newEntries: ScoreEntry[] = entries.map((e) => ({
    ...e,
    id: crypto.randomUUID(),
    maxScore: 699,
    createdAt: new Date().toISOString(),
  }));
  const updated = [...existing, ...newEntries];
  saveScores(userId, updated);
  return newEntries;
}

export function updateScoreEntry(userId: string, entry: ScoreEntry): void {
  const scores = getScores(userId).map((s) =>
    s.id === entry.id ? entry : s
  );
  saveScores(userId, scores);
}

export function deleteScoreEntry(userId: string, entryId: string): void {
  const scores = getScores(userId).filter((s) => s.id !== entryId);
  saveScores(userId, scores);
}

export function getEcritures(userId: string): EcritureEntry[] {
  return readItem<EcritureEntry[]>(ecrituresKey(userId), []);
}

export function saveEcritures(userId: string, ecritures: EcritureEntry[]): void {
  writeAndNotify(ecrituresKey(userId), ecritures);
}

export function addEcriture(
  userId: string,
  entry: Omit<EcritureEntry, "id" | "createdAt">
): EcritureEntry {
  const existing = getEcritures(userId);
  const newEntry: EcritureEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveEcritures(userId, [...existing, newEntry]);
  return newEntry;
}

export function updateEcriture(userId: string, entry: EcritureEntry): void {
  const ecritures = getEcritures(userId).map((e) =>
    e.id === entry.id
      ? { ...entry, updatedAt: new Date().toISOString() }
      : e
  );
  saveEcritures(userId, ecritures);
}

export function deleteEcriture(userId: string, entryId: string): void {
  const ecritures = getEcritures(userId).filter((e) => e.id !== entryId);
  saveEcritures(userId, ecritures);
}

export function getVocabCategories(userId: string): VocabCategory[] {
  return readItem<VocabCategory[]>(vocabCategoriesKey(userId), []);
}

export function saveVocabCategories(
  userId: string,
  categories: VocabCategory[]
): void {
  writeAndNotify(vocabCategoriesKey(userId), categories);
}

export function seedVocabCategories(userId: string): VocabCategory[] {
  const existing = getVocabCategories(userId);
  if (existing.length > 0) return existing;
  const defaults = createDefaultCategories();
  saveVocabCategories(userId, defaults);
  return defaults;
}

export function addVocabCategory(
  userId: string,
  name: string
): VocabCategory {
  const categories = getVocabCategories(userId);
  const category: VocabCategory = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  saveVocabCategories(userId, [...categories, category]);
  return category;
}

export function deleteVocabCategory(userId: string, categoryId: string): void {
  const categories = getVocabCategories(userId).filter(
    (c) => c.id !== categoryId
  );
  saveVocabCategories(userId, categories);
  const entries = getVocabEntries(userId).filter(
    (e) => e.categoryId !== categoryId
  );
  saveVocabEntries(userId, entries);
}

export function getVocabEntries(userId: string): VocabEntry[] {
  return readItem<VocabEntry[]>(vocabEntriesKey(userId), []);
}

export function saveVocabEntries(userId: string, entries: VocabEntry[]): void {
  writeAndNotify(vocabEntriesKey(userId), entries);
}

export function addVocabEntry(
  userId: string,
  entry: Omit<VocabEntry, "id" | "createdAt">
): VocabEntry {
  const existing = getVocabEntries(userId);
  const newEntry: VocabEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveVocabEntries(userId, [...existing, newEntry]);
  return newEntry;
}

export function updateVocabEntry(userId: string, entry: VocabEntry): void {
  const entries = getVocabEntries(userId).map((e) =>
    e.id === entry.id
      ? { ...entry, updatedAt: new Date().toISOString() }
      : e
  );
  saveVocabEntries(userId, entries);
}

export function deleteVocabEntry(userId: string, entryId: string): void {
  const entries = getVocabEntries(userId).filter((e) => e.id !== entryId);
  saveVocabEntries(userId, entries);
}

export function getListeningDaily(userId: string): ListeningDailyEntry[] {
  return readItem<ListeningDailyEntry[]>(listeningDailyKey(userId), []);
}

export function saveListeningDaily(
  userId: string,
  entries: ListeningDailyEntry[]
): void {
  writeAndNotify(listeningDailyKey(userId), entries);
}

export function upsertListeningDaily(
  userId: string,
  entry: Omit<ListeningDailyEntry, "id" | "createdAt" | "updatedAt">
): ListeningDailyEntry {
  const existing = getListeningDaily(userId);
  const match = existing.find((e) => e.date === entry.date);
  if (match) {
    const updated: ListeningDailyEntry = {
      ...match,
      ...entry,
      updatedAt: new Date().toISOString(),
    };
    saveListeningDaily(
      userId,
      existing.map((e) => (e.id === match.id ? updated : e))
    );
    return updated;
  }
  const newEntry: ListeningDailyEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveListeningDaily(userId, [...existing, newEntry]);
  return newEntry;
}

export function updateListeningDaily(
  userId: string,
  entry: ListeningDailyEntry
): void {
  const entries = getListeningDaily(userId).map((e) =>
    e.id === entry.id
      ? { ...entry, updatedAt: new Date().toISOString() }
      : e
  );
  saveListeningDaily(userId, entries);
}

export function deleteListeningDaily(userId: string, entryId: string): void {
  const entries = getListeningDaily(userId).filter((e) => e.id !== entryId);
  saveListeningDaily(userId, entries);
}

export function getListeningWeekly(userId: string): ListeningWeeklyReview[] {
  return readItem<ListeningWeeklyReview[]>(listeningWeeklyKey(userId), []);
}

export function saveListeningWeekly(
  userId: string,
  reviews: ListeningWeeklyReview[]
): void {
  writeAndNotify(listeningWeeklyKey(userId), reviews);
}

export function upsertListeningWeekly(
  userId: string,
  review: Omit<ListeningWeeklyReview, "id" | "createdAt" | "updatedAt">
): ListeningWeeklyReview {
  const existing = getListeningWeekly(userId);
  const match = existing.find((r) => r.weekEnding === review.weekEnding);
  if (match) {
    const updated: ListeningWeeklyReview = {
      ...match,
      ...review,
      updatedAt: new Date().toISOString(),
    };
    saveListeningWeekly(
      userId,
      existing.map((r) => (r.id === match.id ? updated : r))
    );
    return updated;
  }
  const newReview: ListeningWeeklyReview = {
    ...review,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveListeningWeekly(userId, [...existing, newReview]);
  return newReview;
}

export function updateListeningWeekly(
  userId: string,
  review: ListeningWeeklyReview
): void {
  const reviews = getListeningWeekly(userId).map((r) =>
    r.id === review.id
      ? { ...review, updatedAt: new Date().toISOString() }
      : r
  );
  saveListeningWeekly(userId, reviews);
}

export function deleteListeningWeekly(userId: string, reviewId: string): void {
  const reviews = getListeningWeekly(userId).filter((r) => r.id !== reviewId);
  saveListeningWeekly(userId, reviews);
}

export function importSyncBlob(blob: SyncBlob): void {
  if (!isBrowser()) return;

  writeItem(PROFILES_KEY, blob.profiles);
  if (blob.activeUserId) {
    localStorage.setItem(ACTIVE_USER_KEY, blob.activeUserId);
  }

  for (const [userId, bundle] of Object.entries(blob.data)) {
    writeItem(scoresKey(userId), bundle.scores);
    writeItem(ecrituresKey(userId), bundle.ecritures);
    writeItem(vocabCategoriesKey(userId), bundle.vocabCategories);
    writeItem(vocabEntriesKey(userId), bundle.vocabEntries);
    writeItem(listeningDailyKey(userId), bundle.listeningDaily ?? []);
    writeItem(listeningWeeklyKey(userId), bundle.listeningWeekly ?? []);
  }

  setLocalUpdatedAt(blob.updatedAt);
}

export function exportUserData(userId: string): UserExportData | null {
  const profile = getProfiles().find((p) => p.id === userId);
  if (!profile) return null;
  return {
    profile,
    scores: getScores(userId),
    ecritures: getEcritures(userId),
    vocabCategories: getVocabCategories(userId),
    vocabEntries: getVocabEntries(userId),
    listeningDaily: getListeningDaily(userId),
    listeningWeekly: getListeningWeekly(userId),
    exportedAt: new Date().toISOString(),
  };
}

export function importUserData(data: UserExportData): Profile {
  const profiles = getProfiles();
  const existing = profiles.find((p) => p.id === data.profile.id);

  const apply = () => {
    saveScores(data.profile.id, data.scores);
    saveEcritures(data.profile.id, data.ecritures ?? []);
    saveVocabCategories(data.profile.id, data.vocabCategories ?? []);
    saveVocabEntries(data.profile.id, data.vocabEntries ?? []);
    saveListeningDaily(data.profile.id, data.listeningDaily ?? []);
    saveListeningWeekly(data.profile.id, data.listeningWeekly ?? []);
    setActiveUserId(data.profile.id);
  };

  if (existing) {
    const updated = profiles.map((p) =>
      p.id === data.profile.id ? data.profile : p
    );
    saveProfiles(updated);
    apply();
    return data.profile;
  }

  profiles.push(data.profile);
  saveProfiles(profiles);
  apply();
  if (!getVocabCategories(data.profile.id).length) {
    seedVocabCategories(data.profile.id);
  }
  return data.profile;
}
