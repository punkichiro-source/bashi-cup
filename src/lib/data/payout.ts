// 精算（配当）ロジック。配当倍率はここで一元管理する。
import { supabase } from "@/integrations/supabase/client";
import { applyBalanceChange, getMatch } from "@/lib/data/repository";
import type { GoalBet, MatchBet } from "@/types/domain";

// ---- 配当倍率定数 ----
export const PAYOUT = {
  MATCH_WIN: 5,
  SCORER_SINGLE: 5,
  CHAMPION_RANK_1: 20,
  CHAMPION_RANK_2: 10,
  CHAMPION_RANK_3: 5,
} as const;

export interface MatchResult {
  home_score: number;
  away_score: number;
  winner: string; // "HOME" | "AWAY" | チーム名 | "draw"
  scorers: string[];
}

/**
 * 試合結果を反映し、的中判定・配当計算・残高更新を行う。
 * 精算完了時に match.status = 'finished'、match.settled = true となる。
 */
export async function processPayout(matchId: string, result: MatchResult): Promise<void> {
  const match = await getMatch(matchId);
  const label = `${match.home_team} vs ${match.away_team}`;

  // winner を HOME / AWAY の側に正規化する
  let side: "HOME" | "AWAY" | null = null;
  if (result.winner === "HOME" || result.winner === "AWAY") {
    side = result.winner;
  } else if (result.winner === match.home_team) {
    side = "HOME";
  } else if (result.winner === match.away_team) {
    side = "AWAY";
  }

  // 1. 試合データを更新（status を finished に）
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

  // 2. 勝敗予想の精算（未精算のみ）
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

  // 3. ゴール（得点者）予想の精算（未精算のみ）
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

  // 4. 試合を精算済みにする
  await supabase.from("matches").update({ settled: true }).eq("id", matchId);
}
