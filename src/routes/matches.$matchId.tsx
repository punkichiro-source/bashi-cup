import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { getMatch, listPlayers, getMatchBets, getGoalBets, saveMatchBet, saveGoalBets } from "@/lib/data/repository";
import { PAYOUT } from "@/lib/data/payout";
import { GAME } from "@/lib/config";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchPage,
});

type Side = "HOME" | "AWAY";

function MatchPage() {
  const { matchId } = Route.useParams();
  const { user } = useSession();
  const qc = useQueryClient();
  
  const { data: match } = useQuery({ queryKey: ["match", matchId], queryFn: () => getMatch(matchId) });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: listPlayers });
  const { data: bets } = useQuery({ queryKey: ["bets", matchId], queryFn: () => getMatchBets(matchId) });
  const { data: goalBets = [] } = useQuery({ queryKey: ["goalBets", matchId], queryFn: () => getGoalBets(matchId) });

  const [pick, setPick] = useState<Side | "">("");
  const [rows, setRows] = useState<{ player_name: string; amount: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bets) setPick(bets.pick as Side);
    if (goalBets.length > 0) {
      setRows(goalBets.map(b => ({ player_name: b.player_name, amount: b.amount.toString() })));
    }
  }, [bets, goalBets]);

  if (!match) return <AppShell title="読み込み中..."><div>試合情報を読み込んでいます...</div></AppShell>;

  const matchPlayers = players.filter(p => p.team === match.home_team || p.team === match.away_team);
  const editable = match.status === "pending";

  const handleSave = async () => {
    setLoading(true);
    try {
      if (pick) await saveMatchBet(matchId, pick, 1000); // 仮の固定額
      await saveGoalBets(matchId, rows.filter(r => r.player_name && r.amount));
      qc.invalidateQueries();
      toast.success("予想を保存しました");
    } catch (e) {
      toast.error("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="text-center py-6">
        <h1 className="text-xl font-bold">{match.home_team} vs {match.away_team}</h1>
        <p className="text-sm text-muted-foreground">{match.stage}</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">勝敗予想</h2>
          <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">× {PAYOUT.MATCH_WIN}倍</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["HOME", "AWAY"] as Side[]).map((s) => (
            <button
              key={s}
              disabled={!editable}
              onClick={() => setPick(s)}
              className={`rounded-xl border py-2.5 text-sm font-medium ${pick === s ? "border-primary bg-primary/10 text-primary font-bold" : "border-border bg-background"}`}
            >
              {s === "HOME" ? match.home_team : match.away_team}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ゴール予想</h2>
          <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">× {PAYOUT.SCORER_SINGLE}倍/点</div>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: GAME.maxGoalBetsPerMatch }).map((_, i) => {
            const row = rows[i] ?? { player_name: "", amount: "" };
            return (
              <div key={i} className="flex gap-2">
                <select
                  disabled={!editable}
                  value={row.player_name}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, player_name: e.target.value };
                    setRows(next);
                  }}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">選手を選択</option>
                  {matchPlayers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <input
                  disabled={!editable}
                  value={row.amount}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...row, amount: e.target.value.replace(/\D/g, "") };
                    setRows(next);
                  }}
                  placeholder="金額"
                  className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            );
          })}
        </div>
      </section>

      {editable && (
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full mt-6 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
        >
          {loading ? "保存中..." : "予想を保存"}
        </button>
      )}
    </AppShell>
  );
}
