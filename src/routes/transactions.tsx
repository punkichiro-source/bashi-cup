import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { listTransactions } from "@/lib/data/repository";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "取引履歴 — BASHI CUP 2026" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { user } = useSession();
  const uid = user?.id ?? "";
  const { data: txns } = useQuery({
    queryKey: ["transactions", uid],
    queryFn: () => listTransactions(uid),
    enabled: !!uid,
  });

  return (
    <AppShell title="取引履歴">
      <div className="space-y-2">
        {txns?.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm">{t.description}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(t.created_at)}</p>
              </div>
              <span className={`shrink-0 text-sm font-semibold ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>
                {t.amount >= 0 ? "+" : ""}
                {t.amount.toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              残高 {t.balance_after.toLocaleString()}
            </p>
          </div>
        ))}
        {txns && txns.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            取引履歴はまだありません
          </p>
        )}
      </div>
    </AppShell>
  );
}
