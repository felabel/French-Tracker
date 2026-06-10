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
