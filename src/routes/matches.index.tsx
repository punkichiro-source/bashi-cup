import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listMatches } from "@/lib/data/repository";
import { formatKickoff } from "@/lib/format";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const navigate = useNavigate();
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: listMatches,
  });

  return (
    <AppShell title="試合一覧">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ROUND OF 32
            </h2>
            <div className="space-y-2">
              {matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => navigate({ to: "/matches/$matchId", params: { matchId: match.id } })}
                  className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center font-medium">{match.home_team}</div>
                    <div className="px-4 text-xs text-muted-foreground">vs</div>
                    <div className="flex-1 text-center font-medium">{match.away_team}</div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{formatKickoff(match.kickoff_time)}</span>
                    <span className="text-primary font-medium">予想受付中</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔴 ここが重要！子ルート（詳細モーダル）を一覧の上にレイヤーとして描画します */}
      <Outlet />
    </AppShell>
  );
}
