import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
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
  const navigate = useNavigate();

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

  // 閉じる処理（試合一覧に戻す）
  const handleClose = () => {
    navigate({ to: "/matches" });
  };

  if (!match) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* 背景部分をタップしても閉じられるようにする */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* ポップアップコンテンツ本体（スマホ最適化の引き出し型） */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-card p-6 pb-12 border-t border-border/60 shadow-2xl transition-transform animate-in fade-in slide-in-from-bottom duration-200">
        {/* 上部のつまみライン */}
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" onClick={handleClose} />
        
        {/* 閉じるボタン */}
        <button 
          onClick={handleClose} 
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="rounded-xl border border-border bg-background p-4 mt-2">
          <p className="text-center text-xs text-primary font-semibold">{match.stage}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex-1 text-center">
              <p className="font-display text-xl font-bold">{match.home_team}</p>
              <p className="text-[10px] text-muted-foreground">HOME</p>
            </div>
            <div className="px-2 text-center">
              {match.status === "finished" ? (
                <p className="text-xl font-semibold text-primary">
                  {match.home_score} - {match.away_score}
                </p>
              ) : (
                <p className="text-sm font-bold text-muted-foreground">VS</p>
              )}
            </div>
            <div className="flex-1 text-center">
              <p className="font-display text-xl font-bold">{match.away_team}</p>
              <p className="text-[10px] text-muted-foreground">AWAY</p>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {formatKickoff(match.kickoff_time)} キックオフ
          </p>
        </div>

        {match.status === "finished" && (
          <div className="mt-4 rounded-xl border border-success/40 bg-background p-4 text-sm">
            <p className="text-success font-semibold">
              勝ち抜け: {match.winner === "HOME" ? match.home_team : match.away_team}
            </p>
            <p className="mt-2 text-muted-foreground">得点者:</p>
            <p>{match.scorers.length ? match.scorers.join("、") : "なし"}</p>
          </div>
        )}

        {/* 勝敗予想 */}
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            勝敗予想 <span className="text-[11px] text-primary-foreground/60">(配当 x2)</span>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {(["HOME", "AWAY"] as Side[]).map((s) => (
              <button
                key={s}
                disabled={!editable}
                onClick={() => setPick(s)}
                className={`rounded-xl border py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  pick === s ? "border-primary bg-primary/10 text-primary font-bold" : "border-border bg-background"
                }`}
              >
                {s === "HOME" ? match.home_team : match.away_team}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              disabled={!editable}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="ベット金額 (BASHI)"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
            />
            {editable && (
              <button
                onClick={saveWinPrediction}
                disabled={saving || !pick}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                保存
              </button>
            )}
          </div>
        </section>

        {/* ゴール予想 */}
        <section className="mt-5">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            ゴール予想 <span className="text-[11px] text-primary-foreground/60">(最大{GAME.maxGoalBetsPerMatch}人・x3)</span>
          </h2>
          <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
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
                    placeholder={`選手名 ${i + 1}`}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
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
                    className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
                  />
                </div>
              );
            })}
          </div>
          {editable && (
            <button
              onClick={saveGoals}
              disabled={saving}
              className="mt-2 w-full rounded-xl border border-primary/60 py-2 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-40"
            >
              ゴール予想を保存
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
