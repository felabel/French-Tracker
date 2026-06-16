import { NclcLevel, TcfSection } from "./types";

/**
 * TCF Canada score → NCLC conversion tables.
 * CE & CO: IRCC official equivalency chart (canada.ca).
 * EE & EO: /699 concordance aligned with IRCC expression scale equivalents.
 * @see https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/operational-bulletins-manuals/standard-requirements/language-requirements/test-equivalency-charts.html
 */
type NclcBand = { min: number; level: NclcLevel };

export const NCLC_TABLES: Record<TcfSection, NclcBand[]> = {
  CE: [
    { min: 549, level: 10 },
    { min: 524, level: 9 },
    { min: 499, level: 8 },
    { min: 453, level: 7 },
    { min: 406, level: 6 },
    { min: 375, level: 5 },
    { min: 342, level: 4 },
  ],
  CO: [
    { min: 549, level: 10 },
    { min: 523, level: 9 },
    { min: 503, level: 8 },
    { min: 458, level: 7 },
    { min: 398, level: 6 },
    { min: 369, level: 5 },
    { min: 331, level: 4 },
  ],
  EE: [
    { min: 558, level: 10 },
    { min: 512, level: 9 },
    { min: 472, level: 8 },
    { min: 428, level: 7 },
    { min: 379, level: 6 },
    { min: 330, level: 5 },
    { min: 268, level: 4 },
  ],
  EO: [
    { min: 556, level: 10 },
    { min: 518, level: 9 },
    { min: 494, level: 8 },
    { min: 456, level: 7 },
    { min: 422, level: 6 },
    { min: 387, level: 5 },
    { min: 328, level: 4 },
  ],
};

export const ALL_NCLC_LEVELS: NclcLevel[] = [4, 5, 6, 7, 8, 9, 10];

/** Official TCF Canada attestation score ranges (IRCC equivalency chart). */
export const OFFICIAL_SCORE_RANGES: Record<
  TcfSection,
  { min: number; max: number }
> = {
  CO: { min: 331, max: 699 },
  CE: { min: 342, max: 699 },
  EO: { min: 4, max: 20 },
  EE: { min: 4, max: 20 },
};

const EXPRESSION_NCLC_BANDS: { min: number; level: NclcLevel }[] = [
  { min: 16, level: 10 },
  { min: 14, level: 9 },
  { min: 12, level: 8 },
  { min: 10, level: 7 },
  { min: 7, level: 6 },
  { min: 6, level: 5 },
  { min: 4, level: 4 },
];

export function isOfficialScore(
  section: TcfSection,
  score: number
): boolean {
  const { min, max } = OFFICIAL_SCORE_RANGES[section];
  return (
    Number.isFinite(score) &&
    Number.isInteger(score) &&
    score >= min &&
    score <= max
  );
}

export function officialScoreToNclc(
  section: TcfSection,
  score: number
): NclcLevel | null {
  if (section === "EO" || section === "EE") {
    for (const band of EXPRESSION_NCLC_BANDS) {
      if (score >= band.min) return band.level;
    }
    return null;
  }
  return scoreToNclc(section, score);
}

export function nclcToCefrLabel(level: NclcLevel): string {
  const labels: Record<NclcLevel, string> = {
    4: "A2",
    5: "B1",
    6: "B1",
    7: "B2",
    8: "B2 Avancé",
    9: "C1",
    10: "C1-C2",
  };
  return labels[level];
}

export function computeFinalNclc(
  levels: Partial<Record<TcfSection, NclcLevel | null>>
): NclcLevel | null {
  const values = (["CO", "CE", "EO", "EE"] as TcfSection[])
    .map((s) => levels[s])
    .filter((l): l is NclcLevel => l !== null && l !== undefined);
  if (values.length !== 4) return null;
  return Math.min(...values) as NclcLevel;
}

export function getExpressEntryEligibility(
  levels: Partial<Record<TcfSection, NclcLevel | null>>
): {
  allComplete: boolean;
  finalNclc: NclcLevel | null;
  message: string;
  variant: "success" | "info" | "warning";
} {
  const sections: TcfSection[] = ["CO", "CE", "EO", "EE"];
  const allComplete = sections.every(
    (s) => levels[s] !== null && levels[s] !== undefined
  );

  if (!allComplete) {
    return {
      allComplete: false,
      finalNclc: null,
      message:
        "Entrez vos quatre scores TCF Canada pour voir votre éligibilité aux programmes d'immigration.",
      variant: "info",
    };
  }

  const finalNclc = computeFinalNclc(levels);
  if (finalNclc === null) {
    return {
      allComplete: false,
      finalNclc: null,
      message:
        "Entrez vos quatre scores TCF Canada pour voir votre éligibilité aux programmes d'immigration.",
      variant: "info",
    };
  }

  const allAtLeast7 = sections.every((s) => (levels[s] as NclcLevel) >= 7);
  const allAtLeast5 = sections.every((s) => (levels[s] as NclcLevel) >= 5);

  if (allAtLeast7) {
    return {
      allComplete: true,
      finalNclc,
      message:
        "Bon niveau ! Vous atteignez le minimum requis pour l'Entrée Express (NCLC 7 dans les quatre compétences).",
      variant: "success",
    };
  }

  if (allAtLeast5) {
    return {
      allComplete: true,
      finalNclc,
      message:
        "Niveau intermédiaire. Vous atteignez NCLC 5+ partout — suffisant pour certains programmes, mais l'Entrée Express exige NCLC 7 dans chaque compétence.",
      variant: "info",
    };
  }

  return {
    allComplete: true,
    finalNclc,
    message:
      "Continuez à vous entraîner. La plupart des programmes d'immigration fédéraux exigent au minimum NCLC 5 à NCLC 7 selon le programme.",
    variant: "warning",
  };
}

export function scoreToNclc(
  section: TcfSection,
  score: number
): NclcLevel | null {
  const bands = NCLC_TABLES[section];
  for (const band of bands) {
    if (score >= band.min) return band.level;
  }
  return null;
}

export function formatNclc(level: NclcLevel | null): string {
  if (level === null) return "Below NCLC 4";
  return `NCLC ${level}`;
}

export function getMinScoreForNclc(
  section: TcfSection,
  level: NclcLevel
): number {
  const band = NCLC_TABLES[section].find((b) => b.level === level);
  return band?.min ?? 342;
}

export function getNclcProgress(
  section: TcfSection,
  score: number,
  target: NclcLevel
): number {
  const minScore = getMinScoreForNclc(section, target);
  return Math.min(100, (score / minScore) * 100);
}
