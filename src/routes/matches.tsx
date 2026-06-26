import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listMatches } from "@/lib/data/repository";
import { formatKickoff } from "@/lib/format";
import { STAGES } from "@/types/domain";

export const Route = createFileRoute("/matches")({
  head: () => ({ meta: [{ title: "試合一覧 — BASHI CUP 2026" }] }),
  component: MatchesPage,
});

function MatchesPage() {
  const { data: matches } = useQuery({ queryKey: ["matches"], queryFn: listMatches });

  return (
    <AppShell title="試合一覧">
      {!matches || matches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          試合がまだ同期されていません。管理者が試合同期を実行してください。
        </p>
      ) : (
        <div className="space-y-6">
          {STAGES.map((stage) => {
            const list = matches.filter((m) => m.stage === stage);
            if (list.length === 0) return null;
            return (
              <section key={stage}>
                <h2 className="mb-2 text-xs uppercase tracking-widest text-primary">{stage}</h2>
                <div className="space-y-2">
                  {list.map((m) => (
                    <Link
                      key={m.id}
                      to="/matches/$matchId"
                      params={{ matchId: m.id }}
                      className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-lg">{m.home_team}</span>
                        {m.status === "finished" ? (
                          <span className="text-sm font-semibold text-primary">
                            {m.home_score} - {m.away_score}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">vs</span>
                        )}
                        <span className="font-display text-lg">{m.away_team}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{formatKickoff(m.kickoff_time)}</span>
                        {m.status === "finished" ? (
                          <span className="text-success">
                            終了 ・ {m.winner === "HOME" ? m.home_team : m.away_team} 勝ち抜け
                          </span>
                        ) : (
                          <span>予想受付中</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
