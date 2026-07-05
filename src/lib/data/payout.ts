import { supabase } from "@/integrations/supabase/client";
import { applyBalanceChange, getMatch } from "@/lib/data/repository";
import type { GoalBet, MatchBet } from "@/types/domain";

export const PAYOUT = {
  MATCH_WIN: 5,
  // 💡 ここを 5 から 20 に変更しました
  SCORER_SINGLE: 20, 
  CHAMPION_RANK_1: 20,
  CHAMPION_RANK_2: 10,
  CHAMPION_RANK_3: 5,
} as const;

export type PayoutConfig = typeof PAYOUT;

export interface MatchResult {
  home_score: number;
  away_score: number;
  winner: string; // "HOME" | "AWAY" | "draw" など
  scorers: string[];
}

export async function processPayout(matchId: string, result: MatchResult): Promise<void> {
  const match = await getMatch(matchId);
  const label = `${match.home_team} vs ${match.away_team}`;

  // 1. 勝敗のサイドを特定 ("HOME" | "AWAY" | "draw")
  let side: "HOME" | "AWAY" | "draw" = "draw";
  if (result.winner === "HOME" || result.winner === "AWAY" || result.winner === "draw") {
    side = result.winner as "HOME" | "AWAY" | "draw";
  } else if (result.winner === match.home_team) {
    side = "HOME";
  } else if (result.winner === match.away_team) {
    side = "AWAY";
  } else {
    // スコアから自動判定する安全弁
    side = result.home_score > result.away_score ? "HOME" : result.away_score > result.home_score ? "AWAY" : "draw";
  }

  // ==========================================
  // 【重要】再精算・修正対応のための払い戻し取消処理
  // ==========================================
  // すでに過去の精算(settled=true)で配当金(payout > 0)を受け取っているユーザーがいた場合、
  // その分の残高をマイナスして一度リセットします
  
  // ① 勝敗予想の過去配当を回収リセット
  const { data: oldMb } = await supabase
    .from("match_bets")
    .select("*")
    .eq("match_id", matchId)
    .eq("settled", true);

  for (const bet of (oldMb as MatchBet[]) ?? []) {
    if (bet.payout > 0) {
      await applyBalanceChange(bet.user_id, -bet.payout, "adjust", `再精算による勝敗配当の取消: ${label}`);
    }
  }

  // ② 得点者予想の過去配当を回収リセット
  const { data: oldGb } = await supabase
    .from("goal_bets")
    .select("*")
    .eq("match_id", matchId)
    .eq("settled", true);

  for (const bet of (oldGb as GoalBet[]) ?? []) {
    if (bet.payout > 0) {
      await applyBalanceChange(bet.user_id, -bet.payout, "adjust", `再精算によるゴール配当の取消 (${bet.player_name}): ${label}`);
    }
  }

  // ==========================================
  // 2. 試合情報の親テーブルを更新
  // ==========================================
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

  // ==========================================
  // 3. 最新の結果に基づき、全予想データ(すべて)を再計算
  // ==========================================
  
  // ① 勝敗予想の精算ループ
  const { data: mb } = await supabase
    .from("match_bets")
    .select("*")
    .eq("match_id", matchId);

  for (const bet of (mb as MatchBet[]) ?? []) {
    const win = bet.pick === side;
    const payout = win ? bet.amount * PAYOUT.MATCH_WIN : 0;
    
    await supabase.from("match_bets").update({ settled: true, payout }).eq("id", bet.id);
    
    if (payout > 0) {
      await applyBalanceChange(bet.user_id, payout, "payout", `勝敗的中: ${label}`);
    }
  }

  // ② 得点者（スコアラー）予想の精算ループ
  const { data: gb } = await supabase
    .from("goal_bets")
    .select("*")
    .eq("match_id", matchId);

  for (const bet of (gb as GoalBet[]) ?? []) {
    const hit = result.scorers?.includes(bet.player_name) ?? false;
    const payout = hit ? bet.amount * PAYOUT.SCORER_SINGLE : 0;
    
    await supabase.from("goal_bets").update({ settled: true, payout }).eq("id", bet.id);
    
    if (payout > 0) {
      await applyBalanceChange(bet.user_id, payout, "payout", `ゴール的中 (${bet.player_name}): ${label}`);
    }
  }

  // 最後に試合自体の全体の精算完了フラグを立てる
  await supabase.from("matches").update({ settled: true }).eq("id", matchId);
}
