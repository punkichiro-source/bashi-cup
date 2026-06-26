// Domain types for BASHI CUP 2026

export type Stage =
  | "Round of 32"
  | "Round of 16"
  | "Quarter Finals"
  | "Semi Finals"
  | "Third Place"
  | "Final";

export const STAGES: Stage[] = [
  "Round of 32",
  "Round of 16",
  "Quarter Finals",
  "Semi Finals",
  "Third Place",
  "Final",
];

export type MatchStatus = "scheduled" | "live" | "finished";
export type Side = "HOME" | "AWAY";

export interface AppUser {
  id: string;
  name: string;
  pin: string;
  balance: number;
  is_admin: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  external_id: string | null;
  stage: Stage;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  winner: Side | null;
  scorers: string[]; // 90min + extra time only (PK excluded)
  settled: boolean;
  created_at: string;
}

export interface MatchBet {
  id: string;
  user_id: string;
  match_id: string;
  pick: Side;
  amount: number;
  settled: boolean;
  payout: number;
  created_at: string;
  updated_at: string;
}

export interface GoalBet {
  id: string;
  user_id: string;
  match_id: string;
  player_name: string;
  amount: number;
  settled: boolean;
  payout: number;
  created_at: string;
  updated_at: string;
}

export interface ChampionBet {
  id: string;
  user_id: string;
  rank: number; // 1 | 2 | 3
  team: string;
  amount: number;
  settled: boolean;
  payout: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "bet" | "payout" | "refund" | "adjust";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  description: string;
  amount: number;
  balance_after: number;
  created_at: string;
}
