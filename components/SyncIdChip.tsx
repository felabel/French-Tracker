"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSyncId } from "@/lib/storage";
import { onDataChange } from "@/lib/sync";
import { cn } from "@/lib/utils";
import { SYNC_PROMPT_KEY } from "@/components/ProfileGate";

export function SyncIdChip() {
  const [syncId, setSyncIdState] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [needsAttention, setNeedsAttention] = useState(false);

  const refresh = useCallback(() => {
    const id = getSyncId();
    setSyncIdState(id);
    if (id) {
      const saved = localStorage.getItem(SYNC_PROMPT_KEY);
      setNeedsAttention(saved !== id);
    } else {
      setNeedsAttention(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onSyncIdChanged = () => refresh();
    window.addEventListener("tcf-sync-id-changed", onSyncIdChanged);
    const unsubscribe = onDataChange(refresh);
    return () => {
      window.removeEventListener("tcf-sync-id-changed", onSyncIdChanged);
      unsubscribe();
    };
  }, [refresh]);

  const handleCopy = async () => {
    if (!syncId) return;
    try {
      await navigator.clipboard.writeText(syncId);
      setCopied(true);
      localStorage.setItem(SYNC_PROMPT_KEY, syncId);
      setNeedsAttention(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  if (!syncId) return null;

  const title = needsAttention
    ? "Copy your Sync ID now — use it on every device"
    : "Click to copy your Sync ID";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      title={title}
      className={cn(
        "gap-1.5 border-2 font-mono text-xs font-semibold",
        needsAttention
          ? "animate-pulse border-amber-400 bg-amber-400/20 text-amber-100 hover:bg-amber-400/30"
          : "border-emerald-500/60 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
      )}
    >
      <KeyRound className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden max-w-[140px] truncate sm:inline">{syncId}</span>
      <span className="sm:hidden">Sync ID</span>
      {needsAttention && (
        <span className="hidden text-[10px] font-bold uppercase tracking-wide text-amber-200 md:inline">
          Copy me
        </span>
      )}
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0" />
      )}
    </Button>
  );
}
