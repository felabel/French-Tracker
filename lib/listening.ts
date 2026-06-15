import {
  ListeningDailyEntry,
  ScoreEntry,
  VocabEntry,
} from "./types";

export function countVocabAddedOnDate(
  vocabEntries: VocabEntry[],
  date: string
): number {
  return vocabEntries.filter((e) => e.createdAt.startsWith(date)).length;
}

export function getWeekRange(weekEnding: string): {
  start: string;
  end: string;
} {
  const end = new Date(weekEnding + "T12:00:00");
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: weekEnding,
  };
}

export function getThisSunday(): string {
  const today = new Date();
  const day = today.getDay();
  const sunday = new Date(today);
  if (day === 0) {
    return sunday.toISOString().slice(0, 10);
  }
  sunday.setDate(today.getDate() + (7 - day));
  return sunday.toISOString().slice(0, 10);
}

export function getDefaultWeekEnding(): string {
  const today = new Date();
  const day = today.getDay();
  if (day === 0) return today.toISOString().slice(0, 10);
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - day);
  return lastSunday.toISOString().slice(0, 10);
}

export function getMockCoScoreForWeek(
  scores: ScoreEntry[],
  weekEnding: string
): ScoreEntry | null {
  const { start, end } = getWeekRange(weekEnding);
  const matches = scores
    .filter(
      (s) =>
        s.section === "CO" &&
        s.isMockTest &&
        s.date >= start &&
        s.date <= end
    )
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    });
  return matches[0] ?? null;
}

export function getListeningWeekSummary(
  daily: ListeningDailyEntry[],
  weekEnding: string
): {
  daysLogged: number;
  totalTcfQuestions: number;
  totalDictationMinutes: number;
} {
  const { start, end } = getWeekRange(weekEnding);
  const inWeek = daily.filter((e) => e.date >= start && e.date <= end);
  return {
    daysLogged: inWeek.length,
    totalTcfQuestions: inWeek.reduce(
      (sum, e) => sum + e.formationTcfQuestions,
      0
    ),
    totalDictationMinutes: inWeek.reduce(
      (sum, e) => sum + e.dictationMinutes,
      0
    ),
  };
}

export function getCurrentWeekSummary(
  daily: ListeningDailyEntry[]
): ReturnType<typeof getListeningWeekSummary> {
  return getListeningWeekSummary(daily, getThisSunday());
}
