"use client";

import { NclcCalculator } from "@/components/NclcCalculator";

export default function NclcPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Calculer votre Niveau NCLC
        </h1>
        <p className="text-muted-foreground">
          Entrez vos scores TCF Canada pour estimer vos niveaux NCLC selon le
          tableau officiel IRCC.
        </p>
      </div>

      <NclcCalculator />
    </div>
  );
}
