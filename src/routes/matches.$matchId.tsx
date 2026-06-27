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
  listPlayers, // 💡 連動用に新設した関数を追加インポート
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

  // 💡 事前登録された選手マスターデータを安全に取得
  const { data: allPlayers = [] } = useQuery({ queryKey: ["players"], queryFn: listPlayers });

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

  const handleClose = () => {
    navigate({ to: "/matches" });
  };

  if (!match) return null;

  const editable = match.status === "scheduled";

  // 💡 安全対策を施しつつ、この試合の両チームに所属する選手だけを厳選してフィルタリング
  const safePlayers = Array.isArray(allPlayers) ? allPlayers : [];
  const matchPlayers = safePlayers.filter(
    (p) => p && (p.team === match.home_team || p.team === match.away_team)
  );

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-card p-6 pb-12 border-t border-border/60 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" onClick={handleClose} />
        <button onClick={handleClose} className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" />
        </button>

        <div className="rounded-xl border border-border bg-background p-4 mt-2">
          <p className="text-center text-xs text-primary font-semibold">{match.stage}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex-1 text-center font-bold text-xl">{match.home_team}</div>
            <div className="px-2 text-sm font-bold text-muted-foreground">VS</div>
            <div className="flex-1 text-center font-bold text-xl">{match.away_team}</div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {formatKickoff(match.kickoff_time)} キックオフ
          </p>
        </div>

        {/* 試合終了後: 結果と自分の予想の的中/ハズレ表示 */}
        {match.status === "finished" && (
          <section className="mt-4 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-center gap-3 text-2xl font-bold">
              <span>{match.home_score ?? 0}</span>
              <span className="text-xs text-muted-foreground">FINAL</span>
              <span>{match.away_score ?? 0}</span>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {matchBet && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    勝敗予想: {matchBet.pick === "HOME" ? match.home_team : match.away_team}
                  </span>
                  {matchBet.payout > 0 ? (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      的中！ (+{matchBet.payout.toLocaleString()})
                    </span>
                  ) : (
                    <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      ハズレ
                    </span>
                  )}
                </div>
              )}
              {goalBets?.map((g) => (
                <div key={g.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">ゴール予想: {g.player_name}</span>
                  {g.payout > 0 ? (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      的中！ (+{g.payout.toLocaleString()})
                    </span>
                  ) : (
                    <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      ハズレ
                    </span>
                  )}
                </div>
              ))}
              {!matchBet && (!goalBets || goalBets.length === 0) && (
                <p className="text-center text-xs text-muted-foreground">この試合への予想はありません</p>
              )}
            </div>
          </section>
        )}


        {/* 勝敗予想 */}
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">勝敗予想</h2>
          <div className="grid grid-cols-2 gap-2">
            {(["HOME", "AWAY"] as Side[]).map((s) => (
              <button
                key={s}
                disabled={!editable}
                onClick={() => setPick(s)}
                className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
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
              placeholder="ベット金額"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={saveWinPrediction}
              disabled={saving || !pick || !editable}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              保存
            </button>
          </div>
        </section>

        {/* ゴール予想 */}
        <section className="mt-5">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            ゴール予想 (最大{GAME.maxGoalBetsPerMatch}人)
          </h2>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
            {Array.from({ length: GAME.maxGoalBetsPerMatch }).map((_, i) => {
              const row = rows[i] ?? { player_name: "", amount: "" };
              return (
                <div key={i} className="flex gap-2">
                  {/* 💡 テキスト型のinputから、セレクトボックス（プルダウン式）に安全変更 */}
                  <select
                    disabled={!editable}
                    value={row.player_name}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...row, player_name: e.target.value };
                      setRows(next);
                    }}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary text-left"
                  >
                    <option value="">選手を選択してください</option>
                    {matchPlayers.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.team === match.home_team ? "HOME" : "AWAY"})
                      </option>
                    ))}
                  </select>

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
                    className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              );
            })}
          </div>
          {editable && (
            <button
              onClick={saveGoals}
              disabled={saving}
              className="mt-2 w-full rounded-xl border border-primary/60 py-2 text-xs font-semibold text-primary"
            >
              ゴール予想を保存
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
