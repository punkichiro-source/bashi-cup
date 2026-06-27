import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { listMatches, listPlayers } from "@/lib/data/repository";
import { supabase } from "@/integrations/supabase/client";
import { processPayout, PAYOUT } from "@/lib/data/payout";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  
  // 各試合ごとの公式得点者（文字列の配列）を管理する状態
  const [matchScorers, setMatchScorers] = useState<Record<string, string[]>>({});
  
  const { data: matches } = useQuery({ queryKey: ["matches"], queryFn: listMatches });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: listPlayers });

  useEffect(() => {
    if (matches) {
      const initial: Record<string, string[]> = {};
      matches.forEach((m) => { 
        initial[m.id] = m.scorers || []; 
      });
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
    } catch (e) { 
      console.error(e);
      toast.error("失敗しました"); 
    } finally { 
      setBusy(null); 
    }
  }

  // 得点者を追加する処理
  const addScorer = (matchId: string, playerName: string) => {
    if (!playerName) return;
    setMatchScorers((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), playerName],
    }));
  };

  // 得点者を削除する処理
  const removeScorer = (matchId: string, indexToRemove: number) => {
    setMatchScorers((prev) => ({
      ...prev,
      [matchId]: (prev[matchId] || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  if (!isEndyAdmin) return null;

  return (
    <AppShell title="管理画面">
      <div className="space-y-6 max-w-2xl mx-auto p-2">
        <h2 className="text-lg font-bold border-b pb-2">試合結果の入力と精算</h2>
        
        {matches?.map((m) => {
          // 該当の試合に出場している両チームの選手のみに絞り込む
          const availablePlayers = players.filter(
            (p) => p.team === m.home_team || p.team === m.away_team
          );
          const currentScorers = matchScorers[m.id] || [];

          return (
            <div key={m.id} className="p-5 border rounded-xl bg-card space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm">{m.home_team} vs {m.away_team}</h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${m.settled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {m.settled ? "精算済み" : "未精算"}
                </span>
              </div>

              {/* スコア入力欄 */}
              <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg justify-center">
                <div className="text-center">
                  <span className="text-xs block mb-1 text-muted-foreground">{m.home_team}</span>
                  <input 
                    type="number" 
                    id={`hs-${m.id}`} 
                    defaultValue={m.home_score ?? 0} 
                    className="w-16 h-9 border rounded text-center font-bold bg-background" 
                  />
                </div>
                <div className="font-bold text-muted-foreground pt-4">ー</div>
                <div className="text-center">
                  <span className="text-xs block mb-1 text-muted-foreground">{m.away_team}</span>
                  <input 
                    type="number" 
                    id={`as-${m.id}`} 
                    defaultValue={m.away_score ?? 0} 
                    className="w-16 h-9 border rounded text-center font-bold bg-background" 
                  />
                </div>
              </div>

              {/* 得点者（スコアラー）の登録UI */}
              <div className="space-y-2 border border-dashed p-3 rounded-lg">
                <label className="text-xs font-semibold block text-primary">◆ 公式得点者の登録</label>
                
                {/* 登録された得点者バッジ一覧 */}
                {currentScorers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {currentScorers.map((name, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md border">
                        {name}
                        <button 
                          type="button" 
                          className="text-destructive font-bold hover:text-red-500 ml-1"
                          onClick={() => removeScorer(m.id, idx)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">得点者が登録されていません</p>
                )}

                {/* 選手選択用セレクトボックス */}
                <div className="flex gap-2 mt-2">
                  <select
                    id={`player-select-${m.id}`}
                    className="flex-1 h-8 text-xs rounded-md border border-input bg-background px-2"
                    onChange={(e) => {
                      addScorer(m.id, e.target.value);
                      e.target.value = ""; // 選択後にリセット
                    }}
                  >
                    <option value="">+ ゴールを決めた選手を追加</option>
                    <optgroup label={m.home_team}>
                      {availablePlayers.filter(p => p.team === m.home_team).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label={m.away_team}>
                      {availablePlayers.filter(p => p.team === m.away_team).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* 精算実行ボタン */}
              <button
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-sm hover:opacity-90 transition-opacity"
                disabled={busy !== null}
                onClick={async () => {
                  const h = parseInt((document.getElementById(`hs-${m.id}`) as HTMLInputElement).value);
                  const a = parseInt((document.getElementById(`as-${m.id}`) as HTMLInputElement).value);
                  const winnerside = h > a ? "HOME" : a > h ? "AWAY" : "draw";
                  const currentScorersList = matchScorers[m.id] || [];

                  await run("p", async () => {
                    // ① 試合テーブルの結果を手動で確定更新
                    const { error: updateError } = await supabase
                      .from("matches")
                      .update({
                        home_score: h,
                        away_score: a,
                        winner: winnerside,
                        scorers: currentScorersList,
                        status: "finished"
                      })
                      .eq("id", m.id);

                    if (updateError) throw updateError;

                    // ② processPayoutを実行（もし内部で同期サービスのsettleMatchを呼んでいる場合、
                    // DBへの反映直後だとstatus !== "finished" と判定されて弾かれることがあるため、
                    // 確実にfinished状態にしたオブジェクトを模して即時反映を促します）
                    const result = await processPayout(m.id, { 
                      home_score: h, 
                      away_score: a, 
                      winner: winnerside, 
                      scorers: currentScorersList 
                    });

                    // ③ 精算漏れを防ぐため、アプリ全体の全キャッシュをこの瞬間に完全クリア
                    qc.invalidateQueries();
                    
                    return result;
                  }, () => "試合結果を確定し、配当計算・精算を完全に実行しました！");
                }}
              >
                {busy === "p" ? "精算処理中..." : "試合結果を確定して精算を実行"}
              </button>
              
              <div className="text-[10px] text-muted-foreground text-center">
                勝敗的中:{PAYOUT.MATCH_WIN}倍 / ゴール的中:{PAYOUT.SCORER_SINGLE}倍
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
