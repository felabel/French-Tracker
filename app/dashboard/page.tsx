"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionChart } from "@/components/SectionChart";
import { PracticeHeatmap } from "@/components/PracticeHeatmap";
import { StatCard, SummaryStatCard, getSectionDelta } from "@/components/StatCard";
import { useScores } from "@/hooks/useScores";
import { useProfile } from "@/hooks/useProfile";
import {
  formatPercent,
  getDaysPracticedThisMonth,
  getLatestBySection,
  getPracticeDates,
  getRollingAverage,
  getSectionEntries,
  getStreak,
  getWeakestSection,
  SECTION_LABELS,
} from "@/lib/tcf";
import { ALL_SECTIONS } from "@/lib/types";

export default function DashboardPage() {
  const { scores, isLoading } = useScores();
  const { activeProfile } = useProfile();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading scores...</p>;
  }

  const latest = getLatestBySection(scores);
  const practiceDates = getPracticeDates(scores);
  const streak = getStreak(practiceDates);
  const daysThisMonth = getDaysPracticedThisMonth(scores);
  const weakest = getWeakestSection(latest);

  const latestScores = ALL_SECTIONS.map((s) => latest[s]?.score).filter(
    (s): s is number => s !== undefined
  );
  const overallAvg =
    latestScores.length > 0
      ? formatPercent(
          latestScores.reduce((a, b) => a + b, 0) / latestScores.length
        )
      : "—";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {activeProfile?.displayName}. Track your TCF Canada
            progress.
          </p>
        </div>
        <Button asChild>
          <Link href="/log">Log new test</Link>
        </Button>
      </div>

      {scores.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No scores yet</CardTitle>
            <CardDescription>
              Log your first simulated TCF Canada test to start tracking
              improvement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/log">Log your first test</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryStatCard
              title="Practice streak"
              value={`${streak} day${streak !== 1 ? "s" : ""}`}
              subtitle="Consecutive days with logged tests"
            />
            <SummaryStatCard
              title="Days this month"
              value={daysThisMonth}
              subtitle="Days with at least one entry"
            />
            <SummaryStatCard
              title="Overall average"
              value={overallAvg}
              subtitle="Average % across latest section scores"
            />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Focus area
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weakest && latest[weakest] ? (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {weakest} — {SECTION_LABELS[weakest]}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Lowest latest score: {latest[weakest]!.score} (
                      {formatPercent(latest[weakest]!.score)})
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ALL_SECTIONS.map((section) => {
              const entry = latest[section];
              const sectionEntries = getSectionEntries(scores, section);
              const first = sectionEntries[0];
              const previous =
                sectionEntries.length > 1
                  ? sectionEntries[sectionEntries.length - 2]
                  : undefined;
              return (
                <StatCard
                  key={section}
                  section={section}
                  score={entry?.score ?? null}
                  delta={
                    entry && previous
                      ? getSectionDelta(entry.score, previous.score)
                      : entry && first && entry.id !== first.id
                        ? getSectionDelta(entry.score, first.score)
                        : null
                  }
                  deltaLabel={
                    previous ? "vs last" : first ? "vs first" : undefined
                  }
                  nclcTarget={activeProfile?.nclcTargets?.[section]}
                  target={activeProfile?.targets?.[section]}
                />
              );
            })}
          </div>

          {ALL_SECTIONS.some((section) => getRollingAverage(scores, section, 7)) && (
            <div className="flex flex-wrap gap-2">
              {ALL_SECTIONS.map((section) => {
                const avg = getRollingAverage(scores, section, 7);
                if (!avg) return null;
                return (
                  <Badge key={section} variant="secondary">
                    {section} 7-day avg: {avg} ({formatPercent(avg)})
                  </Badge>
                );
              })}
            </div>
          )}

          <SectionChart scores={scores} />
          <PracticeHeatmap scores={scores} />
        </>
      )}
    </div>
  );
}
