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
import { countWords, truncateText } from "@/lib/ecriture";
import { EcritureEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface EcrituresTableProps {
  ecritures: EcritureEntry[];
  onRowClick: (entry: EcritureEntry) => void;
  onEdit: (entry: EcritureEntry) => void;
  onDelete: (entry: EcritureEntry) => void;
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
}: EcrituresTableProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return ecritures
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
  }, [ecritures, dateFrom, dateTo]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Writings</CardTitle>
        <CardDescription>
          Filter by date range. {filtered.length} of {ecritures.length} entries
          shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No writings match your filters.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
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
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(entry.date), "MMM d, yyyy")}
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
