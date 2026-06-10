"use client";

import { useRouter } from "next/navigation";
import { ScoreForm } from "@/components/ScoreForm";

export default function LogPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Test</h1>
        <p className="text-muted-foreground">
          Record scores from your TCF Canada simulated test.
        </p>
      </div>

      <ScoreForm onSuccess={() => router.push("/dashboard")} />
    </div>
  );
}
