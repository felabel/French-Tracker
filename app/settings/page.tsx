"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2, UserPlus } from "lucide-react";
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
import { exportUserData, importUserData } from "@/lib/storage";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProfileName, setNewProfileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
            Switch between users on this device. No password required.
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
