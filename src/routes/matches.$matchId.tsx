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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bets) setPick(bets.pick as Side);
    setRows(Array.from({ length: GAME.maxGoalBetsPerMatch }).map((_, i) => ({
      player_name: goalBets[i]?.player_name ?? "",
      amount: goalBets[i]?.amount?.toString() ?? ""
    })));
  }, [bets, goalBets]);

  if (isLoading) return <AppShell title="読み込み中...">読み込み中...</AppShell>;
  if (!match) return <AppShell title="エラー">試合が見つかりません</AppShell>;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (pick) await saveMatchBet(matchId, pick, 1000);
      await saveGoalBets(matchId, rows.filter(r => r.player_name.trim() !== ""));
      qc.invalidateQueries();
      toast.success("保存しました");
    } catch { toast.error("保存失敗"); } finally { setSaving(false); }
  };

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4 space-y-6">
        <h1 className="text-xl font-bold">{match.home_team} vs {match.away_team}</h1>
        {/* 省略：前述のフォームUIをここに配置 */}
        <button disabled={saving} onClick={handleSave} className="w-full py-4 bg-primary text-white rounded-xl">
          {saving ? "保存中..." : "予想を保存"}
        </button>
      </div>
    </AppShell>
  );
}
