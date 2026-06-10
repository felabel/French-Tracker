"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { activeProfile, profiles, isReady, createProfile, switchProfile } =
    useProfile();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (activeProfile) {
    return <>{children}</>;
  }

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    createProfile(trimmed);
    setName("");
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>TCF Canada Tracker</CardTitle>
          <CardDescription>
            Enter your name to start tracking your practice test scores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.length > 0 && (
            <div className="space-y-2">
              <Label>Continue as</Label>
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
                  <span className="bg-card px-2 text-muted-foreground">
                    or create new
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              {profiles.length > 0 ? "New profile name" : "Your name"}
            </Label>
            <Input
              id="name"
              placeholder="e.g. Felicity"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button className="w-full" onClick={handleCreate}>
            Get started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
