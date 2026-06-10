"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildHeatmapData } from "@/lib/tcf";
import { ScoreEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface PracticeHeatmapProps {
  scores: ScoreEntry[];
}

function getIntensity(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-emerald-900/60";
  if (count <= 3) return "bg-emerald-700/80";
  return "bg-emerald-500";
}

export function PracticeHeatmap({ scores }: PracticeHeatmapProps) {
  const data = buildHeatmapData(scores, 12);
  const weeks: { date: string; count: number }[][] = [];

  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  if (scores.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Activity</CardTitle>
        <CardDescription>Last 12 weeks of logged tests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${format(parseISO(day.date), "MMM d, yyyy")}: ${day.count} entries`}
                    className={cn(
                      "h-4 w-4 rounded-sm",
                      getIntensity(day.count)
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="h-3 w-3 rounded-sm bg-muted" />
            <div className="h-3 w-3 rounded-sm bg-emerald-900/60" />
            <div className="h-3 w-3 rounded-sm bg-emerald-700/80" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
