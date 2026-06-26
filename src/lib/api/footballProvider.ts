// Abstracted football data provider.
// Swap `activeProvider` to a real API client later without touching app code.

import type { Stage } from "@/types/domain";

export interface ProviderMatch {
  external_id: string;
  stage: Stage;
  home_team: string;
  away_team: string;
  kickoff_time: string; // ISO
}

export interface ProviderResult {
  external_id: string;
  home_score: number;
  away_score: number;
  /** PKを含めた最終勝者 */
  winner: "HOME" | "AWAY";
  /** 90分+延長の得点者 (PK戦は除外) */
  scorers: string[];
}

export interface FootballProvider {
  name: string;
  getFixtures(): Promise<ProviderMatch[]>;
  getResults(): Promise<ProviderResult[]>;
}

// ---------------------------------------------------------------------------
// Dummy provider (works offline). Replace with a real provider later.
// ---------------------------------------------------------------------------

function isoIn(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

const DUMMY_FIXTURES: ProviderMatch[] = [
  { external_id: "wc26-r32-01", stage: "Round of 32", home_team: "Brazil", away_team: "Japan", kickoff_time: isoIn(-48) },
  { external_id: "wc26-r32-02", stage: "Round of 32", home_team: "France", away_team: "Morocco", kickoff_time: isoIn(-40) },
  { external_id: "wc26-r32-03", stage: "Round of 32", home_team: "Argentina", away_team: "Croatia", kickoff_time: isoIn(3) },
  { external_id: "wc26-r32-04", stage: "Round of 32", home_team: "England", away_team: "USA", kickoff_time: isoIn(6) },
  { external_id: "wc26-r16-01", stage: "Round of 16", home_team: "Brazil", away_team: "France", kickoff_time: isoIn(30) },
  { external_id: "wc26-r16-02", stage: "Round of 16", home_team: "Argentina", away_team: "England", kickoff_time: isoIn(34) },
  { external_id: "wc26-qf-01", stage: "Quarter Finals", home_team: "Brazil", away_team: "Argentina", kickoff_time: isoIn(80) },
  { external_id: "wc26-sf-01", stage: "Semi Finals", home_team: "Brazil", away_team: "Spain", kickoff_time: isoIn(150) },
  { external_id: "wc26-3rd-01", stage: "Third Place", home_team: "Argentina", away_team: "Spain", kickoff_time: isoIn(200) },
  { external_id: "wc26-final-01", stage: "Final", home_team: "Brazil", away_team: "Germany", kickoff_time: isoIn(220) },
];

const DUMMY_RESULTS: ProviderResult[] = [
  {
    external_id: "wc26-r32-01",
    home_score: 2,
    away_score: 1,
    winner: "HOME",
    scorers: ["Vinicius Jr", "Rodrygo", "Mitoma"],
  },
  {
    external_id: "wc26-r32-02",
    home_score: 1,
    away_score: 1,
    winner: "AWAY", // PK勝ち
    scorers: ["Mbappe", "Hakimi"],
  },
];

class DummyProvider implements FootballProvider {
  name = "dummy";
  async getFixtures(): Promise<ProviderMatch[]> {
    return DUMMY_FIXTURES;
  }
  async getResults(): Promise<ProviderResult[]> {
    return DUMMY_RESULTS;
  }
}

// To use a real API, implement FootballProvider and assign it here.
export const activeProvider: FootballProvider = new DummyProvider();
