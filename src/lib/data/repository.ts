// Data access layer. All Supabase queries live here so components stay clean.
import { supabase } from "@/integrations/supabase/client";
import type {
  AppUser,
  ChampionBet,
  GoalBet,
  Match,
  MatchBet,
  Transaction,
  Side,
} from "@/types/domain";

function unwrap<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

// ---- Users ----
export async function listUsers(): Promise<AppUser[]> {
  return unwrap(await supabase.from("users").select("*").order("name")) as AppUser[];
}

export async function getUser(id: string): Promise<AppUser> {
  return unwrap(await supabase.from("users").select("*").eq("id", id).single()) as AppUser;
}

export async function verifyPin(userId: string, pin: string): Promise<AppUser | null> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("pin", pin)
    .maybeSingle();
  return (data as AppUser) ?? null;
}

export async function changePin(userId: string, newPin: string): Promise<void> {
  const { error } = await supabase.from("users").update({ pin: newPin }).eq("id", userId);
  if (error) throw error;
}

export async function rankedUsers(): Promise<AppUser[]> {
  return unwrap(
    await supabase.from("users").select("*").order("balance", { ascending: false }),
  ) as AppUser[];
}

// ---- Matches ----
export async function listMatches(): Promise<Match[]> {
  return unwrap(
    await supabase.from("matches").select("*").order("kickoff_time"),
  ) as Match[];
}

export async function getMatch(id: string): Promise<Match> {
  return unwrap(await supabase.from("matches").select("*").eq("id", id).single()) as Match;
}

export async function nextMatch(): Promise<Match | null> {
  const { data } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "scheduled")
    .gt("kickoff_time", new Date().toISOString())
    .order("kickoff_time")
    .limit(1)
    .maybeSingle();
  return (data as Match) ?? null;
}

// ---- Bets ----
export async function listMatchBetsForMatch(matchId: string): Promise<MatchBet[]> {
  return unwrap(
    await supabase.from("match_bets").select("*").eq("match_id", matchId),
  ) as MatchBet[];
}

export async function getUserMatchBet(userId: string, matchId: string): Promise<MatchBet | null> {
  const { data } = await supabase
    .from("match_bets")
    .select("*")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .maybeSingle();
  return (data as MatchBet) ?? null;
}

export async function getUserGoalBets(userId: string, matchId: string): Promise<GoalBet[]> {
  return unwrap(
    await supabase
      .from("goal_bets")
      .select("*")
      .eq("user_id", userId)
      .eq("match_id", matchId),
  ) as GoalBet[];
}

export async function getUserChampionBets(userId: string): Promise<ChampionBet[]> {
  return unwrap(
    await supabase.from("champion_bets").select("*").eq("user_id", userId).order("rank"),
  ) as ChampionBet[];
}

// ---- Transactions ----
export async function listTransactions(userId: string): Promise<Transaction[]> {
  return unwrap(
    await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ) as Transaction[];
}

// ---- Balance + transaction helper ----
export async function applyBalanceChange(
  userId: string,
  delta: number,
  type: Transaction["type"],
  description: string,
): Promise<number> {
  const user = await getUser(userId);
  const newBalance = user.balance + delta;
  const { error: uErr } = await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("id", userId);
  if (uErr) throw uErr;
  const { error: tErr } = await supabase.from("transactions").insert({
    user_id: userId,
    type,
    description,
    amount: delta,
    balance_after: newBalance,
  });
  if (tErr) throw tErr;
  return newBalance;
}

// ---- Save match bet (edit allowed before kickoff) ----
export async function saveMatchBet(
  userId: string,
  match: Match,
  pick: Side,
  amount: number,
): Promise<void> {
  if (match.status !== "scheduled") throw new Error("試合開始後は変更できません");
  const existing = await getUserMatchBet(userId, match.id);
  const label = `${match.home_team} vs ${match.away_team}`;
  if (existing) {
    await applyBalanceChange(userId, existing.amount, "refund", `勝敗予想取消: ${label}`);
    await supabase.from("match_bets").delete().eq("id", existing.id);
  }
  await applyBalanceChange(userId, -amount, "bet", `勝敗予想 (${pick}): ${label}`);
  const { error } = await supabase.from("match_bets").insert({
    user_id: userId,
    match_id: match.id,
    pick,
    amount,
  });
  if (error) throw error;
}

// ---- Save goal bets (replace all for the match) ----
export async function saveGoalBets(
  userId: string,
  match: Match,
  bets: { player_name: string; amount: number }[],
): Promise<void> {
  if (match.status !== "scheduled") throw new Error("試合開始後は変更できません");
  const label = `${match.home_team} vs ${match.away_team}`;
  const existing = await getUserGoalBets(userId, match.id);
  for (const e of existing) {
    await applyBalanceChange(userId, e.amount, "refund", `ゴール予想取消 (${e.player_name})`);
  }
  await supabase.from("goal_bets").delete().eq("user_id", userId).eq("match_id", match.id);
  for (const b of bets) {
    if (b.amount <= 0 || !b.player_name) continue;
    await applyBalanceChange(userId, -b.amount, "bet", `ゴール予想 (${b.player_name}): ${label}`);
    const { error } = await supabase.from("goal_bets").insert({
      user_id: userId,
      match_id: match.id,
      player_name: b.player_name,
      amount: b.amount,
    });
    if (error) throw error;
  }
}

// ---- Save champion bets (only before tournament starts) ----
export async function saveChampionBets(
  userId: string,
  bets: { rank: number; team: string; amount: number }[],
): Promise<void> {
  const existing = await getUserChampionBets(userId);
  for (const e of existing) {
    await applyBalanceChange(userId, e.amount, "refund", `優勝予想取消 (第${e.rank}候補)`);
  }
  await supabase.from("champion_bets").delete().eq("user_id", userId);
  for (const b of bets) {
    if (b.amount <= 0 || !b.team) continue;
    await applyBalanceChange(userId, -b.amount, "bet", `優勝予想 第${b.rank}候補: ${b.team}`);
    const { error } = await supabase.from("champion_bets").insert({
      user_id: userId,
      match_id: null,
      rank: b.rank,
      team: b.team,
      amount: b.amount,
    });
    if (error) throw error;
  }
}

// ---- 選手一覧をDBから安全に取得（エラー完全防御・トグル選択式用） ----
export async function listPlayers(): Promise<{ id: string; name: string; team: string }[]> {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("id, name, team")
      .order("name");
    
    if (error) {
      console.error("playersテーブル読み込み時のエラーを検出しました:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("listPlayersメソッドのフェイルセーフが作動しました:", e);
    return [];
  }
}

// ---- 管理者用：試合結果と得点者を保存する ----
export async function updateMatchResult(
  matchId: string,
  updates: {
    home_score: number;
    away_score: number;
    status: "scheduled" | "live" | "finished";
    winner: "HOME" | "AWAY" | null;
    scorers: string[]; // 選択された得点者（名前の配列）
  }
): Promise<void> {
  const { error } = await supabase
    .from("matches")
    .update({
      home_score: updates.home_score,
      away_score: updates.away_score,
      status: updates.status,
      winner: updates.winner,
      scorers: updates.scorers,
    })
    .eq("id", matchId);

  if (error) throw error;
}
