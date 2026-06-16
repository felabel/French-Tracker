import {
  EcritureEntry,
  ListeningDailyEntry,
  ListeningWeeklyReview,
  Profile,
  ScoreEntry,
  SyncBlob,
  UserDataBundle,
  VocabCategory,
  VocabEntry,
} from "./types";
import {
  clearSyncId,
  getActiveUserId,
  getEcritures,
  getListeningDaily,
  getListeningWeekly,
  getProfiles,
  getScores,
  getVocabCategories,
  getVocabEntries,
  importSyncBlob,
  getLocalUpdatedAt,
  setLocalUpdatedAt,
  getSyncId,
  setActiveUserId,
  setSyncId,
} from "./storage";

const SYNC_API = "/api/sync";

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

export function buildSyncBlob(): SyncBlob {
  const profiles = getProfiles();
  const activeUserId = getActiveUserId();
  const data: Record<string, UserDataBundle> = {};

  for (const profile of profiles) {
    data[profile.id] = {
      scores: getScores(profile.id),
      ecritures: getEcritures(profile.id),
      vocabCategories: getVocabCategories(profile.id),
      vocabEntries: getVocabEntries(profile.id),
      listeningDaily: getListeningDaily(profile.id),
      listeningWeekly: getListeningWeekly(profile.id),
    };
  }

  return {
    version: 1,
    profiles,
    activeUserId,
    data,
    updatedAt: new Date().toISOString(),
  };
}

export function applySyncBlob(blob: SyncBlob): void {
  importSyncBlob(blob);
  setLocalUpdatedAt(blob.updatedAt);
}

function mergeEntries<T extends { id: string; createdAt: string; updatedAt?: string }>(
  local: T[],
  remote: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    const localTime = existing.updatedAt ?? existing.createdAt;
    const remoteTime = item.updatedAt ?? item.createdAt;
    if (remoteTime >= localTime) map.set(item.id, item);
  }
  return Array.from(map.values());
}

function mergeProfiles(local: Profile[], remote: Profile[]): Profile[] {
  const map = new Map<string, Profile>();
  for (const p of local) map.set(p.id, p);
  for (const p of remote) {
    if (!map.has(p.id)) map.set(p.id, p);
  }
  return Array.from(map.values());
}

export function mergeSyncBlobs(local: SyncBlob, remote: SyncBlob): SyncBlob {
  const profiles = mergeProfiles(local.profiles, remote.profiles);
  const allIds = Array.from(
    new Set([
      ...Object.keys(local.data),
      ...Object.keys(remote.data),
      ...profiles.map((p) => p.id),
    ])
  );

  const data: Record<string, UserDataBundle> = {};
  for (const userId of allIds) {
    const l = local.data[userId] ?? emptyBundle();
    const r = remote.data[userId] ?? emptyBundle();
    data[userId] = {
      scores: mergeEntries(l.scores, r.scores) as ScoreEntry[],
      ecritures: mergeEntries(l.ecritures, r.ecritures) as EcritureEntry[],
      vocabCategories: mergeEntries(
        l.vocabCategories,
        r.vocabCategories
      ) as VocabCategory[],
      vocabEntries: mergeEntries(l.vocabEntries, r.vocabEntries) as VocabEntry[],
      listeningDaily: mergeEntries(
        l.listeningDaily ?? [],
        r.listeningDaily ?? []
      ) as ListeningDailyEntry[],
      listeningWeekly: mergeEntries(
        l.listeningWeekly ?? [],
        r.listeningWeekly ?? []
      ) as ListeningWeeklyReview[],
    };
  }

  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  return {
    version: 1,
    profiles,
    activeUserId:
      remoteTime >= localTime ? remote.activeUserId : local.activeUserId,
    data,
    updatedAt: new Date(Math.max(localTime, remoteTime)).toISOString(),
  };
}

function emptyBundle(): UserDataBundle {
  return {
    scores: [],
    ecritures: [],
    vocabCategories: [],
    vocabEntries: [],
    listeningDaily: [],
    listeningWeekly: [],
  };
}

export async function restoreFromSyncId(syncId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const trimmed = syncId.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter your Sync ID." };
  }

  setSyncId(trimmed);

  try {
    const remote = await pullFromCloud(trimmed);

    if (!remote || remote.profiles.length === 0) {
      clearSyncId();
      return {
        ok: false,
        error:
          "No data found for this Sync ID. Check the spelling or create a new tracker.",
      };
    }

    applySyncBlob(remote);

    if (!getActiveUserId()) {
      const activeId =
        remote.activeUserId &&
        remote.profiles.some((p) => p.id === remote.activeUserId)
          ? remote.activeUserId
          : remote.profiles[0].id;
      setActiveUserId(activeId);
    }

    window.dispatchEvent(new Event("tcf-data-synced"));
    return { ok: true };
  } catch {
    clearSyncId();
    return {
      ok: false,
      error: "Could not reach cloud sync. Check your connection and try again.",
    };
  }
}

export async function pullFromCloud(syncId: string): Promise<SyncBlob | null> {
  const res = await fetch(`${SYNC_API}?syncId=${encodeURIComponent(syncId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to pull sync data");
  return res.json() as Promise<SyncBlob>;
}

export async function pushToCloud(
  syncId: string,
  blob: SyncBlob
): Promise<SyncBlob> {
  const res = await fetch(SYNC_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ syncId, blob }),
  });
  if (!res.ok) throw new Error("Failed to push sync data");
  return res.json() as Promise<SyncBlob>;
}

export async function syncWithCloud(): Promise<{
  status: SyncStatus;
  message?: string;
}> {
  const syncId = getSyncId();
  if (!syncId) return { status: "idle" };

  try {
    const local = buildSyncBlob();
    const remote = await pullFromCloud(syncId);

    if (!remote) {
      await pushToCloud(syncId, local);
      setLocalUpdatedAt(local.updatedAt);
      return { status: "synced", message: "Initial cloud backup created." };
    }

    const localTime = new Date(getLocalUpdatedAt() || 0).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();

    let merged: SyncBlob;
    if (Math.abs(localTime - remoteTime) < 2000) {
      merged = remoteTime >= localTime ? remote : local;
    } else {
      merged = mergeSyncBlobs(local, remote);
    }

    applySyncBlob(merged);
    await pushToCloud(syncId, merged);

    return { status: "synced" };
  } catch {
    return { status: "offline", message: "Could not reach cloud sync." };
  }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export function onDataChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function scheduleSyncPush(): void {
  const syncId = getSyncId();
  if (!syncId) return;

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const blob = buildSyncBlob();
      blob.updatedAt = new Date().toISOString();
      await pushToCloud(syncId, blob);
      setLocalUpdatedAt(blob.updatedAt);
      listeners.forEach((l) => l());
    } catch {
      // silent fail — will retry on next change or manual sync
    }
  }, 2000);
}
