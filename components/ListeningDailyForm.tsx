"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useListening } from "@/hooks/useListening";
import { ListeningDailyEntry } from "@/lib/types";

interface ListeningDailyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: ListeningDailyEntry;
}

export function ListeningDailyForm({
  open,
  onOpenChange,
  editEntry,
}: ListeningDailyFormProps) {
  const { upsertDailyEntry, updateDailyEntry } = useListening();
  const isEdit = Boolean(editEntry);

  const [date, setDate] = useState(
    editEntry?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [formationTcfQuestions, setFormationTcfQuestions] = useState(
    editEntry ? String(editEntry.formationTcfQuestions) : "0"
  );
  const [dictationMinutes, setDictationMinutes] = useState(
    editEntry ? String(editEntry.dictationMinutes) : "0"
  );
  const [innerFrenchEpisode, setInnerFrenchEpisode] = useState(
    editEntry?.innerFrenchEpisode ?? ""
  );
  const [notes, setNotes] = useState(editEntry?.notes ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDate(editEntry?.date ?? new Date().toISOString().slice(0, 10));
      setFormationTcfQuestions(
        editEntry ? String(editEntry.formationTcfQuestions) : "0"
      );
      setDictationMinutes(
        editEntry ? String(editEntry.dictationMinutes) : "0"
      );
      setInnerFrenchEpisode(editEntry?.innerFrenchEpisode ?? "");
      setNotes(editEntry?.notes ?? "");
      setError("");
    }
  }, [open, editEntry]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setError("");
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      setError("Date is required.");
      return;
    }

    const tcfQuestions = parseInt(formationTcfQuestions, 10);
    const dictation = parseInt(dictationMinutes, 10);

    if (Number.isNaN(tcfQuestions) || tcfQuestions < 0) {
      setError("Formation TCF questions must be 0 or more.");
      return;
    }
    if (Number.isNaN(dictation) || dictation < 0) {
      setError("Dictation minutes must be 0 or more.");
      return;
    }

    const payload = {
      date,
      formationTcfQuestions: tcfQuestions,
      dictationMinutes: dictation,
      innerFrenchEpisode: innerFrenchEpisode.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (isEdit && editEntry) {
      updateDailyEntry({ ...editEntry, ...payload });
    } else {
      upsertDailyEntry(payload);
    }

    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit daily log" : "Log listening practice"}
          </DialogTitle>
          <DialogDescription>
            One entry per day. Saving the same date updates that day&apos;s log.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="listening-date">Date</Label>
            <Input
              id="listening-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="listening-tcf">Formation TCF (questions)</Label>
              <Input
                id="listening-tcf"
                type="number"
                min={0}
                value={formationTcfQuestions}
                onChange={(e) => setFormationTcfQuestions(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listening-dictation">Dictation (minutes)</Label>
              <Input
                id="listening-dictation"
                type="number"
                min={0}
                value={dictationMinutes}
                onChange={(e) => setDictationMinutes(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="listening-innerfrench">InnerFrench episode</Label>
            <Input
              id="listening-innerfrench"
              placeholder="e.g. Pourquoi les Français…"
              value={innerFrenchEpisode}
              onChange={(e) => setInnerFrenchEpisode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="listening-notes">Notes (optional)</Label>
            <Textarea
              id="listening-notes"
              placeholder="Anything else from today's listening practice"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit">{isEdit ? "Save changes" : "Save"}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
