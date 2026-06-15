"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListeningDailyForm } from "@/components/ListeningDailyForm";
import { ListeningDailyTable } from "@/components/ListeningDailyTable";
import { ListeningWeeklyForm } from "@/components/ListeningWeeklyForm";
import { ListeningWeeklyTable } from "@/components/ListeningWeeklyTable";
import { useListening } from "@/hooks/useListening";
import { ListeningDailyEntry, ListeningWeeklyReview } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "daily" | "weekly";

export default function EcoutePage() {
  const {
    listeningDaily,
    listeningWeekly,
    isLoading,
    deleteDailyEntry,
    deleteWeeklyReview,
  } = useListening();

  const [tab, setTab] = useState<Tab>("daily");
  const [dailyFormOpen, setDailyFormOpen] = useState(false);
  const [editingDaily, setEditingDaily] = useState<
    ListeningDailyEntry | undefined
  >();
  const [editingWeekly, setEditingWeekly] = useState<
    ListeningWeeklyReview | undefined
  >();

  const handleAddDaily = () => {
    setEditingDaily(undefined);
    setDailyFormOpen(true);
  };

  const handleEditDaily = (entry: ListeningDailyEntry) => {
    setEditingDaily(entry);
    setDailyFormOpen(true);
  };

  const handleEditWeekly = (review: ListeningWeeklyReview) => {
    setEditingWeekly(review);
    setTab("weekly");
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading listening journal...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Compréhension orale
          </h1>
          <p className="text-muted-foreground">
            Daily listening practice log and weekly reflection.
          </p>
        </div>
        {tab === "daily" && (
          <Button onClick={handleAddDaily}>
            <Plus className="mr-2 h-4 w-4" />
            Log today
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={tab === "daily" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("daily");
            setEditingWeekly(undefined);
          }}
        >
          Daily
        </Button>
        <Button
          type="button"
          variant={tab === "weekly" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("weekly")}
        >
          Weekly
        </Button>
      </div>

      <div className={cn(tab !== "daily" && "hidden")}>
        <ListeningDailyTable
          entries={listeningDaily}
          onEdit={handleEditDaily}
          onDelete={(entry) => deleteDailyEntry(entry.id)}
        />
      </div>

      <div className={cn(tab !== "weekly" && "hidden")}>
        <ListeningWeeklyForm editReview={editingWeekly} />
        <div className="mt-6">
          <ListeningWeeklyTable
            reviews={listeningWeekly}
            onEdit={handleEditWeekly}
            onDelete={(review) => {
              deleteWeeklyReview(review.id);
              if (editingWeekly?.id === review.id) {
                setEditingWeekly(undefined);
              }
            }}
          />
        </div>
      </div>

      <ListeningDailyForm
        open={dailyFormOpen}
        onOpenChange={setDailyFormOpen}
        editEntry={editingDaily}
      />
    </div>
  );
}
