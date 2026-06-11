"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVocab } from "@/hooks/useVocab";
import { VocabEntry } from "@/lib/types";

interface VocabEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  editEntry?: VocabEntry;
}

export function VocabEntryForm({
  open,
  onOpenChange,
  categoryId,
  editEntry,
}: VocabEntryFormProps) {
  const { addEntry, updateEntry } = useVocab();
  const isEdit = Boolean(editEntry);

  const [french, setFrench] = useState("");
  const [english, setEnglish] = useState("");
  const [example, setExample] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFrench(editEntry?.french ?? "");
      setEnglish(editEntry?.english ?? "");
      setExample(editEntry?.example ?? "");
      setNotes(editEntry?.notes ?? "");
      setError("");
    }
  }, [open, editEntry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFrench = french.trim();
    if (!trimmedFrench) {
      setError("French word or phrase is required.");
      return;
    }

    const payload = {
      categoryId: editEntry?.categoryId ?? categoryId,
      french: trimmedFrench,
      english: english.trim() || undefined,
      example: example.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (isEdit && editEntry) {
      updateEntry({ ...editEntry, ...payload });
    } else {
      addEntry(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit entry" : "Add vocabulary"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vocab-french">French *</Label>
            <Input
              id="vocab-french"
              value={french}
              onChange={(e) => setFrench(e.target.value)}
              placeholder="e.g. néanmoins"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vocab-english">English</Label>
            <Input
              id="vocab-english"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              placeholder="e.g. nevertheless"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vocab-example">Example sentence</Label>
            <Textarea
              id="vocab-example"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              rows={2}
              placeholder="e.g. Néanmoins, je pense que…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vocab-notes">Notes</Label>
            <Textarea
              id="vocab-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit">{isEdit ? "Save" : "Add"}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
