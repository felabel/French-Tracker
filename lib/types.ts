export type TcfSection = "CO" | "CE" | "EO" | "EE";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type NclcLevel = 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Profile {
  id: string;
  displayName: string;
  createdAt: string;
  targets?: Partial<Record<TcfSection, number>>;
  nclcTargets?: Partial<Record<TcfSection, NclcLevel>>;
}

export interface ScoreEntry {
  id: string;
  date: string;
  section: TcfSection;
  score: number;
  maxScore: 699;
  notes?: string;
  createdAt: string;
}

export interface EcritureEntry {
  id: string;
  date: string;
  subject: string;
  prompt: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserExportData {
  profile: Profile;
  scores: ScoreEntry[];
  ecritures?: EcritureEntry[];
  exportedAt: string;
}

export const TCF_MAX_SCORE = 699 as const;
export const TCF_MIN_SCORE = 100 as const;

export const ALL_SECTIONS: TcfSection[] = ["CO", "CE", "EO", "EE"];
