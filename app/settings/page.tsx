"use client";

import { useRef, useState, useEffect } from "react";
import { Download, Upload, Trash2, UserPlus, Cloud, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from "@/hooks/useProfile";
import { useScores } from "@/hooks/useScores";
import { useEcritures } from "@/hooks/useEcritures";
import { useVocab } from "@/hooks/useVocab";
import { useSync } from "@/hooks/useSync";
import {
  exportUserData,
  importUserData,
  getSyncId,
  setSyncId,
  clearSyncId,
  generateSyncId,
} from "@/lib/storage";
import { ALL_SECTIONS, CefrLevel, NclcLevel, UserExportData } from "@/lib/types";
import { ALL_NCLC_LEVELS, getMinScoreForNclc } from "@/lib/nclc";
import { CEFR_TARGETS, SECTION_LABELS } from "@/lib/tcf";

export default function SettingsPage() {
  const {
    profiles,
    activeProfile,
    createProfile,
    switchProfile,
    deleteProfile,
    updateActiveProfile,
  } = useProfile();
  const { refreshScores } = useScores();
  const { refreshEcritures } = useEcritures();
  const { refreshVocab } = useVocab();
  const { syncNow, status: syncStatus, lastSynced } = useSync();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [syncIdInput, setSyncIdInput] = useState("");
  const [newProfileName, setNewProfileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSyncIdInput(getSyncId() ?? "");
  }, []);

  const handleSaveSyncId = () => {
    const trimmed = syncIdInput.trim();
    if (!trimmed) {
      setError("Enter a Sync ID or generate one.");
      return;
    }
    setSyncId(trimmed);
    setMessage(`Sync ID set to "${trimmed}". Syncing now…`);
    setError("");
    window.dispatchEvent(new Event("tcf-sync-id-changed"));
    syncNow();
  };

  const handleGenerateSyncId = () => {
    const id = generateSyncId();
    setSyncIdInput(id);
    setSyncId(id);
    setMessage(`Generated Sync ID: ${id}. Use this on all your devices.`);
    setError("");
    window.dispatchEvent(new Event("tcf-sync-id-changed"));
    syncNow();
  };

  const handleClearSyncId = () => {
    clearSyncId();
    setSyncIdInput("");
    setMessage("Cloud sync disabled.");
  };

  const handleCreateProfile = () => {
    const trimmed = newProfileName.trim();
    if (!trimmed) {
      setError("Enter a profile name.");
      return;
    }
    createProfile(trimmed);
    setNewProfileName("");
    setMessage(`Profile "${trimmed}" created.`);
    setError("");
  };

  const handleExport = () => {
    if (!activeProfile) return;
    const data = exportUserData(activeProfile.id);
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tcf-tracker-${activeProfile.displayName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Data exported successfully.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as UserExportData;
        if (!data.profile || !Array.isArray(data.scores)) {
          throw new Error("Invalid file format.");
        }
        importUserData(data);
        refreshScores();
        refreshEcritures();
        refreshVocab();
        setMessage(`Imported data for "${data.profile.displayName}".`);
        setError("");
      } catch {
        setError("Could not import file. Check the JSON format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDeleteProfile = () => {
    if (!activeProfile) return;
    if (
      confirm(
        `Delete profile "${activeProfile.displayName}" and all their scores? This cannot be undone.`
      )
    ) {
      deleteProfile(activeProfile.id);
      setMessage("Profile deleted.");
    }
  };

  const handleNclcTargetChange = (
    section: (typeof ALL_SECTIONS)[number],
    level: NclcLevel
  ) => {
    if (!activeProfile) return;
    updateActiveProfile({
      ...activeProfile,
      nclcTargets: {
        ...activeProfile.nclcTargets,
        [section]: level,
      },
    });
    setMessage(
      `NCLC target for ${section} set to ${level} (min score ${getMinScoreForNclc(section, level)}).`
    );
  };

  const handleCefrTargetChange = (
    section: (typeof ALL_SECTIONS)[number],
    level: CefrLevel
  ) => {
    if (!activeProfile) return;
    updateActiveProfile({
      ...activeProfile,
      targets: {
        ...activeProfile.targets,
        [section]: CEFR_TARGETS[level],
      },
    });
    setMessage(`CEFR target for ${section} set to ${level} (${CEFR_TARGETS[level]}).`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage profiles, targets, and data backup.
        </p>
      </div>

      {message && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profiles</CardTitle>
          <CardDescription>
            Display names for this device. Your Sync ID (top bar) is what
            restores data across browsers — not the profile name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Active profile</Label>
            <Select
              value={activeProfile?.id ?? ""}
              onValueChange={(id) => switchProfile(id)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="New profile name"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProfile()}
            />
            <Button onClick={handleCreateProfile}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <Button variant="destructive" onClick={handleDeleteProfile}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete active profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NCLC Targets</CardTitle>
          <CardDescription>
            Set your immigration target per section (e.g. NCLC 7). Uses official
            IRCC TCF Canada conversion tables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ALL_SECTIONS.map((section) => (
            <div key={section} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{section}</p>
                <p className="text-sm text-muted-foreground">
                  {SECTION_LABELS[section]}
                </p>
              </div>
              <Select
                value={
                  activeProfile?.nclcTargets?.[section]
                    ? String(activeProfile.nclcTargets[section])
                    : ""
                }
                onValueChange={(v) =>
                  handleNclcTargetChange(section, Number(v) as NclcLevel)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Set NCLC" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_NCLC_LEVELS.map((level) => (
                    <SelectItem key={level} value={String(level)}>
                      NCLC {level} (min {getMinScoreForNclc(section, level)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CEFR Targets</CardTitle>
          <CardDescription>
            Optional CEFR score targets per section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ALL_SECTIONS.map((section) => (
            <div key={section} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{section}</p>
                <p className="text-sm text-muted-foreground">
                  {SECTION_LABELS[section]}
                </p>
              </div>
              <Select
                value={
                  activeProfile?.targets?.[section]
                    ? (Object.entries(CEFR_TARGETS).find(
                        ([, v]) => v === activeProfile.targets?.[section]
                      )?.[0] as CefrLevel) ?? ""
                    : ""
                }
                onValueChange={(v) =>
                  handleCefrTargetChange(section, v as CefrLevel)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Set CEFR" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CEFR_TARGETS) as CefrLevel[]).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level} ({CEFR_TARGETS[level]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloud Sync
          </CardTitle>
          <CardDescription>
            Sync scores, writings, and vocabulary across devices using Vercel KV.
            Use the same Sync ID on localhost and your Vercel link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sync-id">Sync ID</Label>
            <div className="flex gap-2">
              <Input
                id="sync-id"
                placeholder="e.g. tcf-a3f9b2c1"
                value={syncIdInput}
                onChange={(e) => setSyncIdInput(e.target.value)}
              />
              <Button variant="outline" onClick={handleSaveSyncId}>
                Save
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleGenerateSyncId}>
              Generate new ID
            </Button>
            <Button
              variant="outline"
              onClick={() => syncNow()}
              disabled={!syncIdInput || syncStatus === "syncing"}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
              />
              Sync now
            </Button>
            {syncIdInput && (
              <Button variant="ghost" onClick={handleClearSyncId}>
                Disable sync
              </Button>
            )}
          </div>
          {lastSynced && (
            <p className="text-xs text-muted-foreground">
              Last synced: {new Date(lastSynced).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Requires KV_REST_API_URL and KV_REST_API_TOKEN on Vercel (add Redis
            integration from Vercel Marketplace).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>
            Export your data as JSON to back up or move to another device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
        </CardContent>
      </Card>
    </div>
  );
}
