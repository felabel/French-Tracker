"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Headphones,
  Mic,
  PenLine,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeFinalNclc,
  getExpressEntryEligibility,
  isOfficialScore,
  nclcToCefrLabel,
  OFFICIAL_SCORE_RANGES,
  officialScoreToNclc,
} from "@/lib/nclc";
import { SECTION_LABELS } from "@/lib/tcf";
import { ALL_SECTIONS, NclcLevel, TcfSection } from "@/lib/types";
import { cn } from "@/lib/utils";

const SECTION_ICONS: Record<TcfSection, typeof Headphones> = {
  CO: Headphones,
  CE: BookOpen,
  EO: Mic,
  EE: PenLine,
};

const NCLC_LEVEL_COLORS: Record<NclcLevel, string> = {
  4: "bg-slate-600",
  5: "bg-blue-600",
  6: "bg-cyan-600",
  7: "bg-emerald-600",
  8: "bg-amber-600",
  9: "bg-orange-600",
  10: "bg-rose-600",
};

type ScoreInputs = Record<TcfSection, string>;

const EMPTY_INPUTS: ScoreInputs = { CO: "", CE: "", EO: "", EE: "" };

export function NclcCalculator() {
  const [inputs, setInputs] = useState<ScoreInputs>(EMPTY_INPUTS);
  const [calculated, setCalculated] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<TcfSection, string>>>({});

  const parsedScores = useMemo(() => {
    const result: Partial<Record<TcfSection, number>> = {};
    for (const section of ALL_SECTIONS) {
      const raw = inputs[section].trim();
      if (!raw) continue;
      const score = parseInt(raw, 10);
      if (!Number.isNaN(score)) result[section] = score;
    }
    return result;
  }, [inputs]);

  const sectionLevels = useMemo(() => {
    if (!calculated) return {} as Partial<Record<TcfSection, NclcLevel | null>>;
    const levels: Partial<Record<TcfSection, NclcLevel | null>> = {};
    for (const section of ALL_SECTIONS) {
      const score = parsedScores[section];
      levels[section] =
        score !== undefined ? officialScoreToNclc(section, score) : null;
    }
    return levels;
  }, [calculated, parsedScores]);

  const finalNclc = useMemo(
    () => (calculated ? computeFinalNclc(sectionLevels) : null),
    [calculated, sectionLevels]
  );

  const eligibility = useMemo(
    () => getExpressEntryEligibility(sectionLevels),
    [sectionLevels]
  );

  const handleCalculate = () => {
    const newErrors: Partial<Record<TcfSection, string>> = {};
    for (const section of ALL_SECTIONS) {
      const raw = inputs[section].trim();
      if (!raw) {
        newErrors[section] = "Score requis.";
        continue;
      }
      const score = parseInt(raw, 10);
      const { min, max } = OFFICIAL_SCORE_RANGES[section];
      if (!isOfficialScore(section, score)) {
        newErrors[section] = `Entrez un score entre ${min} et ${max}.`;
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setCalculated(true);
    }
  };

  const handleClear = () => {
    setInputs(EMPTY_INPUTS);
    setCalculated(false);
    setErrors({});
  };

  const updateInput = (section: TcfSection, value: string) => {
    setInputs((prev) => ({ ...prev, [section]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[section];
      return next;
    });
    setCalculated(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {ALL_SECTIONS.map((section) => {
                const Icon = SECTION_ICONS[section];
                const { min, max } = OFFICIAL_SCORE_RANGES[section];
                return (
                  <div key={section} className="space-y-2">
                    <Label
                      htmlFor={`nclc-${section}`}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {SECTION_LABELS[section]}
                    </Label>
                    <Input
                      id={`nclc-${section}`}
                      type="number"
                      min={min}
                      max={max}
                      placeholder={`${min}–${max}`}
                      value={inputs[section]}
                      onChange={(e) => updateInput(section, e.target.value)}
                    />
                    {errors[section] && (
                      <p className="text-xs text-destructive">
                        {errors[section]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCalculate}>
                <Check className="mr-2 h-4 w-4" />
                Calculer mon niveau
              </Button>
              <Button variant="outline" size="icon" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" />
              Vos niveaux NCLC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-300">NCLC Final</p>
                  {finalNclc !== null ? (
                    <p className="text-lg font-medium">
                      {nclcToCefrLabel(finalNclc)}
                    </p>
                  ) : (
                    <p className="text-lg font-medium text-slate-400">—</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Niveau le plus bas des quatre compétences
                  </p>
                </div>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/10 text-3xl font-bold">
                  {finalNclc ?? "—"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {ALL_SECTIONS.map((section) => {
                const Icon = SECTION_ICONS[section];
                const score = parsedScores[section];
                const level = calculated ? sectionLevels[section] : null;
                return (
                  <div
                    key={section}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {SECTION_LABELS[section]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Score: {calculated && score !== undefined ? score : "—"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white",
                        level !== null && level !== undefined
                          ? NCLC_LEVEL_COLORS[level]
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {level ?? "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card
        className={cn(
          "border-blue-500/30",
          eligibility.variant === "success" && "bg-blue-500/5",
          eligibility.variant === "warning" && "bg-amber-500/5",
          eligibility.variant === "info" && "bg-muted/50"
        )}
      >
        <CardContent className="flex gap-3 pt-6">
          <Star
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0",
              eligibility.variant === "success"
                ? "text-blue-500"
                : "text-muted-foreground"
            )}
          />
          <div>
            <p className="font-medium">
              Éligibilité aux programmes d&apos;immigration
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {eligibility.message}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
