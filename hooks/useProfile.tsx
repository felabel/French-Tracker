"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Profile } from "@/lib/types";
import {
  createProfile as createProfileStorage,
  deleteProfile as deleteProfileStorage,
  getActiveUserId,
  getProfiles,
  setActiveUserId,
  updateProfile,
} from "@/lib/storage";

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  isReady: boolean;
  createProfile: (displayName: string) => Profile;
  switchProfile: (userId: string) => void;
  updateActiveProfile: (profile: Profile) => void;
  deleteProfile: (userId: string) => void;
  refreshProfiles: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshProfiles = useCallback(() => {
    const loaded = getProfiles();
    const activeId = getActiveUserId();
    setProfiles(loaded);
    setActiveProfile(
      activeId ? loaded.find((p) => p.id === activeId) ?? null : null
    );
    setIsReady(true);
  }, []);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const createProfile = useCallback(
    (displayName: string) => {
      const profile = createProfileStorage(displayName);
      refreshProfiles();
      return profile;
    },
    [refreshProfiles]
  );

  const switchProfile = useCallback(
    (userId: string) => {
      setActiveUserId(userId);
      refreshProfiles();
    },
    [refreshProfiles]
  );

  const updateActiveProfile = useCallback(
    (profile: Profile) => {
      updateProfile(profile);
      refreshProfiles();
    },
    [refreshProfiles]
  );

  const deleteProfile = useCallback(
    (userId: string) => {
      deleteProfileStorage(userId);
      refreshProfiles();
    },
    [refreshProfiles]
  );

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      isReady,
      createProfile,
      switchProfile,
      updateActiveProfile,
      deleteProfile,
      refreshProfiles,
    }),
    [
      profiles,
      activeProfile,
      isReady,
      createProfile,
      switchProfile,
      updateActiveProfile,
      deleteProfile,
      refreshProfiles,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}
