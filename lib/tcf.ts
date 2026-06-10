import {
  ALL_SECTIONS,
  CefrLevel,
  ScoreEntry,
  TCF_MAX_SCORE,
  TCF_MIN_SCORE,
  TcfSection,
} from "./types";

export const SECTION_LABELS: Record<TcfSection, string> = {
  CO: "Compréhension orale",
  CE: "Compréhension écrite",
  EO: "Expression orale",
  EE: "Expression écrite",
};

export const SECTION_COLORS: Record<TcfSection, string> = {
  CO: "#3b82f6",
  CE: "#8b5cf6",
  EO: "#f59e0b",
  EE: "#10b981",
};

export const CEFR_TARGETS: Record<CefrLevel, number> = {
  A1: 100,
  A2: 200,
  B1: 300,
  B2: 400,
  C1: 500,
  C2: 600,
};

export function scoreToPercent(score: number): number {
  return (score / TCF_MAX_SCORE) * 100;
}

export function formatPercent(score: number, digits = 1): string {
  return `${scoreToPercent(score).toFixed(digits)}%`;
}

export function scoreToCefr(score: number): CefrLevel {
  if (score >= 600) return "C2";
  if (score >= 500) return "C1";
  if (score >= 400) return "B2";
  if (score >= 300) return "B1";
  if (score >= 200) return "A2";
  return "A1";
}

export function deltaPercent(current: number, previous: number): number {
  return scoreToPercent(current) - scoreToPercent(previous);
}

export function formatDelta(delta: number, digits = 1): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(digits)}%`;
}

export function isValidScore(score: number): boolean {
  return (
    Number.isFinite(score) &&
    score >= TCF_MIN_SCORE &&
    score <= TCF_MAX_SCORE &&
    Number.isInteger(score)
  );
}

export function getSectionEntries(
  entries: ScoreEntry[],
  section: TcfSection
): ScoreEntry[] {
  return entries
    .filter((e) => e.section === section)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

export function getLatestBySection(
  entries: ScoreEntry[]
): Partial<Record<TcfSection, ScoreEntry>> {
  const result: Partial<Record<TcfSection, ScoreEntry>> = {};
  for (const section of ALL_SECTIONS) {
    const sectionEntries = getSectionEntries(entries, section);
    if (sectionEntries.length > 0) {
      result[section] = sectionEntries[sectionEntries.length - 1];
    }
  }
  return result;
}

export function getBestBySection(
  entries: ScoreEntry[]
): Partial<Record<TcfSection, ScoreEntry>> {
  const result: Partial<Record<TcfSection, ScoreEntry>> = {};
  for (const section of ALL_SECTIONS) {
    const sectionEntries = getSectionEntries(entries, section);
    if (sectionEntries.length > 0) {
      result[section] = sectionEntries.reduce((best, curr) =>
        curr.score > best.score ? curr : best
      );
    }
  }
  return result;
}

export function getPracticeDates(entries: ScoreEntry[]): string[] {
  return Array.from(new Set(entries.map((e) => e.date))).sort();
}

export function getStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const dateSet = new Set(dates);
  let streak = 0;
  const today = new Date();
  const cursor = new Date(today);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (dateSet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      const yesterday = cursor.toISOString().slice(0, 10);
      if (dateSet.has(yesterday)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    } else {
      break;
    }
  }

  return streak;
}

export function getDaysPracticedThisMonth(entries: ScoreEntry[]): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const dates = getPracticeDates(entries);
  return dates.filter((d) => {
    const date = new Date(d + "T00:00:00");
    return date.getMonth() === month && date.getFullYear() === year;
  }).length;
}

export function getWeakestSection(
  latest: Partial<Record<TcfSection, ScoreEntry>>
): TcfSection | null {
  let weakest: TcfSection | null = null;
  let lowest = Infinity;

  for (const section of ALL_SECTIONS) {
    const entry = latest[section];
    if (entry && entry.score < lowest) {
      lowest = entry.score;
      weakest = section;
    }
  }

  return weakest;
}

export interface ChartDataPoint {
  date: string;
  CO?: number;
  CE?: number;
  EO?: number;
  EE?: number;
}

export function buildTrendData(
  entries: ScoreEntry[],
  days: number
): ChartDataPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const filtered = entries.filter((e) => e.date >= cutoffStr);
  const dates = Array.from(new Set(filtered.map((e) => e.date))).sort();

  return dates.map((date) => {
    const point: ChartDataPoint = { date };
    for (const section of ALL_SECTIONS) {
      const dayEntries = filtered
        .filter((e) => e.date === date && e.section === section)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      if (dayEntries.length > 0) {
        const latest = dayEntries[dayEntries.length - 1];
        point[section] = Math.round(scoreToPercent(latest.score) * 10) / 10;
      }
    }
    return point;
  });
}

export interface RadarDataPoint {
  section: string;
  percent: number;
  fullMark: number;
}

export function buildRadarData(
  latest: Partial<Record<TcfSection, ScoreEntry>>
): RadarDataPoint[] {
  return ALL_SECTIONS.map((section) => {
    const entry = latest[section];
    return {
      section: section,
      percent: entry ? Math.round(scoreToPercent(entry.score) * 10) / 10 : 0,
      fullMark: 100,
    };
  });
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export function buildHeatmapData(
  entries: ScoreEntry[],
  weeks = 12
): HeatmapDay[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.date, (counts.get(entry.date) ?? 0) + 1);
  }

  const result: HeatmapDay[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7);

  const cursor = new Date(start);
  while (cursor <= today) {
    const date = cursor.toISOString().slice(0, 10);
    result.push({ date, count: counts.get(date) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

export function getRollingAverage(
  entries: ScoreEntry[],
  section: TcfSection,
  days: number
): number | null {
  const sectionEntries = getSectionEntries(entries, section);
  if (sectionEntries.length === 0) return null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = sectionEntries.filter((e) => e.date >= cutoffStr);

  if (recent.length === 0) return null;
  const avg = recent.reduce((sum, e) => sum + e.score, 0) / recent.length;
  return Math.round(avg);
}
