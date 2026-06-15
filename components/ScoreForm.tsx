"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useScores } from "@/hooks/useScores";
import { NclcBadge } from "@/components/NclcBadge";
import { CefrBadge } from "@/components/CefrBadge";
import { isValidScore, SECTION_LABELS } from "@/lib/tcf";
import { ALL_SECTIONS, ScoreEntry, TcfSection } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

interface ScoreFormProps {
  editEntry?: ScoreEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type FormMode = "full" | "single";

export function ScoreForm({ editEntry, onSuccess, onCancel }: ScoreFormProps) {
  const { addEntries, updateEntry } = useScores();
  const isEdit = Boolean(editEntry);

  const [mode, setMode] = useState<FormMode>(isEdit ? "single" : "full");
  const [date, setDate] = useState(
    editEntry?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(editEntry?.notes ?? "");
  const [isMockTest, setIsMockTest] = useState(editEntry?.isMockTest ?? false);
  const [scores, setScores] = useState<Record<TcfSection, string>>({
    CO: editEntry?.section === "CO" ? String(editEntry.score) : "",
    CE: editEntry?.section === "CE" ? String(editEntry.score) : "",
    EO: editEntry?.section === "EO" ? String(editEntry.score) : "",
    EE: editEntry?.section === "EE" ? String(editEntry.score) : "",
  });
  const [selectedSection, setSelectedSection] = useState<TcfSection>(
    editEntry?.section ?? "CO"
  );
  const [errors, setErrors] = useState<string[]>([]);

  const showMockCheckbox =
    isEdit && editEntry
      ? editEntry.section === "CO"
      : mode === "single"
        ? selectedSection === "CO"
        : Boolean(scores.CO);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!date) newErrors.push("Date is required.");

    if (isEdit && editEntry) {
      const score = parseInt(scores[editEntry.section], 10);
      if (!isValidScore(score)) {
        newErrors.push(`Score must be an integer between 100 and 699.`);
      }
      if (newErrors.length === 0) {
        updateEntry({
          ...editEntry,
          date,
          score,
          notes: notes.trim() || undefined,
          isMockTest: editEntry.section === "CO" && isMockTest ? true : undefined,
        });
        onSuccess?.();
      }
      setErrors(newErrors);
      return;
    }

    const sectionsToSave: TcfSection[] =
      mode === "full" ? ALL_SECTIONS : [selectedSection];

    const entries: Omit<ScoreEntry, "id" | "createdAt" | "maxScore">[] = [];

    for (const section of sectionsToSave) {
      const score = parseInt(scores[section], 10);
      if (!isValidScore(score)) {
        newErrors.push(
          `${section}: score must be an integer between 100 and 699.`
        );
        continue;
      }
      entries.push({
        date,
        section,
        score,
        notes: notes.trim() || undefined,
        isMockTest:
          section === "CO" && isMockTest ? true : undefined,
      });
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    addEntries(entries);
    setScores({ CO: "", CE: "", EO: "", EE: "" });
    setNotes("");
    setIsMockTest(false);
    setErrors([]);
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Score" : "Log Practice Test"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update this score entry."
            : "Record your TCF Canada simulated test scores (100–699 per section)."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {!isEdit && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "full" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("full")}
              >
                Full test (all 4 sections)
              </Button>
              <Button
                type="button"
                variant={mode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("single")}
              >
                Single section
              </Button>
            </div>
          )}

          {mode === "single" && !isEdit && (
            <div className="space-y-2">
              <Label>Section</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ALL_SECTIONS.map((section) => (
                  <Button
                    key={section}
                    type="button"
                    variant={selectedSection === section ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSection(section)}
                  >
                    {section}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {(isEdit
              ? [editEntry!.section]
              : mode === "full"
                ? ALL_SECTIONS
                : [selectedSection]
            ).map((section) => {
              const parsed = parseInt(scores[section], 10);
              const showPreview = isValidScore(parsed);

              return (
                <div key={section} className="space-y-2">
                  <Label htmlFor={`score-${section}`}>
                    {section} — {SECTION_LABELS[section]}
                  </Label>
                  <Input
                    id={`score-${section}`}
                    type="number"
                    min={100}
                    max={699}
                    placeholder="100–699"
                    value={scores[section]}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [section]: e.target.value,
                      }))
                    }
                    required
                  />
                  {showPreview && (
                    <div className="flex flex-wrap gap-2">
                      <NclcBadge section={section} score={parsed} />
                      <CefrBadge score={parsed} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g. GlobalExam mock #12, TV5MONDE"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {showMockCheckbox && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isMockTest}
                onCheckedChange={(checked) =>
                  setIsMockTest(checked === true)
                }
              />
              Mock listening test (CO)
            </label>
          )}

          {errors.length > 0 && (
            <ul className="space-y-1 text-sm text-destructive">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <Button type="submit">
              {isEdit ? "Save changes" : "Log scores"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
