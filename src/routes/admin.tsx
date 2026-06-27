import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { listMatches, listPlayers } from "@/lib/data/repository";
import { supabase } from "@/integrations/supabase/client";
import { processPayout, PAYOUT } from "@/lib/data/payout";
import { syncFixtures, syncResults, runSettlement, settleChampion, reSettleMatch } from "@/lib/admin/syncService";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [matchScorers, setMatchScorers] = useState<Record<string, string[]>>({});
  const { data: matches } = useQuery({ queryKey: ["matches"], queryFn: listMatches });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: listPlayers });

  useEffect(() => {
    if (matches) {
      const initial: Record<string, string[]> = {};
      matches.forEach((m) => { initial[m.id] = m.scorers || []; });
      setMatchScorers(initial);
    }
  }, [matches]);

  const isEndyAdmin = user && (user.is_admin || user.name?.toUpperCase() === "ENDY" || user.id === "endy");

  async function run(key: string, fn: () => Promise<unknown>, msg: (r: unknown) => string) {
    setBusy(key);
    try {
      const r = await fn();
      qc.invalidateQueries();
      toast.success(msg(r));
    } catch (e) { toast.error("失敗しました"); } finally { setBusy(null); }
  }

  if (!isEndyAdmin) return null;

  return (
    <AppShell title="管理画面">
      <div className="space-y-4">
        {matches?.map((m) => (
          <div key={m.id} className="p-4 border rounded-xl bg-card">
            <h3 className="font-bold">{m.home_team} vs {m.away_team}</h3>
            <div className="flex gap-2 my-2">
              <input type="number" id={`hs-${m.id}`} defaultValue={m.home_score ?? 0} className="w-12 border rounded text-center" />
              <input type="number" id={`as-${m.id}`} defaultValue={m.away_score ?? 0} className="w-12 border rounded text-center" />
            </div>
            <button
              className="w-full py-2 bg-primary text-white rounded-lg text-xs"
              onClick={async () => {
                const h = parseInt((document.getElementById(`hs-${m.id}`) as HTMLInputElement).value);
                const a = parseInt((document.getElementById(`as-${m.id}`) as HTMLInputElement).value);
                await run("p", () => processPayout(m.id, { home_score: h, away_score: a, winner: h > a ? "HOME" : a > h ? "AWAY" : "draw", scorers: matchScorers[m.id] || [] }), () => "精算完了");
              }}
            >
              精算を実行
            </button>
            <div className="text-[10px] text-muted-foreground mt-1 text-center">
              勝敗:{PAYOUT.MATCH_WIN}倍 / ゴール:{PAYOUT.SCORER_SINGLE}倍
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
