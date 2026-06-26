import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { listTransactions, nextMatch, rankedUsers } from "@/lib/data/repository";
import { formatDateTime, formatKickoff } from "@/lib/format";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [{ title: "ホーム — BASHI CUP 2026" }] }),
  component: HomePage,
});

function HomePage() {
  const { user } = useSession();
  const uid = user?.id ?? "";

  const { data: ranking } = useQuery({ queryKey: ["ranking"], queryFn: rankedUsers });
  const { data: next } = useQuery({ queryKey: ["nextMatch"], queryFn: nextMatch });
  const { data: txns } = useQuery({
    queryKey: ["transactions", uid],
    queryFn: () => listTransactions(uid),
    enabled: !!uid,
  });

  const rank = ranking ? ranking.findIndex((u) => u.id === uid) + 1 : 0;

  return (
    <AppShell title="ホーム">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">保有BASHI</p>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {user ? user.balance.toLocaleString() : "-"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">現在順位</p>
          <p className="mt-1 text-2xl font-semibold">
            {rank > 0 ? `${rank}` : "-"}
            <span className="text-sm text-muted-foreground"> / {ranking?.length ?? 0}</span>
          </p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">次の試合</h2>
        {next ? (
          <Link
            to="/matches/$matchId"
            params={{ matchId: next.id }}
            className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <p className="text-xs text-primary">{next.stage}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-display text-xl">{next.home_team}</span>
              <span className="text-xs text-muted-foreground">vs</span>
              <span className="font-display text-xl">{next.away_team}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{formatKickoff(next.kickoff_time)} キックオフ</p>
          </Link>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            予定されている試合はありません
          </p>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">直近の取引</h2>
          <Link to="/transactions" className="text-xs text-primary">
            すべて見る
          </Link>
        </div>
        <div className="space-y-2">
          {txns?.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm">{t.description}</p>
                <p className="text-[10px] text-muted-foreground">{formatDateTime(t.created_at)}</p>
              </div>
              <span className={`ml-3 shrink-0 text-sm font-semibold ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>
                {t.amount >= 0 ? "+" : ""}
                {t.amount.toLocaleString()}
              </span>
            </div>
          ))}
          {txns && txns.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              取引履歴はまだありません
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
