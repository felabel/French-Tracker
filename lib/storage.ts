import { EcritureEntry, Profile, ScoreEntry, UserExportData } from "./types";

const SCHEMA_VERSION = 1;
const PROFILES_KEY = "tcf_profiles";
const ACTIVE_USER_KEY = "tcf_active_user";
const SCHEMA_KEY = "tcf_schema_version";

function scoresKey(userId: string): string {
  return `tcf_scores_${userId}`;
}

function ecrituresKey(userId: string): string {
  return `tcf_ecritures_${userId}`;
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
  } catch (error) {
    console.error("localStorage write failed:", error);
    throw new Error("Could not save data. Storage may be full.");
  }
}

function removeItem(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getProfiles(): Profile[] {
  return readItem<Profile[]>(PROFILES_KEY, []);
}

export function saveProfiles(profiles: Profile[]): void {
  writeItem(PROFILES_KEY, profiles);
}

export function getActiveUserId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACTIVE_USER_KEY);
}

export function setActiveUserId(userId: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACTIVE_USER_KEY, userId);
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
  writeItem(scoresKey(profile.id), []);
  writeItem(ecrituresKey(profile.id), []);
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
  writeItem(scoresKey(userId), scores);
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

export function updateScoreEntry(
  userId: string,
  entry: ScoreEntry
): void {
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
  writeItem(ecrituresKey(userId), ecritures);
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

export function updateEcriture(
  userId: string,
  entry: EcritureEntry
): void {
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

export function exportUserData(userId: string): UserExportData | null {
  const profile = getProfiles().find((p) => p.id === userId);
  if (!profile) return null;
  return {
    profile,
    scores: getScores(userId),
    ecritures: getEcritures(userId),
    exportedAt: new Date().toISOString(),
  };
}

export function importUserData(data: UserExportData): Profile {
  const profiles = getProfiles();
  const existing = profiles.find((p) => p.id === data.profile.id);

  if (existing) {
    const updated = profiles.map((p) =>
      p.id === data.profile.id ? data.profile : p
    );
    saveProfiles(updated);
    saveScores(data.profile.id, data.scores);
    saveEcritures(data.profile.id, data.ecritures ?? []);
    setActiveUserId(data.profile.id);
    return data.profile;
  }

  profiles.push(data.profile);
  saveProfiles(profiles);
  saveScores(data.profile.id, data.scores);
  saveEcritures(data.profile.id, data.ecritures ?? []);
  setActiveUserId(data.profile.id);
  return data.profile;
}
