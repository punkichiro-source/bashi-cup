// src/routes/matches.$matchId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { getMatch } from "@/lib/data/repository";

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

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4">
        <h1 className="text-xl font-bold">{match.home_team} vs {match.away_team}</h1>
        {/* ここに詳細フォームロジックを配置 */}
      </div>
    </AppShell>
  );
}
