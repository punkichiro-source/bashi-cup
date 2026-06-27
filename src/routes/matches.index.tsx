import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listMatches } from "@/lib/data/repository";

export const Route = createFileRoute("/matches/")({
  component: MatchesIndex,
});

function MatchesIndex() {
  const navigate = useNavigate();
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: listMatches,
  });

  if (isLoading) return <AppShell title="読み込み中">読み込み中...</AppShell>;

  return (
    <AppShell title="試合一覧">
      <div className="p-4 space-y-2">
        {matches?.map((m) => (
          <div 
            key={m.id} 
            onClick={() => navigate({ to: "/matches/$matchId", params: { matchId: m.id } })}
            className="p-4 border rounded cursor-pointer hover:bg-slate-800"
          >
            {m.home_team} vs {m.away_team}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
