// Admin operations: sync fixtures/results from the provider and run settlements.
import { supabase } from "@/integrations/supabase/client";
import { activeProvider } from "@/lib/api/footballProvider";
import { ODDS } from "@/lib/game/config";
import { applyBalanceChange, getMatch, listMatches } from "@/lib/data/repository";
import type { ChampionBet, GoalBet, Match, MatchBet } from "@/types/domain";

/** 大会が開始済みか (いずれかの試合のキックオフを過ぎている) */
export async function isTournamentStarted(): Promise<boolean> {
  const matches = await listMatches();
  const now = Date.now();
  return matches.some((m) => new Date(m.kickoff_time).getTime() <= now || m.status !== "scheduled");
}

/** 試合同期: provider のフィクスチャを matches に upsert */
export async function syncFixtures(): Promise<number> {
  const fixtures = await activeProvider.getFixtures();
  let count = 0;
  for (const f of fixtures) {
    const { error } = await supabase.from("matches").upsert(
      {
        external_id: f.external_id,
        stage: f.stage,
        home_team: f.home_team,
        away_team: f.away_team,
        kickoff_time: f.kickoff_time,
      },
      { onConflict: "external_id" },
    );
    if (error) throw error;
    count++;
  }
  return count;
}

/** 結果同期: provider の結果を matches に反映 (精算はしない) */
export async function syncResults(): Promise<number> {
  const results = await activeProvider.getResults();
  let count = 0;
  for (const r of results) {
    const { error } = await supabase
      .from("matches")
      .update({
        home_score: r.home_score,
        away_score: r.away_score,
        winner: r.winner,
        scorers: r.scorers,
        status: "finished",
      })
      .eq("external_id", r.external_id);
    if (error) throw error;
    count++;
  }
  return count;
}

/** 1試合の精算 */
async function settleMatch(match: Match): Promise<void> {
  if (!match.winner || match.status !== "finished") return;
  const label = `${match.home_team} vs ${match.away_team}`;

  const { data: mb } = await supabase
    .from("match_bets")
    .select("*")
    .eq("match_id", match.id)
    .eq("settled", false);
  for (const bet of (mb as MatchBet[]) ?? []) {
    const win = bet.pick === match.winner;
    const payout = win ? bet.amount * ODDS.match : 0;
    await supabase.from("match_bets").update({ settled: true, payout }).eq("id", bet.id);
    if (payout > 0) {
      await applyBalanceChange(bet.user_id, payout, "payout", `勝敗的中: ${label}`);
    }
  }

  const { data: gb } = await supabase
    .from("goal_bets")
    .select("*")
    .eq("match_id", match.id)
    .eq("settled", false);
  for (const bet of (gb as GoalBet[]) ?? []) {
    const hit = match.scorers.includes(bet.player_name);
    const payout = hit ? bet.amount * ODDS.goal : 0;
    await supabase.from("goal_bets").update({ settled: true, payout }).eq("id", bet.id);
    if (payout > 0) {
      await applyBalanceChange(bet.user_id, payout, "payout", `ゴール的中 (${bet.player_name}): ${label}`);
    }
  }

  await supabase.from("matches").update({ settled: true }).eq("id", match.id);
}

/** 精算実行: 未精算の終了試合をすべて精算 */
export async function runSettlement(): Promise<number> {
  const matches = await listMatches();
  let count = 0;
  for (const m of matches) {
    if (m.status === "finished" && m.winner && !m.settled) {
      await settleMatch(m);
      count++;
    }
  }
  return count;
}

/** 再精算: 1試合の精算を取り消してやり直す */
export async function reSettleMatch(matchId: string): Promise<void> {
  const match = await getMatch(matchId);
  const label = `${match.home_team} vs ${match.away_team}`;

  const { data: mb } = await supabase
    .from("match_bets")
    .select("*")
    .eq("match_id", matchId)
    .eq("settled", true);
  for (const bet of (mb as MatchBet[]) ?? []) {
    if (bet.payout > 0) {
      await applyBalanceChange(bet.user_id, -bet.payout, "adjust", `再精算による取消: ${label}`);
    }
    await supabase.from("match_bets").update({ settled: false, payout: 0 }).eq("id", bet.id);
  }

  const { data: gb } = await supabase
    .from("goal_bets")
    .select("*")
    .eq("match_id", matchId)
    .eq("settled", true);
  for (const bet of (gb as GoalBet[]) ?? []) {
    if (bet.payout > 0) {
      await applyBalanceChange(bet.user_id, -bet.payout, "adjust", `再精算による取消 (${bet.player_name})`);
    }
    await supabase.from("goal_bets").update({ settled: false, payout: 0 }).eq("id", bet.id);
  }

  await supabase.from("matches").update({ settled: false }).eq("id", matchId);
  const fresh = await getMatch(matchId);
  await settleMatch(fresh);
}

/** 優勝国精算: 管理者が優勝チームを指定して精算 */
export async function settleChampion(championTeam: string): Promise<number> {
  const { data: cb } = await supabase
    .from("champion_bets")
    .select("*")
    .eq("settled", false);
  let count = 0;
  for (const bet of (cb as ChampionBet[]) ?? []) {
    const hit = bet.team === championTeam;
    const mult = ODDS.champion[bet.rank] ?? 0;
    const payout = hit ? bet.amount * mult : 0;
    await supabase.from("champion_bets").update({ settled: true, payout }).eq("id", bet.id);
    if (payout > 0) {
      await applyBalanceChange(bet.user_id, payout, "payout", `優勝的中 第${bet.rank}候補: ${championTeam}`);
    }
    count++;
  }
  return count;
}
/** 手動結果更新: プロバイダーを介さず直接スコアを更新し、精算を実行 */
export async function manualUpdateMatch(
  matchId: string,
  homeScore: number,
  awayScore: number,
  winner: string
): Promise<void> {
  const { error } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      winner: winner,
      status: "finished",
    })
    .eq("id", matchId);

  if (error) throw error;

  // 試合データを再取得して精算処理を走らせる
  const fresh = await getMatch(matchId);
  await settleMatch(fresh);
}
