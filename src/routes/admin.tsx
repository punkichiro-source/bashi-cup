import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { listMatches, listPlayers } from "@/lib/data/repository";
import { supabase } from "@/integrations/supabase/client";
import { processPayout } from "@/lib/data/payout";
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

  // 各試合ごとのチェックされた得点者(選手名)を管理するオブジェクトステート
  const [matchScorers, setMatchScorers] = useState<Record<string, string[]>>({});

  // 試合一覧と事前登録された選手一覧をDBから取得
  const { data: matches } = useQuery({ queryKey: ["matches"], queryFn: listMatches });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: listPlayers });

  // 試合データが読み込まれたら、既存の登録済み得点者を初期値としてセット
  useEffect(() => {
    if (matches) {
      const initialScorers: Record<string, string[]> = {};
      matches.forEach((m) => {
        initialScorers[m.id] = m.scorers || [];
      });
      setMatchScorers(initialScorers);
    }
  }, [matches]);

  // 管理者名を「Endy」または「ENDY」または既存のis_adminフラグで判定
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

  // チェックボックスのトグル処理
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
          手動で投入した「正しい日本時間データ」が外部APIで上書きされるのを防ぐため、自動同期ボタンの使用にはご注意ください。基本は下の「手動スコア更新」をご利用ください。
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
        <h2 className="text-sm font-medium text-muted-foreground">手動スコア更新 (メイン運用枠)</h2>
        <p className="text-[11px] text-muted-foreground">ここでスコアと得点者を入力して「更新・精算」を押すと、ユーザーの予想への配当支払いまで同時に完了します。</p>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {matches?.map((m) => {
            // この試合の対戦国に所属する登録選手だけを絞り込む
            const matchPlayers = players.filter(
              (p) => p.team === m.home_team || p.team === m.away_team
            );
            const currentSelected = matchScorers[m.id] || [];

            return (
              <div key={m.id} className="flex flex-col rounded-xl border border-border bg-card p-4 gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] text-muted-foreground font-mono truncate">{m.stage}</span>
                    <span className="text-sm truncate font-medium">{m.home_team} vs {m.away_team}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <input 
                      type="number" 
                      defaultValue={m.home_score ?? 0} 
                      className="w-12 rounded-lg border border-border bg-background p-1 text-center text-sm outline-none focus:border-primary"
                      id={`hs-${m.id}`}
                    />
                    <span className="text-muted-foreground font-bold">:</span>
                    <input 
                      type="number" 
                      defaultValue={m.away_score ?? 0} 
                      className="w-12 rounded-lg border border-border bg-background p-1 text-center text-sm outline-none focus:border-primary"
                      id={`as-${m.id}`}
                    />
                  </div>
                  <button
                    disabled={!!busy}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors disabled:opacity-40 shrink-0"
                    onClick={async () => {
                      const hVal = (document.getElementById(`hs-${m.id}`) as HTMLInputElement).value;
                      const aVal = (document.getElementById(`as-${m.id}`) as HTMLInputElement).value;
                      const h = parseInt(hVal === "" ? "0" : hVal);
                      const a = parseInt(aVal === "" ? "0" : aVal);
                      const winner = h > a ? m.home_team : a > h ? m.away_team : "draw";
                      
                      await run("manual" + m.id, async () => {
                        // 1. 既存の精算サービスをそのまま安全に呼び出して勝敗などの精算を行う
                        await manualUpdateMatch(m.id, h, a, winner);
                        // 2. 得点者リスト(scorers)を、選ばれた選手配列で確実に上書き更新する
                        const { error } = await supabase
                          .from("matches")
                          .update({ scorers: currentSelected })
                          .eq("id", m.id);
                        if (error) throw error;
                      }, () => "手動でスコア更新、得点者登録、および精算を完了しました");
                    }}
                  >
                    更新・精算
                  </button>
                </div>

                {/* 精算を実行（結果反映）: payout.ts の processPayout を呼び出す */}
                <button
                  disabled={!!busy}
                  className="w-full rounded-xl gold-gradient py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                  onClick={async () => {
                    const hVal = (document.getElementById(`hs-${m.id}`) as HTMLInputElement).value;
                    const aVal = (document.getElementById(`as-${m.id}`) as HTMLInputElement).value;
                    const h = parseInt(hVal === "" ? "0" : hVal);
                    const a = parseInt(aVal === "" ? "0" : aVal);
                    const winner = h > a ? m.home_team : a > h ? m.away_team : "draw";
                    await run(
                      "payout" + m.id,
                      () =>
                        processPayout(m.id, {
                          home_score: h,
                          away_score: a,
                          winner,
                          scorers: currentSelected,
                        }),
                      () => "結果を反映し、配当を支払いました",
                    );
                  }}
                >
                  精算を実行（結果反映）
                </button>

                {/* 💡 得点者の選択エリア */}
                <div className="border-t border-border/40 pt-2">
                  <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">
                    得点者を選択してください (複数選択・同一人物の複数クリック可):
                  </span>
                  {matchPlayers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto bg-background/50 p-2 rounded-lg border border-border/50">
                      {matchPlayers.map((player) => {
                        const isChecked = currentSelected.includes(player.name);
                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => toggleScorer(m.id, player.name)}
                            className={`px-2 py-1 text-xs rounded-md border transition-all ${
                              isChecked
                                ? "bg-primary/10 border-primary text-primary font-medium"
                                : "bg-background border-border text-muted-foreground hover:border-muted"
                            }`}
                          >
                            {player.name}
                            <span className="text-[9px] opacity-70 ml-1">({player.team === m.home_team ? "H" : "A"})</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-yellow-500/80 pl-1">
                      ※この対戦国の選手データが `players` テーブルに登録されていません。
                    </p>
                  )}
                  {currentSelected.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-bold text-primary">決定済みの得点者:</span>
                      {currentSelected.map((name, idx) => (
                        <span key={idx} className="bg-muted px-1.5 py-0.5 rounded text-[10px] border border-border">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {(!matches || matches.length === 0) && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              試合データがありません。Supabaseから再投入してください。
            </p>
          )}
        </div>
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
