"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import {
  generateSyncId,
  getSyncId,
  setSyncId,
} from "@/lib/storage";
import { restoreFromSyncId, syncWithCloud } from "@/lib/sync";

const SYNC_PROMPT_KEY = "tcf_sync_id_saved";

type GateMode = "connect" | "create";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { activeProfile, profiles, isReady, createProfile, switchProfile, refreshProfiles } =
    useProfile();

  const [mode, setMode] = useState<GateMode>("connect");
  const [syncIdInput, setSyncIdInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoConnecting, setAutoConnecting] = useState(false);

  const tryAutoConnect = useCallback(async () => {
    const existingSyncId = getSyncId();
    if (!existingSyncId || activeProfile) return;

    setAutoConnecting(true);
    try {
      const result = await restoreFromSyncId(existingSyncId);
      if (result.ok) {
        refreshProfiles();
        window.dispatchEvent(new Event("tcf-data-synced"));
      }
    } catch {
      // User can connect manually
    } finally {
      setAutoConnecting(false);
    }
  }, [activeProfile, refreshProfiles]);

  useEffect(() => {
    if (!isReady || activeProfile) return;
    const existingSyncId = getSyncId();
    if (existingSyncId) {
      setSyncIdInput(existingSyncId);
      tryAutoConnect();
    }
  }, [isReady, activeProfile, tryAutoConnect]);

  if (!isReady || autoConnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {autoConnecting ? "Restoring your data…" : "Loading…"}
        </div>
      </div>
    );
  }

  if (activeProfile) {
    return <>{children}</>;
  }

  const handleConnect = async () => {
    const trimmed = syncIdInput.trim();
    if (!trimmed) {
      setError("Enter your Sync ID.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await restoreFromSyncId(trimmed);
      if (!result.ok) {
        setError(result.error ?? "Could not connect.");
        return;
      }
      refreshProfiles();
      window.dispatchEvent(new Event("tcf-data-synced"));
    } catch {
      setError("Could not reach cloud sync. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const trimmedName = displayName.trim() || "My Tracker";
    setLoading(true);
    setError("");

    try {
      const newSyncId = generateSyncId();
      setSyncId(newSyncId);
      createProfile(trimmedName);
      refreshProfiles();

      await syncWithCloud();
      localStorage.removeItem(SYNC_PROMPT_KEY);
      window.dispatchEvent(new Event("tcf-sync-id-changed"));
      window.dispatchEvent(new Event("tcf-data-synced"));
      refreshProfiles();
    } catch {
      setError("Created locally but cloud backup failed. Save your Sync ID from Settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>TCF Canada Tracker</CardTitle>
          <CardDescription>
            Use your Sync ID to open your tracker on any device — no duplicate
            profiles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.length > 0 && (
            <div className="space-y-2">
              <Label>Continue on this device</Label>
              <div className="flex flex-col gap-2">
                {profiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => switchProfile(profile.id)}
                  >
                    {profile.displayName}
                  </Button>
                ))}
              </div>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "connect" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => {
                setMode("connect");
                setError("");
              }}
            >
              <KeyRound className="mr-1.5 h-4 w-4" />
              I have a Sync ID
            </Button>
            <Button
              type="button"
              variant={mode === "create" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => {
                setMode("create");
                setError("");
              }}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              New tracker
            </Button>
          </div>

          {mode === "connect" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="sync-id">Sync ID</Label>
                <Input
                  id="sync-id"
                  placeholder="e.g. tcf-a3f9b2c1"
                  value={syncIdInput}
                  onChange={(e) => {
                    setSyncIdInput(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  Same ID you saved when you first set up the tracker, or from
                  another device.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleConnect}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  "Connect & sync"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name (optional)</Label>
                <Input
                  id="display-name"
                  placeholder="e.g. Felicity"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <p className="text-xs text-muted-foreground">
                  A new Sync ID will be generated. Copy it from the top bar and
                  keep it safe — you&apos;ll need it on every device.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create tracker"
                )}
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export { SYNC_PROMPT_KEY };
