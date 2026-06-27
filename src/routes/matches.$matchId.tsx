import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { getMatch } from "@/lib/data/repository";
import { PAYOUT } from "@/lib/data/payout";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchPage,
});

function MatchPage() {
  const { matchId } = Route.useParams();
  const { data: match } = useQuery({ 
    queryKey: ["match", matchId], 
    queryFn: () => getMatch(matchId) 
  });

  if (!match) return <AppShell>読み込み中...</AppShell>;

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4">
        <h1 className="text-xl font-bold">{match.home_team} vs {match.away_team}</h1>
        <div className="mt-4 p-3 border rounded-xl">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span>勝敗予想</span>
            <span>× {PAYOUT.MATCH_WIN}倍</span>
          </div>
          {/* 予想フォームの実装 */}
        </div>
      </div>
    </AppShell>
  );
}
