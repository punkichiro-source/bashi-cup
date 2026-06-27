import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { getMatch } from "@/lib/data/repository";
import { BetForm } from "@/components/BetForm"; // 先ほど作成したコンポーネント

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchPage,
});

function MatchPage() {
  const { matchId } = Route.useParams();
  
  const { data: match, isLoading } = useQuery({ 
    queryKey: ["match", matchId], 
    queryFn: () => getMatch(matchId) 
  });

  if (isLoading) return <AppShell title="読み込み中...">読み込み中...</AppShell>;
  if (!match) return <AppShell title="エラー">試合が見つかりません</AppShell>;

  // 試合がscheduledなら予想可能
  const canBet = match.status === "scheduled";

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold">{match.home_team} vs {match.away_team}</h1>
        
        {canBet ? (
          <div className="bg-card p-6 rounded-xl border border-border">
            <h2 className="text-lg font-semibold mb-4">予想を登録</h2>
            <BetForm match={match} />
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center">
            {match.status === "finished" ? "試合終了" : "現在予想受付外です"}
          </div>
        )}
      </div>
    </AppShell>
  );
}
