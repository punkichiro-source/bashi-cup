import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import {
  getMatches,
  getUserGoalBets,
  getUserMatchBet,
  saveGoalBets,
  saveMatchBet,
} from "@/lib/data/repository";
import { formatKickoff } from "@/lib/format";
import { GAME } from "@/lib/game/config";
import type { Match, Side } from "@/types/domain";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

interface GoalRow {
  player_name: string;
  amount: string;
}

function MatchesPage() {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: getMatches,
  });

  // 選択された試合をローカルの状態で管理（これがポップアップのトリガーになります）
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  return (
    <AppShell title="試合一覧">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ROUND OF 32
            </h2>
            <div className="space-y-2">
              {matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center font-medium">{match.home_team}</div>
                    <div className="px-4 text-xs text-muted-foreground">vs</div>
                    <div className="flex-1 text-center font-medium">{match.away_team}</div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{formatKickoff(match.kickoff_time)}</span>
                    <span className="text-primary font-medium">予想受付中</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 試合が選択されたら、同じ画面上に強制的にポップアップを表示する */}
      {selectedMatch && (
        <BetModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </AppShell>
  );
}

// --- 予想入力ポップアップ（モーダル）コンポーネント ---
function BetModal({ match, onClose }: { match: Match; onClose: () => void }) {
  const { user, refresh } = useSession();
  const uid = user?.id ?? "";
  const qc = useQueryClient();

  const { data: matchBet } = useQuery({
    queryKey: ["matchBet", uid, match.id],
    queryFn: () => getUserMatchBet(uid, match.id),
    enabled: !!uid,
  });
  const { data: goalBets } = useQuery({
    queryKey: ["goalBets", uid, match.id],
    queryFn: () => getUserGoalBets(uid, match.id),
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

  const editable = match.status === "scheduled";

  async function saveWinPrediction() {
    if (!editable || !pick) return;
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
    if (!editable) return;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-card p-6 pb-12 border-t border-border/60 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted" onClick={onClose} />
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted">
          <X className="h-5 w-5" />
        </button>

        <div className="rounded-xl border border-border bg-background p-4 mt-2">
          <p className="text-center text-xs text-primary font-semibold">{match.stage}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex-1 text-center font-bold text-xl">{match.home_team}</div>
            <div className="px-2 text-sm font-bold text-muted-foreground">VS</div>
            <div className="flex-1 text-center font-bold text-xl">{match.away_team}</div>
          </div>
        </div>

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
              placeholder="ベット金額 (BASHI)"
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
                  <input
                    disabled={!editable}
                    value={row.player_name}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...row, player_name: e.target.value };
                      setRows(next);
                    }}
                    placeholder={`選手名 ${i + 1}`}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
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
                    className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
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
