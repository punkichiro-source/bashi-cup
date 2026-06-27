import { supabase } from "@/integrations/supabase/client";
import { applyBalanceChange, getMatch } from "@/lib/data/repository";
import type { GoalBet, MatchBet } from "@/types/domain";

export const PAYOUT = {
  MATCH_WIN: 5,
  SCORER_SINGLE: 5,
  CHAMPION_RANK_1: 20,
  CHAMPION_RANK_2: 10,
  CHAMPION_RANK_3: 5,
} as const;

export type PayoutConfig = typeof PAYOUT;

export interface MatchResult {
  home_score: number;
  away_score: number;
  winner: string;
  scorers: string[];
}

export async function processPayout(matchId: string, result: MatchResult): Promise<void> {
  const match = await getMatch(matchId);
  const label = `${match.home_team} vs ${match.away_team}`;

  let side: "HOME" | "AWAY" | null = null;
  if (result.winner === "HOME" || result.winner === "AWAY") {
    side = result.winner;
  } else if (result.winner === match.home_team) {
    side = "HOME";
  } else if (result.winner === match.away_team) {
    side = "AWAY";
  }

  const { error: upErr } = await supabase
    .from("matches")
    .update({
      home_score: result.home_score,
      away_score: result.away_score,
      winner: side,
      scorers: result.scorers,
      status: "finished",
    })
    .eq("id", matchId);
  if (upErr) throw upErr;

  const { data: mb } = await supabase
    .from("match_bets")
    .select("*")
    .eq("match_id", matchId)
    .eq("settled", false);
  for (const bet of (mb as MatchBet[]) ?? []) {
    const win = side !== null && bet.pick === side;
    const payout = win ? bet.amount * PAYOUT.MATCH_WIN : 0;
    await supabase.from("match_bets").update({ settled: true, payout }).eq("id", bet.id);
    if (payout > 0) {
      await applyBalanceChange(bet.user_id, payout, "payout", `勝敗的中: ${label}`);
    }
  }

  const { data: gb } = await supabase
    .from("goal_bets")
    .select("*")
    .eq("match_id", matchId)
    .eq("settled", false);
  for (const bet of (gb as GoalBet[]) ?? []) {
    const hit = result.scorers?.includes(bet.player_name) ?? false;
    const payout = hit ? bet.amount * PAYOUT.SCORER_SINGLE : 0;
    await supabase.from("goal_bets").update({ settled: true, payout }).eq("id", bet.id);
    if (payout > 0) {
      await applyBalanceChange(bet.user_id, payout, "payout", `ゴール的中 (${bet.player_name}): ${label}`);
    }
  }

  await supabase.from("matches").update({ settled: true }).eq("id", matchId);
}
