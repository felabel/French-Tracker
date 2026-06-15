"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useScores } from "@/hooks/useScores";
import { getMockCoScoreForWeek } from "@/lib/listening";
import { formatPercent } from "@/lib/tcf";
import { ListeningWeeklyReview } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface ListeningWeeklyTableProps {
  reviews: ListeningWeeklyReview[];
  onEdit: (review: ListeningWeeklyReview) => void;
  onDelete: (review: ListeningWeeklyReview) => void;
}

export function ListeningWeeklyTable({
  reviews,
  onEdit,
  onDelete,
}: ListeningWeeklyTableProps) {
  const { scores } = useScores();

  const sorted = useMemo(() => {
    return [...reviews].sort((a, b) =>
      b.weekEnding.localeCompare(a.weekEnding)
    );
  }, [reviews]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past weekly reviews</CardTitle>
        <CardDescription>
          {sorted.length} review{sorted.length !== 1 ? "s" : ""} saved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No weekly reviews yet.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week ending</TableHead>
                  <TableHead>Mock CO</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Improvement</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((review) => {
                  const mockScore = getMockCoScoreForWeek(
                    scores,
                    review.weekEnding
                  );
                  return (
                    <TableRow key={review.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(review.weekEnding), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {mockScore
                          ? `${mockScore.score} (${formatPercent(mockScore.score)})`
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {review.biggestDifficulty}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {review.biggestImprovement}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(review)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(
                                  "Delete this weekly review? This cannot be undone."
                                )
                              ) {
                                onDelete(review);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
