import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { rankedUsers } from "@/lib/data/repository";
import { formatBashi } from "@/lib/format";
import { GAME } from "@/lib/game/config";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "ランキング — BASHI CUP 2026" }] }),
  component: RankingPage,
});

function RankingPage() {
  const { user } = useSession();
  const { data: ranking } = useQuery({ queryKey: ["ranking"], queryFn: rankedUsers });

  return (
    <AppShell title="ランキング">
      <div className="space-y-2">
        {ranking?.map((u, i) => {
          const diff = u.balance - GAME.initialBalance;
          const me = u.id === user?.id;
          return (
            <div
              key={u.id}
              className={`flex items-center gap-3 rounded-xl border p-4 ${
                me ? "border-primary bg-accent/40" : "border-border bg-card"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-lg ${
                  i === 0 ? "gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg tracking-wide">{u.name}</p>
                <p className="text-xs text-muted-foreground">{formatBashi(u.balance)}</p>
              </div>
              <span className={`text-sm font-semibold ${diff >= 0 ? "text-success" : "text-destructive"}`}>
                {diff >= 0 ? "+" : ""}
                {diff.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
