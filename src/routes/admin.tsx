import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { listMatches, listPlayers } from "@/lib/data/repository";
import { supabase } from "@/integrations/supabase/client";
import { processPayout, PAYOUT } from "@/lib/data/payout";
import {
  manualUpdateMatch,
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

  const [matchScorers, setMatchScorers] = useState<Record<string, string[]>>({});

  const { data: matches } = useQuery({ queryKey: ["matches"], queryFn: listMatches });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: listPlayers });

  useEffect(() => {
    if (matches) {
      const initialScorers: Record<string, string[]> = {};
      matches.forEach((m) => {
        initialScorers[m.id] = m.scorers || [];
      });
      setMatchScorers(initialScorers);
    }
  }, [matches]);

  const isEndyAdmin = user && (user.is_admin || user.name?.toUpperCase() === "ENDY" || user.id === "endy");

  useEffect(() => {
    if (!loading && !isEndyAdmin) {
      toast.error("管理者権限がありません（Endy専用）");
      navigate({ to: "/home" });
    }
  }, [loading, isEndyAdmin, navigate]);

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

  const toggleScorer = (matchId: string, playerName: string) => {
    const current = matchScorers[matchId] || [];
    const next = current.includes(playerName)
      ? current.filter((name) => name !== playerName)
      : [...current, playerName];
    
    setMatchScorers({
      ...matchScorers,
      [matchId]: next,
    });
  };

  const teams = [...new Set((matches ?? []).flatMap((m) => [m.home_team, m.away_team]))].sort();

  if (!isEndyAdmin) return null;

  return (
    <AppShell title="管理画面 (Endy専用)">
      <section className="space-y-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
        <h2 className="text-sm font-bold text-red-500">※注意：データ同期について</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          手動で投入したデータが外部APIで上書きされるのを防ぐため、自動同期ボタンの使用にはご注意ください。
        </p>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            disabled={!!busy}
            onClick={() => {
              if(confirm("外部データで試合情報が上書きされます。よろしいですか？")) {
                run("fix", syncFixtures, (n) => `${n}件の試合を同期しました`);
              }
            }}
            className="rounded-lg border border-border bg-card py-2 text-xs font-medium disabled:opacity-40"
          >
            試合同期 (警告あり)
          </button>
          <button
            disabled={!!busy}
            onClick={() => run("res", syncResults, (n) => `${n}件の結果を取得しました`)}
            className="rounded-lg border border-border bg-card py-2 text-xs font-medium disabled:opacity-40"
          >
            結果同期 (Results)
          </button>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">精算実行</h2>
        <button
          disabled={!!busy}
          onClick={() => run("settle", runSettlement, (n) => `${n}試合を精算しました`)}
          className="w-full rounded-xl gold-gradient py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          未精算の試合をすべて精算
        </button>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">手動スコア更新</h2>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {matches?.map((m) => {
            const matchPlayers = players.filter((p) => p.team === m.home_team || p.team === m.away_team);
            const currentSelected = matchScorers[m.id] || [];

            return (
              <div key={m.id} className="flex flex-col rounded-xl border border-border bg-card p-4 gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] text-muted-foreground font-mono truncate">{m.stage}</span>
                    <span className="text-sm truncate font-medium">{m.home_team} vs {m.away_team}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input type="number" defaultValue={m.home_score ?? 0} className="w-12 rounded-lg border border-border bg-background p-1 text-center text-sm" id={`hs-${m.id}`} />
                    <span className="text-muted-foreground font-bold">:</span>
                    <input type="number" defaultValue={m.away_score ?? 0} className="w-12 rounded-lg border border-border bg-background p-1 text-center text-sm" id={`as-${m.id}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    disabled={!!busy}
                    className="w-full rounded-xl gold-gradient py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                    onClick={async () => {
                      const hVal = (document.getElementById(`hs-${m.id}`) as HTMLInputElement).value;
                      const aVal = (document.getElementById(`as-${m.id}`) as HTMLInputElement).value;
                      const h = parseInt(hVal === "" ? "0" : hVal);
                      const a = parseInt(aVal === "" ? "0" : aVal);
                      const winner = h > a ? m.home_team : a > h ? m.away_team : "draw";
                      await run("payout" + m.id, async () => {
                        await processPayout(m.id, { home_score: h, away_score: a, winner, scorers: currentSelected });
                      }, () => "結果を反映し、配当を支払いました");
                    }}
                  >
                    精算を実行（結果反映）
                  </button>
                  <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
                    <span>勝敗: ×{PAYOUT.MATCH_WIN}倍</span>
                    <span>得点者: ×{PAYOUT.SCORER_SINGLE}倍</span>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-2">
                  <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">得点者を選択:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto bg-background/50 p-2 rounded-lg border border-border/50">
                    {matchPlayers.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => toggleScorer(m.id, player.name)}
                        className={`px-2 py-1 text-xs rounded-md border ${currentSelected.includes(player.name) ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground"}`}
                      >
                        {player.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* ... (優勝国精算・再精算セクションは既存のまま保持してください) */}
    </AppShell>
  );
}
