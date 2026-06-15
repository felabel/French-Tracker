"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CefrBadge } from "@/components/CefrBadge";
import { NclcBadge } from "@/components/NclcBadge";
import { useListening } from "@/hooks/useListening";
import { useScores } from "@/hooks/useScores";
import {
  getDefaultWeekEnding,
  getMockCoScoreForWeek,
  getThisSunday,
} from "@/lib/listening";
import { formatPercent } from "@/lib/tcf";
import { ListeningWeeklyReview } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface ListeningWeeklyFormProps {
  editReview?: ListeningWeeklyReview;
}

export function ListeningWeeklyForm({ editReview }: ListeningWeeklyFormProps) {
  const { listeningWeekly, upsertWeeklyReview, updateWeeklyReview } =
    useListening();
  const { scores } = useScores();

  const [weekEnding, setWeekEnding] = useState(
    editReview?.weekEnding ?? getDefaultWeekEnding()
  );
  const [biggestDifficulty, setBiggestDifficulty] = useState(
    editReview?.biggestDifficulty ?? ""
  );
  const [biggestImprovement, setBiggestImprovement] = useState(
    editReview?.biggestImprovement ?? ""
  );
  const [error, setError] = useState("");

  const existingReview = useMemo(
    () => listeningWeekly.find((r) => r.weekEnding === weekEnding),
    [listeningWeekly, weekEnding]
  );

  useEffect(() => {
    if (editReview) {
      setWeekEnding(editReview.weekEnding);
      setBiggestDifficulty(editReview.biggestDifficulty);
      setBiggestImprovement(editReview.biggestImprovement);
      setError("");
    }
  }, [editReview]);

  useEffect(() => {
    if (existingReview && !editReview) {
      setBiggestDifficulty(existingReview.biggestDifficulty);
      setBiggestImprovement(existingReview.biggestImprovement);
    }
  }, [existingReview, editReview]);

  const mockScore = useMemo(
    () => getMockCoScoreForWeek(scores, weekEnding),
    [scores, weekEnding]
  );

  const thisSunday = getThisSunday();
  const showSundayNudge =
    weekEnding === thisSunday && !existingReview && !editReview;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!weekEnding) {
      setError("Week ending date is required.");
      return;
    }
    if (!biggestDifficulty.trim()) {
      setError("Biggest difficulty is required.");
      return;
    }
    if (!biggestImprovement.trim()) {
      setError("Biggest improvement is required.");
      return;
    }

    const payload = {
      weekEnding,
      biggestDifficulty: biggestDifficulty.trim(),
      biggestImprovement: biggestImprovement.trim(),
    };

    if (editReview) {
      updateWeeklyReview({ ...editReview, ...payload });
    } else if (existingReview) {
      updateWeeklyReview({ ...existingReview, ...payload });
    } else {
      upsertWeeklyReview(payload);
    }

    setError("");
    if (!editReview) {
      setBiggestDifficulty("");
      setBiggestImprovement("");
    }
  };

  return (
    <div className="space-y-4">
      {showSundayNudge && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              It&apos;s Sunday — time for your weekly listening review. Log your
              Saturday mock CO score in{" "}
              <Link href="/log" className="underline hover:text-foreground">
                Log Test
              </Link>{" "}
              with the mock tag if you haven&apos;t yet.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Weekly review</CardTitle>
          <CardDescription>
            Reflect on the week ending Sunday. Mock CO score is pulled from
            tagged scores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="week-ending">Week ending (Sunday)</Label>
            <Input
              id="week-ending"
              type="date"
              value={weekEnding}
              onChange={(e) => setWeekEnding(e.target.value)}
              required
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mock listening score (CO)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockScore ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {mockScore.score}/699 ({formatPercent(mockScore.score)})
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Logged {format(parseISO(mockScore.date), "MMM d, yyyy")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <NclcBadge section="CO" score={mockScore.score} />
                    <CefrBadge score={mockScore.score} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not logged yet.{" "}
                  <Link href="/log" className="underline hover:text-foreground">
                    Log your CO mock test
                  </Link>{" "}
                  and check &quot;Mock listening test&quot;.
                </p>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="biggest-difficulty">
                Biggest difficulty this week
              </Label>
              <Textarea
                id="biggest-difficulty"
                placeholder="e.g. Couldn't catch numbers in fast dialogues"
                value={biggestDifficulty}
                onChange={(e) => setBiggestDifficulty(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="biggest-improvement">
                Biggest improvement this week
              </Label>
              <Textarea
                id="biggest-improvement"
                placeholder="e.g. Better at recognizing common connectors"
                value={biggestImprovement}
                onChange={(e) => setBiggestImprovement(e.target.value)}
                rows={3}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit">
              {existingReview || editReview
                ? "Save changes"
                : "Save weekly review"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
