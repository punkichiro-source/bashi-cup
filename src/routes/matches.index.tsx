import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listMatches } from "@/lib/data/repository";
import { formatKickoff } from "@/lib/format";

export const Route = createFileRoute("/matches/")({
  component: MatchesIndex,
});

function MatchesIndex() {
  const navigate = useNavigate();
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: listMatches,
  });

  return (
    <AppShell title="試合一覧">
      {isLoading ? <p>読み込み中...</p> : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              onClick={() => navigate({ to: "/matches/$matchId", params: { matchId: match.id } })}
              className="cursor-pointer border p-4 rounded-xl"
            >
              <div className="font-bold">{match.home_team} vs {match.away_team}</div>
              <div className="text-xs text-muted-foreground">{formatKickoff(match.kickoff_time)}</div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
