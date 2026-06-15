"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionChart } from "@/components/SectionChart";
import { PracticeHeatmap } from "@/components/PracticeHeatmap";
import { StatCard, SummaryStatCard, getSectionDelta } from "@/components/StatCard";
import { CefrBadge } from "@/components/CefrBadge";
import { NclcBadge } from "@/components/NclcBadge";
import { useScores } from "@/hooks/useScores";
import { useListening } from "@/hooks/useListening";
import { useProfile } from "@/hooks/useProfile";
import {
  getCurrentWeekSummary,
  getMockCoScoreForWeek,
  getThisSunday,
} from "@/lib/listening";
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
  const { listeningDaily, isLoading: listeningLoading } = useListening();
  const { activeProfile } = useProfile();

  if (isLoading || listeningLoading) {
    return <p className="text-muted-foreground">Loading scores...</p>;
  }

  const weekSummary = getCurrentWeekSummary(listeningDaily);
  const mockCoThisWeek = getMockCoScoreForWeek(scores, getThisSunday());

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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Listening this week
          </CardTitle>
          <CardDescription>
            Daily practice logged in your listening journal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold">{weekSummary.daysLogged}/7</p>
              <p className="text-sm text-muted-foreground">Days logged</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {weekSummary.totalTcfQuestions}
              </p>
              <p className="text-sm text-muted-foreground">TCF questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {weekSummary.totalDictationMinutes} min
              </p>
              <p className="text-sm text-muted-foreground">Dictation</p>
            </div>
          </div>
          {mockCoThisWeek ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Latest mock CO:
              </span>
              <span className="font-medium">{mockCoThisWeek.score}/699</span>
              <NclcBadge section="CO" score={mockCoThisWeek.score} />
              <CefrBadge score={mockCoThisWeek.score} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No mock CO score logged this week yet.
            </p>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/ecoute">Open listening journal</Link>
          </Button>
        </CardContent>
      </Card>

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
