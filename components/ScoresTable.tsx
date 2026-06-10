"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CefrBadge } from "@/components/CefrBadge";
import { NclcBadge } from "@/components/NclcBadge";
import { ScoreForm } from "@/components/ScoreForm";
import { useScores } from "@/hooks/useScores";
import { formatPercent, SECTION_LABELS } from "@/lib/tcf";
import { ALL_SECTIONS, ScoreEntry, TcfSection } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";

interface ScoresTableProps {
  scores: ScoreEntry[];
}

export function ScoresTable({ scores }: ScoresTableProps) {
  const { deleteEntry } = useScores();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sections, setSections] = useState<Set<TcfSection>>(new Set(ALL_SECTIONS));
  const [editingEntry, setEditingEntry] = useState<ScoreEntry | null>(null);

  const filtered = useMemo(() => {
    return scores
      .filter((entry) => {
        if (dateFrom && entry.date < dateFrom) return false;
        if (dateTo && entry.date > dateTo) return false;
        if (!sections.has(entry.section)) return false;
        return true;
      })
      .sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [scores, dateFrom, dateTo, sections]);

  const toggleSection = (section: TcfSection) => {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        if (next.size > 1) next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleDelete = (entry: ScoreEntry) => {
    if (confirm(`Delete ${entry.section} score from ${entry.date}?`)) {
      deleteEntry(entry.id);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Scores</CardTitle>
          <CardDescription>
            Filter by date range and section. {filtered.length} of{" "}
            {scores.length} entries shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Sections</Label>
              <div className="flex flex-wrap gap-3">
                {ALL_SECTIONS.map((section) => (
                  <label
                    key={section}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={sections.has(section)}
                      onCheckedChange={() => toggleSection(section)}
                    />
                    {section}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear date filters
            </Button>
          )}

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No scores match your filters.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>NCLC</TableHead>
                    <TableHead className="hidden md:table-cell">CEFR</TableHead>
                    <TableHead className="hidden sm:table-cell">Notes</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(parseISO(entry.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{entry.section}</span>
                        <span className="hidden text-muted-foreground sm:inline">
                          {" "}
                          — {SECTION_LABELS[entry.section]}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.score}/699
                      </TableCell>
                      <TableCell>{formatPercent(entry.score)}</TableCell>
                      <TableCell>
                        <NclcBadge section={entry.section} score={entry.score} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <CefrBadge score={entry.score} />
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate sm:table-cell">
                        {entry.notes ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingEntry(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingEntry)}
        onOpenChange={(open) => !open && setEditingEntry(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Score</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <ScoreForm
              editEntry={editingEntry}
              onSuccess={() => setEditingEntry(null)}
              onCancel={() => setEditingEntry(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
