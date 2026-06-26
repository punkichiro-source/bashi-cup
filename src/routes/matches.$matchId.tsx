import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import {
  getMatch,
  getUserGoalBets,
  getUserMatchBet,
  saveGoalBets,
  saveMatchBet,
} from "@/lib/data/repository";
import { formatKickoff } from "@/lib/format";
import { GAME } from "@/lib/game/config";
import type { Side } from "@/types/domain";

export const Route = createFileRoute("/matches/$matchId")({
  head: () => ({ meta: [{ title: "試合詳細 — BASHI CUP 2026" }] }),
  component: MatchDetailPage,
});

interface GoalRow {
  player_name: string;
  amount: string;
}

function MatchDetailPage() {
  const { matchId } = useParams({ from: "/matches/$matchId" });
  const { user, refresh } = useSession();
  const uid = user?.id ?? "";
  const qc = useQueryClient();

  const { data: match } = useQuery({ queryKey: ["match", matchId], queryFn: () => getMatch(matchId) });
  const { data: matchBet } = useQuery({
    queryKey: ["matchBet", uid, matchId],
    queryFn: () => getUserMatchBet(uid, matchId),
    enabled: !!uid,
  });
  const { data: goalBets } = useQuery({
    queryKey: ["goalBets", uid, matchId],
    queryFn: () => getUserGoalBets(uid, matchId),
    enabled: !!uid,
  });

  const [pick, setPick] = useState<Side | null>(null);
  const [amount, setAmount] = useState("");
  const [rows, setRows] = useState<GoalRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (matchBet) {
      setPick(matchBet.pick);
      setAmount(String(matchBet.amount));
    }
  }, [matchBet]);

  useEffect(() => {
    if (goalBets) {
      setRows(goalBets.map((g) => ({ player_name: g.player_name, amount: String(g.amount) })));
    }
  }, [goalBets]);

  if (!match) {
    return (
      <AppShell title="試合詳細">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </AppShell>
    );
  }

  const editable = match.status === "scheduled";

  async function saveWinPrediction() {
    if (!editable || !pick || !match) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("ベット金額を入力してください");
    if (user && amt > user.balance + (matchBet?.amount ?? 0))
      return toast.error("残高が不足しています");
    setSaving(true);
    try {
      await saveMatchBet(uid, match, pick, amt);
      await refresh();
      qc.invalidateQueries();
      toast.success("勝敗予想を保存しました");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function saveGoals() {
    if (!editable || !match) return;
    const cleaned = rows
      .filter((r) => r.player_name.trim() && Number(r.amount) > 0)
      .map((r) => ({ player_name: r.player_name.trim(), amount: Number(r.amount) }));
    if (cleaned.length > GAME.maxGoalBetsPerMatch)
      return toast.error(`選手は最大${GAME.maxGoalBetsPerMatch}人までです`);
    setSaving(true);
    try {
      await saveGoalBets(uid, match, cleaned);
      await refresh();
      qc.invalidateQueries();
      toast.success("ゴール予想を保存しました");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  function updateRow(i: number, patch: Partial<GoalRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <AppShell title="試合詳細">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-center text-xs text-primary">{match.stage}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="font-display text-2xl">{match.home_team}</p>
            <p className="text-[10px] text-muted-foreground">HOME</p>
          </div>
          <div className="px-2 text-center">
            {match.status === "finished" ? (
              <p className="text-2xl font-semibold text-primary">
                {match.home_score} - {match.away_score}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">vs</p>
            )}
          </div>
          <div className="flex-1 text-center">
            <p className="font-display text-2xl">{match.away_team}</p>
            <p className="text-[10px] text-muted-foreground">AWAY</p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {formatKickoff(match.kickoff_time)} キックオフ
        </p>
      </div>

      {match.status === "finished" && (
        <div className="mt-4 rounded-xl border border-success/40 bg-card p-4 text-sm">
          <p className="text-success">
            勝ち抜け: {match.winner === "HOME" ? match.home_team : match.away_team}
          </p>
          <p className="mt-2 text-muted-foreground">得点者 (90分+延長):</p>
          <p>{match.scorers.length ? match.scorers.join("、") : "なし"}</p>
        </div>
      )}

      {/* 勝敗予想 */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium">勝敗予想 <span className="text-xs text-muted-foreground">({GAME.currency} 配当 x2)</span></h2>
        <div className="grid grid-cols-2 gap-2">
          {(["HOME", "AWAY"] as Side[]).map((s) => (
            <button
              key={s}
              disabled={!editable}
              onClick={() => setPick(s)}
              className={`rounded-xl border py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                pick === s ? "border-primary bg-accent/50 text-primary" : "border-border bg-card"
              }`}
            >
              {s === "HOME" ? match.home_team : match.away_team}
              <span className="block text-[10px] text-muted-foreground">{s} 勝ち抜け</span>
            </button>
          ))}
        </div>
        <input
          disabled={!editable}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          placeholder="ベット金額"
          className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-50"
        />
        {editable && (
          <button
            onClick={saveWinPrediction}
            disabled={saving}
            className="mt-2 w-full rounded-xl gold-gradient py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            勝敗予想を保存
          </button>
        )}
      </section>

      {/* ゴール予想 */}
      <section className="mt-6">
        <h2 className="mb-1 text-sm font-medium">
          ゴール予想 <span className="text-xs text-muted-foreground">(最大{GAME.maxGoalBetsPerMatch}人・配当 x3)</span>
        </h2>
        <p className="mb-2 text-[11px] text-muted-foreground">※90分＋延長のみ対象。PK戦のゴールは対象外。</p>
        <div className="space-y-2">
          {Array.from({ length: GAME.maxGoalBetsPerMatch }).map((_, i) => {
            const row = rows[i] ?? { player_name: "", amount: "" };
            return (
              <div key={i} className="flex gap-2">
                <input
                  disabled={!editable}
                  value={row.player_name}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, player_name: e.target.value };
                    setRows(next);
                  }}
                  placeholder={`選手 ${i + 1}`}
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
                />
                <input
                  disabled={!editable}
                  inputMode="numeric"
                  value={row.amount}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, amount: e.target.value.replace(/\D/g, "") };
                    setRows(next);
                  }}
                  placeholder="金額"
                  className="w-24 rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
                />
              </div>
            );
          })}
        </div>
        {editable && (
          <button
            onClick={saveGoals}
            disabled={saving}
            className="mt-2 w-full rounded-xl border border-primary py-3 text-sm font-semibold text-primary disabled:opacity-40"
          >
            ゴール予想を保存
          </button>
        )}
      </section>
    </AppShell>
  );
}
