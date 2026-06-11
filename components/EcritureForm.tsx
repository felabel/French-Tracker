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
import { useEcritures } from "@/hooks/useEcritures";
import { countWords } from "@/lib/ecriture";
import { EcritureEntry } from "@/lib/types";

interface EcritureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: EcritureEntry;
}

export function EcritureForm({
  open,
  onOpenChange,
  editEntry,
}: EcritureFormProps) {
  const { addEntry, updateEntry } = useEcritures();
  const isEdit = Boolean(editEntry);

  const [date, setDate] = useState(
    editEntry?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [subject, setSubject] = useState(editEntry?.subject ?? "");
  const [prompt, setPrompt] = useState(editEntry?.prompt ?? "");
  const [text, setText] = useState(editEntry?.text ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDate(editEntry?.date ?? new Date().toISOString().slice(0, 10));
      setSubject(editEntry?.subject ?? "");
      setPrompt(editEntry?.prompt ?? "");
      setText(editEntry?.text ?? "");
      setError("");
    }
  }, [open, editEntry]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setError("");
      if (!isEdit) {
        setSubject("");
        setPrompt("");
        setText("");
        setDate(new Date().toISOString().slice(0, 10));
      }
    }
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedSubject = subject.trim();
    const trimmedPrompt = prompt.trim();
    const trimmedText = text.trim();

    if (!date) {
      setError("Date is required.");
      return;
    }
    if (!trimmedSubject) {
      setError("Subject is required.");
      return;
    }
    if (!trimmedPrompt) {
      setError("Prompt is required.");
      return;
    }
    if (!trimmedText) {
      setError("Text is required.");
      return;
    }

    if (isEdit && editEntry) {
      updateEntry({
        ...editEntry,
        date,
        subject: trimmedSubject,
        prompt: trimmedPrompt,
        text: trimmedText,
      });
    } else {
      addEntry({
        date,
        subject: trimmedSubject,
        prompt: trimmedPrompt,
        text: trimmedText,
      });
    }

    setError("");
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit writing" : "Add Expression écrite"}
          </DialogTitle>
          <DialogDescription>
            Save the task prompt and your written response.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ecriture-date">Date</Label>
              <Input
                id="ecriture-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecriture-subject">Subject</Label>
              <Input
                id="ecriture-subject"
                placeholder="e.g. Tâche 2 — Forum en ligne"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ecriture-prompt">Prompt / Task</Label>
            <Textarea
              id="ecriture-prompt"
              placeholder="e.g. Rédigez un courriel à votre collègue pour…"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError("");
              }}
              rows={3}
              required
            />
          </div>

          <div className="flex flex-1 flex-col space-y-2">
            <Label htmlFor="ecriture-text">Your text</Label>
            <div className="relative flex flex-1 flex-col rounded-md border border-input">
              <div className="flex justify-end border-b border-input px-3 py-1.5">
                <span className="text-xs text-muted-foreground">
                  {countWords(text)} words
                </span>
              </div>
              <Textarea
                id="ecriture-text"
                placeholder="Write your response here…"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError("");
                }}
                rows={14}
                className="min-h-[280px] flex-1 resize-y border-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
            </div>
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
