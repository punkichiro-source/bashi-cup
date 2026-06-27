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
  
  const { data: match, isLoading } = useQuery({ 
    queryKey: ["match", matchId], 
    queryFn: () => getMatch(matchId) 
  });
  const { data: bets } = useQuery({ queryKey: ["bets", matchId], queryFn: () => getMatchBets(matchId) });
  const { data: goalBets = [] } = useQuery({ queryKey: ["goalBets", matchId], queryFn: () => getGoalBets(matchId) });

  const [pick, setPick] = useState<Side | "">("");
  const [rows, setRows] = useState<{ player_name: string; amount: string }[]>([]);

  useEffect(() => {
    if (bets) setPick(bets.pick as Side);
    if (goalBets.length > 0) {
      setRows(goalBets.map(b => ({ player_name: b.player_name, amount: b.amount.toString() })));
    } else {
      // 初期状態を生成
      setRows(Array.from({ length: GAME.maxGoalBetsPerMatch }).map(() => ({ player_name: "", amount: "" })));
    }
  }, [bets, goalBets]);

  if (isLoading) return <AppShell>読み込み中...</AppShell>;
  if (!match) return <AppShell>試合が見つかりません</AppShell>;

  const editable = match.status === "pending";

  const handleSave = async () => {
    try {
      if (pick) await saveMatchBet(matchId, pick, 1000);
      await saveGoalBets(matchId, rows.filter(r => r.player_name && r.amount));
      qc.invalidateQueries();
      toast.success("保存しました");
    } catch (e) {
      toast.error("保存失敗");
    }
  };

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4 space-y-6">
        {/* 勝敗予想セクション */}
        <section className="bg-card p-4 rounded-xl border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold">勝敗予想</h2>
            <span className="text-xs bg-primary/10 px-2 py-1 rounded-full text-primary">× {PAYOUT.MATCH_WIN}倍</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["HOME", "AWAY"] as Side[]).map((s) => (
              <button
                key={s}
                disabled={!editable}
                onClick={() => setPick(s)}
                className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                  pick === s ? "border-primary bg-primary/10 text-primary" : "border-border"
                }`}
              >
                {s === "HOME" ? match.home_team : match.away_team}
              </button>
            ))}
          </div>
        </section>

        {/* ゴール予想セクション */}
        <section className="bg-card p-4 rounded-xl border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold">ゴール予想</h2>
            <span className="text-xs bg-primary/10 px-2 py-1 rounded-full text-primary">× {PAYOUT.SCORER_SINGLE}倍/点</span>
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
            onClick={handleSave} 
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl"
          >
            予想を保存
          </button>
        )}
      </div>
    </AppShell>
  );
}
