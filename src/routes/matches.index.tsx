import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { getMatch, getMatchBets, getGoalBets, saveMatchBet, saveGoalBets } from "@/lib/data/repository";
import { PAYOUT } from "@/lib/data/payout";
import { GAME } from "@/lib/config";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchPage,
});

type Side = "HOME" | "AWAY";

function MatchPage() {
  const { matchId } = Route.useParams();
  const qc = useQueryClient();
  
  const { data: match, isLoading: matchLoading } = useQuery({ 
    queryKey: ["match", matchId], 
    queryFn: () => getMatch(matchId) 
  });
  const { data: bets } = useQuery({ queryKey: ["bets", matchId], queryFn: () => getMatchBets(matchId) });
  const { data: goalBets = [] } = useQuery({ queryKey: ["goalBets", matchId], queryFn: () => getGoalBets(matchId) });

  const [pick, setPick] = useState<Side | "">("");
  const [rows, setRows] = useState<{ player_name: string; amount: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // データ取得後にrowsを正しく初期化する
  useEffect(() => {
    if (bets) setPick(bets.pick as Side);
    
    const initialRows = Array.from({ length: GAME.maxGoalBetsPerMatch }).map((_, i) => ({
      player_name: goalBets[i]?.player_name ?? "",
      amount: goalBets[i]?.amount?.toString() ?? ""
    }));
    setRows(initialRows);
  }, [bets, goalBets, GAME.maxGoalBetsPerMatch]);

  if (matchLoading) return <AppShell title="読み込み中...">読み込み中...</AppShell>;
  if (!match) return <AppShell title="エラー">試合が見つかりません</AppShell>;

  const editable = match.status === "pending";

  const handleSave = async () => {
    setSaving(true);
    try {
      if (pick) await saveMatchBet(matchId, pick, 1000);
      await saveGoalBets(matchId, rows.filter(r => r.player_name.trim() !== ""));
      qc.invalidateQueries({ queryKey: ["goalBets", matchId] });
      toast.success("予想を保存しました");
    } catch (e) {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4 space-y-6">
        {/* 勝敗予想 */}
        <section className="bg-card p-4 rounded-xl border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold">勝敗予想</h2>
            <span className="text-[10px] bg-primary/10 px-2 py-1 rounded-full text-primary font-bold">× {PAYOUT.MATCH_WIN}倍</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["HOME", "AWAY"] as Side[]).map((s) => (
              <button
                key={s}
                disabled={!editable}
                onClick={() => setPick(s)}
                className={`py-3 rounded-lg border text-sm transition-all ${
                  pick === s ? "border-primary bg-primary/10 text-primary font-bold" : "border-border"
                }`}
              >
                {s === "HOME" ? match.home_team : match.away_team}
              </button>
            ))}
          </div>
        </section>

        {/* ゴール予想 */}
        <section className="bg-card p-4 rounded-xl border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold">ゴール予想</h2>
            <span className="text-[10px] bg-primary/10 px-2 py-1 rounded-full text-primary font-bold">× {PAYOUT.SCORER_SINGLE}倍</span>
          </div>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input
                  disabled={!editable}
                  value={row.player_name}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, player_name: e.target.value };
                    setRows(next);
                  }}
                  placeholder="選手名"
                  className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background"
                />
                <input
                  disabled={!editable}
                  value={row.amount}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, amount: e.target.value.replace(/\D/g, "") };
                    setRows(next);
                  }}
                  placeholder="金額"
                  className="w-20 px-3 py-2 text-sm border rounded-lg bg-background"
                />
              </div>
            ))}
          </div>
        </section>

        {editable && (
          <button 
            disabled={saving}
            onClick={handleSave} 
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50"
          >
            {saving ? "保存中..." : "予想を保存"}
          </button>
        )}
      </div>
    </AppShell>
  );
}
