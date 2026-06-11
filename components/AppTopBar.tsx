"use client";

import Link from "next/link";
import { ChevronDown, Cloud, CloudOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileMenuButton } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { useSync } from "@/hooks/useSync";
import { cn } from "@/lib/utils";

export function AppTopBar() {
  const { activeProfile, profiles, switchProfile } = useProfile();
  const { syncId, status, syncNow } = useSync();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <MobileMenuButton />
        <Link href="/dashboard" className="font-semibold md:hidden">
          TCF Tracker
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {syncId && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => syncNow()}
            disabled={status === "syncing"}
          >
            {status === "syncing" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : status === "offline" || status === "error" ? (
              <CloudOff className="h-3.5 w-3.5" />
            ) : (
              <Cloud className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {status === "syncing" ? "Syncing…" : "Synced"}
            </span>
          </Button>
        )}

        <ThemeToggle />

        {activeProfile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                {activeProfile.displayName}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Switch profile</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profiles.map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  onClick={() => switchProfile(profile.id)}
                  className={cn(
                    profile.id === activeProfile.id && "bg-accent"
                  )}
                >
                  {profile.displayName}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Manage profiles</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
