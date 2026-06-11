"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { countWords } from "@/lib/ecriture";
import { EcritureEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface EcritureDetailModalProps {
  entry: EcritureEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (entry: EcritureEntry) => void;
  onDelete: (entry: EcritureEntry) => void;
}

export function EcritureDetailModal({
  entry,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: EcritureDetailModalProps) {
  if (!entry) return null;

  const subject =
    entry.subject?.trim() || "No subject";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{subject}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">Date: </span>
              {format(parseISO(entry.date), "MMMM d, yyyy")}
            </span>
            <span>
              <span className="font-medium text-foreground">Words: </span>
              {countWords(entry.text)}
            </span>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Subject
            </h4>
            <p className="rounded-md border bg-muted/30 p-3 text-sm">
              {subject}
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Prompt / Task
            </h4>
            <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
              {entry.prompt}
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Your text
            </h4>
            <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 font-mono text-sm leading-relaxed">
              {entry.text}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(entry);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Delete this writing? This cannot be undone.")) {
                  onDelete(entry);
                  onOpenChange(false);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
