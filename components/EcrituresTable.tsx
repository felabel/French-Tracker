"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  countWords,
  ECRITURE_TACHES,
  getTache,
  TACHE_LABELS,
  truncateText,
} from "@/lib/ecriture";
import { cn } from "@/lib/utils";
import { EcritureEntry, EcritureTache } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface EcrituresTableProps {
  ecritures: EcritureEntry[];
  onRowClick: (entry: EcritureEntry) => void;
  onEdit: (entry: EcritureEntry) => void;
  onDelete: (entry: EcritureEntry) => void;
  onSetTache: (entryIds: string[], tache: EcritureTache) => void;
}

function displaySubject(entry: EcritureEntry): string {
  if (entry.subject?.trim()) return entry.subject;
  return truncateText(entry.prompt, 60);
}

export function EcrituresTable({
  ecritures,
  onRowClick,
  onEdit,
  onDelete,
  onSetTache,
}: EcrituresTableProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tacheFilter, setTacheFilter] = useState<EcritureTache | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const tacheCounts = useMemo(() => {
    const counts: Record<EcritureTache, number> = { T1: 0, T2: 0, T3: 0, mix: 0 };
    for (const entry of ecritures) counts[getTache(entry)]++;
    return counts;
  }, [ecritures]);

  const filtered = useMemo(() => {
    return ecritures
      .filter((entry) => {
        if (dateFrom && entry.date < dateFrom) return false;
        if (dateTo && entry.date > dateTo) return false;
        if (tacheFilter !== "all" && getTache(entry) !== tacheFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [ecritures, dateFrom, dateTo, tacheFilter]);

  // Only act on selected rows that are still visible under the current filters.
  const visibleSelectedIds = filtered
    .filter((entry) => selectedIds.has(entry.id))
    .map((entry) => entry.id);
  const allVisibleSelected =
    filtered.length > 0 && visibleSelectedIds.length === filtered.length;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds(
      allVisibleSelected ? new Set() : new Set(filtered.map((e) => e.id))
    );
  };

  const moveSelected = (tache: EcritureTache) => {
    onSetTache(visibleSelectedIds, tache);
    setSelectedIds(new Set());
  };

  const filterOptions: { value: EcritureTache | "all"; label: string; count: number }[] = [
    { value: "all", label: "All", count: ecritures.length },
    ...ECRITURE_TACHES.map((t) => ({
      value: t,
      label: TACHE_LABELS[t],
      count: tacheCounts[t],
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Writings</CardTitle>
        <CardDescription>
          Filter by tâche or date range. Select rows to move them into a
          tâche. {filtered.length} of {ecritures.length} entries
          shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={tacheFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTacheFilter(option.value)}
            >
              {option.label}
              <span
                className={cn(
                  "ml-2 text-xs",
                  tacheFilter === option.value
                    ? "opacity-80"
                    : "text-muted-foreground"
                )}
              >
                {option.count}
              </span>
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ecriture-date-from">From</Label>
            <Input
              id="ecriture-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ecriture-date-to">To</Label>
            <Input
              id="ecriture-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
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

        {visibleSelectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <span className="text-sm font-medium">
              {visibleSelectedIds.length} selected — move to:
            </span>
            {ECRITURE_TACHES.map((t) => (
              <Button
                key={t}
                variant="outline"
                size="sm"
                onClick={() => moveSelected(t)}
              >
                {TACHE_LABELS[t]}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </Button>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No writings match your filters.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleAllVisible}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-20 text-right">Words</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => onRowClick(entry)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(entry.id)}
                        onCheckedChange={() => toggleSelected(entry.id)}
                        aria-label={`Select ${displaySubject(entry)}`}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(entry.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getTache(entry) === "mix" ? "outline" : "secondary"}
                        className="whitespace-nowrap"
                      >
                        {TACHE_LABELS[getTache(entry)]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate sm:max-w-md">
                      {displaySubject(entry)}
                    </TableCell>
                    <TableCell className="text-right">
                      {countWords(entry.text)}
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                "Delete this writing? This cannot be undone."
                              )
                            ) {
                              onDelete(entry);
                            }
                          }}
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
  );
}
