"use client";

import Link from "next/link";
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
import { useVocab } from "@/hooks/useVocab";
import { countVocabAddedOnDate } from "@/lib/listening";
import { ListeningDailyEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface ListeningDailyTableProps {
  entries: ListeningDailyEntry[];
  onEdit: (entry: ListeningDailyEntry) => void;
  onDelete: (entry: ListeningDailyEntry) => void;
}

export function ListeningDailyTable({
  entries,
  onEdit,
  onDelete,
}: ListeningDailyTableProps) {
  const { entries: vocabEntries } = useVocab();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        if (dateFrom && entry.date < dateFrom) return false;
        if (dateTo && entry.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [entries, dateFrom, dateTo]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily log</CardTitle>
        <CardDescription>
          Filter by date range. {filtered.length} of {entries.length} entries
          shown. New words are counted from{" "}
          <Link href="/vocabulaire" className="underline hover:text-foreground">
            Vocabulaire
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="listening-date-from">From</Label>
            <Input
              id="listening-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listening-date-to">To</Label>
            <Input
              id="listening-date-to"
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

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No listening logs match your filters.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">TCF Qs</TableHead>
                  <TableHead className="text-right">Dictation</TableHead>
                  <TableHead>InnerFrench</TableHead>
                  <TableHead className="text-right">New words</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(entry.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.formationTcfQuestions}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.dictationMinutes} min
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.innerFrenchEpisode || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {countVocabAddedOnDate(vocabEntries, entry.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
                                "Delete this listening log? This cannot be undone."
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
