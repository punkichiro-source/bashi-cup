import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { getMatch, getMatchBets, getGoalBets } from "@/lib/data/repository";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchPage,
});

function MatchPage() {
  const { matchId } = Route.useParams();
  
  const { data: match, isLoading: mLoading } = useQuery({ 
    queryKey: ["match", matchId], 
    queryFn: () => getMatch(matchId) 
  });
  
  const { data: bets, isLoading: bLoading } = useQuery({ 
    queryKey: ["bets", matchId], 
    queryFn: () => getMatchBets(matchId) 
  });

  const { data: goalBets, isLoading: gLoading } = useQuery({ 
    queryKey: ["goalBets", matchId], 
    queryFn: () => getGoalBets(matchId) 
  });

  // データ取得状況を確認するためのデバッグ表示
  if (mLoading || bLoading || gLoading) return <AppShell title="読み込み中">データを取得しています...</AppShell>;
  if (!match) return <AppShell title="エラー">試合データが見つかりません</AppShell>;

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">{match.home_team} vs {match.away_team}</h1>
        
        {/* デバッグ用：データの存在確認 */}
        <div className="bg-slate-900 p-4 text-xs text-white rounded-lg">
          <p>Status: {match.status}</p>
          <p>Bets Data: {bets ? "取得成功" : "データなし"}</p>
          <p>GoalBets Count: {goalBets?.length ?? 0}</p>
        </div>

        {match.status === "pending" ? (
          <div className="text-green-500">予想受付中（フォーム表示ロジックへ進みます）</div>
        ) : (
          <div className="text-red-500">この試合は既に終了しているか、予想を受け付けていません (status: {match.status})</div>
        )}
      </div>
    </AppShell>
  );
}
