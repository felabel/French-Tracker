"use client";

import { ScoresTable } from "@/components/ScoresTable";
import { useScores } from "@/hooks/useScores";

export default function ScoresPage() {
  const { scores, isLoading } = useScores();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scores</h1>
        <p className="text-muted-foreground">
          View and filter all your TCF Canada practice test scores.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading scores...</p>
      ) : (
        <ScoresTable scores={scores} />
      )}
    </div>
  );
}
