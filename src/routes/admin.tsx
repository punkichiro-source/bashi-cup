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

// 国名から国旗絵文字や前後の余計な空白を綺麗に消し去るヘルパー関数
function cleanTeamName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "") // 絵文字を削除
    .trim(); // 前後の空白を削除
}

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
      await qc.invalidateQueries();
      toast.success(msg(r));
    } catch (e) { 
      console.error(e);
      toast.error("失敗しました"); 
    } finally { 
      setBusy(null); 
    }
  }

  const addScorer = (matchId: string, playerName: string) => {
    if (!playerName) return;
    setMatchScorers((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), playerName],
    }));
  };

  const removeScorer = (matchId: string, indexToRemove: number) => {
    setMatchScorers((prev) => ({
      ...prev,
      [matchId]: (prev[matchId] || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  if (!isEndyAdmin) return null;

  return (
    <AppShell title="管理画面">
      <div className="space-y-6 max-w-2xl mx-auto p-2 mb-20">
        <h2 className="text-lg font-bold border-b pb-2">試合結果の入力と管理</h2>
        
        {matches?.map((m: any) => {
          // 💡 表記ブレ吸収ロジック：絵文字や空白を消した状態で国名を比較
          const matchHomeClean = cleanTeamName(m.home_team);
          const matchAwayClean = cleanTeamName(m.away_team);

          const availablePlayers = players.filter((p) => {
            const playerTeamClean = cleanTeamName(p.team);
            return playerTeamClean === matchHomeClean || playerTeamClean === matchAwayClean;
          });

          const currentScorers = matchScorers[m.id] || [];

          return (
            <div key={m.id} className="p-5 border rounded-xl bg-card space-y-4 shadow-sm relative">
              
              {/* ヘッダー情報 */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {m.stage || "ベスト36"}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${m.settled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {m.settled ? "精算完了（確定済）" : "未精算"}
                </span>
              </div>

              {/* 国名修正・変更フォーム */}
              <div className="p-3 bg-muted/30 border rounded-lg space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground block">🛠️ 国名の修正（未定枠の確定など）</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">HOMEチーム</span>
                    <input 
                      type="text" 
                      id={`team-home-${m.id}`} 
                      defaultValue={m.home_team} 
                      className="w-full text-xs p-1.5 border rounded bg-background" 
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">AWAYチーム</span>
                    <input 
                      type="text" 
                      id={`team-away-${m.id}`} 
                      defaultValue={m.away_team} 
                      className="w-full text-xs p-1.5 border rounded bg-background" 
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  className="w-full py-1 text-[11px] bg-secondary border hover:bg-secondary/80 text-secondary-foreground rounded font-medium"
                  onClick={async () => {
                    const newHome = (document.getElementById(`team-home-${m.id}`) as HTMLInputElement).value.trim();
                    const newAway = (document.getElementById(`team-away-${m.id}`) as HTMLInputElement).value.trim();
                    
                    await run(`name-${m.id}`, async () => {
                      const { error } = await supabase
                        .from("matches")
                        .update({ home_team: newHome, away_team: newAway })
                        .eq("id", m.id);
                      if (error) throw error;
                    }, () => "国名を更新しました！");
                  }}
                >
                  国名の変更を保存する
                </button>
              </div>

              {/* スコア入力欄 */}
              <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg justify-center">
                <div className="text-center">
                  <span className="text-xs block mb-1 font-semibold truncate max-w-[120px]">{m.home_team || "未定"}</span>
                  <input 
                    type="number" 
                    id={`hs-${m.id}`} 
                    defaultValue={m.home_score ?? 0} 
                    className="w-16 h-9 border rounded text-center font-bold bg-background" 
                  />
                </div>
                <div className="font-bold text-muted-foreground pt-4">ー</div>
                <div className="text-center">
                  <span className="text-xs block mb-1 font-semibold truncate max-w-[120px]">{m.away_team || "未定"}</span>
                  <input 
                    type="number" 
                    id={`as-${m.id}`} 
                    defaultValue={m.away_score ?? 0} 
                    className="w-16 h-9 border rounded text-center font-bold bg-background" 
                  />
                </div>
              </div>

              {/* 得点者登録UI */}
              <div className="space-y-2 border border-dashed p-3 rounded-lg">
                <label className="text-xs font-semibold block text-primary">◆ 公式得点者の登録</label>
                
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

                <div className="flex gap-2 mt-2">
                  <select
                    id={`player-select-${m.id}`}
                    className="flex-1 h-8 text-xs rounded-md border border-input bg-background px-2"
                    onChange={(e) => {
                      addScorer(m.id, e.target.value);
                      e.target.value = "";
                    }}
                  >
                    <option value="">+ ゴールを決めた選手を追加</option>
                    <optgroup label={m.home_team || "HOME"}>
                      {availablePlayers.filter(p => cleanTeamName(p.team) === matchHomeClean).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label={m.away_team || "AWAY"}>
                      {availablePlayers.filter(p => cleanTeamName(p.team) === matchAwayClean).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* 操作ボタンエリア */}
              <div className="space-y-2 pt-2">
                <button
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-sm hover:opacity-90 transition-opacity"
                  disabled={busy !== null}
                  onClick={async () => {
                    const h = parseInt((document.getElementById(`hs-${m.id}`) as HTMLInputElement).value);
                    const a = parseInt((document.getElementById(`as-${m.id}`) as HTMLInputElement).value);
                    const winnerside = h > a ? "HOME" : a > h ? "AWAY" : "draw";
                    const currentScorersList = matchScorers[m.id] || [];

                    await run("p", async () => {
                      return await processPayout(m.id, { 
                        home_score: h, 
                        away_score: a, 
                        winner: winnerside, 
                        scorers: currentScorersList 
                      });
                    }, () => "試合結果を確定し、配当・精算を完全に完了しました！");
                  }}
                >
                  {busy === "p" ? "精算処理中..." : "試合結果を確定して精算を実行"}
                </button>

                {/* 誤入力リセットボタン */}
                {m.settled && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    className="w-full py-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 font-medium rounded-xl text-xs transition-colors"
                    onClick={async () => {
                      if (!confirm("本当にこの試合の精算を取り消しますか？ユーザーに配当された残高は自動的に回収・マイナスされます。")) return;
                      
                      await run(`reset-${m.id}`, async () => {
                        await processPayout(m.id, {
                          home_score: 0,
                          away_score: 0,
                          winner: "draw",
                          scorers: ["__NEVER_MATCH_RESET_KEY__"]
                        });

                        const { error } = await supabase
                          .from("matches")
                          .update({
                            home_score: null,
                            away_score: null,
                            winner: null,
                            scorers: [],
                            status: "scheduled",
                            settled: false
                          })
                          .eq("id", m.id);
                        
                        if (error) throw error;
                        
                        await supabase.from("match_bets").update({ settled: false, payout: 0 }).eq("id", m.id);
                        await supabase.from("goal_bets").update({ settled: false, payout: 0 }).eq("id", m.id);
                      }, () => "精算の取り消し・残高の回収が完了しました！未精算状態に戻っています。");
                    }}
                  >
                    ⚠️ 誤入力を取り消して未精算リセット
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
