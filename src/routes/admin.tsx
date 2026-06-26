import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { listMatches } from "@/lib/data/repository";
import {
  reSettleMatch,
  runSettlement,
  settleChampion,
  syncFixtures,
  syncResults,
} from "@/lib/admin/syncService";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "管理画面 — BASHI CUP 2026" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [champ, setChamp] = useState("");

  const { data: matches } = useQuery({ queryKey: ["matches"], queryFn: listMatches });

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) navigate({ to: "/home" });
  }, [loading, user, navigate]);

  async function run(key: string, fn: () => Promise<unknown>, msg: (r: unknown) => string) {
    setBusy(key);
    try {
      const r = await fn();
      qc.invalidateQueries();
      toast.success(msg(r));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "失敗しました");
    } finally {
      setBusy(null);
    }
  }

  const teams = [...new Set((matches ?? []).flatMap((m) => [m.home_team, m.away_team]))].sort();

  if (!user?.is_admin) return null;

  return (
    <AppShell title="管理画面">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">同期</h2>
        <button
          disabled={!!busy}
          onClick={() => run("fix", syncFixtures, (n) => `${n}件の試合を同期しました`)}
          className="w-full rounded-xl border border-border bg-card py-3 text-sm font-medium disabled:opacity-40"
        >
          試合同期 (Fixtures)
        </button>
        <button
          disabled={!!busy}
          onClick={() => run("res", syncResults, (n) => `${n}件の結果を取得しました`)}
          className="w-full rounded-xl border border-border bg-card py-3 text-sm font-medium disabled:opacity-40"
        >
          結果同期 (Results)
        </button>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">精算</h2>
        <button
          disabled={!!busy}
          onClick={() => run("settle", runSettlement, (n) => `${n}試合を精算しました`)}
          className="w-full rounded-xl gold-gradient py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          精算実行
        </button>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">優勝国精算</h2>
        <select
          value={champ}
          onChange={(e) => setChamp(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">優勝チームを選択</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          disabled={!!busy || !champ}
          onClick={() => run("champ", () => settleChampion(champ), (n) => `優勝予想 ${n}件を精算しました`)}
          className="w-full rounded-xl border border-primary py-3 text-sm font-semibold text-primary disabled:opacity-40"
        >
          優勝国精算を実行
        </button>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">再精算</h2>
        <p className="text-[11px] text-muted-foreground">精算済みの試合を取り消して再計算します。</p>
        <div className="space-y-2">
          {matches
            ?.filter((m) => m.settled)
            .map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
                <span className="text-sm">
                  {m.home_team} vs {m.away_team}
                </span>
                <button
                  disabled={!!busy}
                  onClick={() => run("re" + m.id, () => reSettleMatch(m.id), () => "再精算しました")}
                  className="rounded-lg border border-primary px-3 py-1 text-xs text-primary disabled:opacity-40"
                >
                  再精算
                </button>
              </div>
            ))}
          {matches && matches.filter((m) => m.settled).length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              精算済みの試合はありません
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
