"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  getMatch, 
  saveMatchBet, 
  saveGoalBets, 
  listPlayers, 
  getUserMatchBet, 
  getUserGoalBets 
} from "@/lib/data/repository";
import { Side } from "@/types/domain";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchDetailPage,
});

interface GoalBetInput {
  player_name: string;
  amount: string;
}

function MatchDetailPage() {
  const { matchId } = Route.useParams();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [pick, setPick] = useState<Side>("HOME");
  const [matchAmount, setMatchAmount] = useState<string>("");
  const [goalBets, setGoalBets] = useState<GoalBetInput[]>([
    { player_name: "", amount: "" }
  ]);

  useEffect(() => {
    const localUserId = localStorage.getItem("bashi_cup_session_user_id");
    if (localUserId) {
      setUserId(localUserId);
    } else {
      setUserId("455c3128-25f5-488e-a62b-d55e7d162241");
    }
  }, []);

  const { data: match, isLoading: isMatchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId),
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["players"],
    queryFn: listPlayers,
  });

  const { data: existingMatchBet } = useQuery({
    queryKey: ["userMatchBet", userId, matchId],
    queryFn: () => (userId ? getUserMatchBet(userId, matchId) : null),
    enabled: !!userId,
  });

  const { data: existingGoalBets } = useQuery({
    queryKey: ["userGoalBets", userId, matchId],
    queryFn: () => (userId ? getUserGoalBets(userId, matchId) : null),
    enabled: !!userId,
  });

  useEffect(() => {
    if (existingMatchBet) {
      setPick(existingMatchBet.pick);
      setMatchAmount(existingMatchBet.amount.toString());
    }
  }, [existingMatchBet]);

  useEffect(() => {
    if (existingGoalBets && existingGoalBets.length > 0) {
      setGoalBets(
        existingGoalBets.map((b) => ({
          player_name: b.player_name,
          amount: b.amount.toString(),
        }))
      );
    }
  }, [existingGoalBets]);

  // 🔍 デバッグ用：何が原因で消えているかをコンソールに強制出力
  useEffect(() => {
    if (allPlayers.length > 0) {
      console.log("=== 【緊急デバッグ】選手データの構造チェック ===");
      console.log("全選手数:", allPlayers.length);
      console.log("選手データの1件目の身元:", JSON.stringify(allPlayers[0]));
      console.log("match.home_teamの中身:", match?.home_team);
    }
  }, [allPlayers, match]);

  // 💡 安全にチーム名を判別するロジック (英語名・日本語名・部分一致・プロパティ名違いを網羅)
  const isTargetTeam = (player: any, matchTeam: string | undefined) => {
    if (!player || !matchTeam) return false;
    const pTeam = (player.team || player.team_name || player.country || "").toString().trim().toLowerCase();
    const mTeam = matchTeam.toString().trim().toLowerCase();
    if (!pTeam) return false;

    // 完全一致 or 部分一致判定
    if (pTeam === mTeam || pTeam.includes(mTeam) || mTeam.includes(pTeam)) return true;

    // メキシコ、イングランドの主な表記ブレをカバーするマッピング
    const dict: Record<string, string[]> = {
      mexico: ["mexico", "mex", "メキシコ"],
      england: ["england", "eng", "イングランド"],
    };

    for (const key in dict) {
      const aliases = dict[key];
      const matchMatches = aliases.some(a => mTeam.includes(a) || a.includes(mTeam));
      const playerMatches = aliases.some(a => pTeam.includes(a) || a.includes(pTeam));
      if (matchMatches && playerMatches) return true;
    }
    return false;
  };

  // ホーム・アウェイそれぞれのチームに所属する選手だけを抽出
  const homePlayers = allPlayers.filter(p => isTargetTeam(p, match?.home_team));
  const awayPlayers = allPlayers.filter(p => isTargetTeam(p, match?.away_team));

  const addScorerRow = () => setGoalBets([...goalBets, { player_name: "", amount: "" }]);
  const removeScorerRow = (index: number) => {
    const updated = [...goalBets];
    updated.splice(index, 1);
    setGoalBets(updated.length === 0 ? [{ player_name: "", amount: "" }] : updated);
  };
  const updateScorerRow = (index: number, field: "player_name" | "amount", value: string) => {
    const updated = [...goalBets];
    updated[index][field] = value;
    setGoalBets(updated);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const activeUserId = userId || "455c3128-25f5-488e-a62b-d55e7d162241";
      if (!match) return;

      const parsedMatchAmount = Number(matchAmount);
      if (matchAmount && !isNaN(parsedMatchAmount) && parsedMatchAmount > 0) {
        await saveMatchBet(activeUserId, match, pick, parsedMatchAmount);
      }

      const validGoalBets = goalBets
        .filter(b => b.player_name.trim() !== "" && !isNaN(Number(b.amount)) && Number(b.amount) > 0)
        .map(b => ({
          player_name: b.player_name,
          amount: Number(b.amount)
        }));

      await saveGoalBets(activeUserId, match, validGoalBets);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["balance"] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.invalidateQueries({ queryKey: ["userMatchBet", userId, matchId] });
      await queryClient.invalidateQueries({ queryKey: ["userGoalBets", userId, matchId] });
      alert("予想を保存しました！");
    },
    onError: (err: any) => {
      alert("保存エラー: " + (err.message || "error"));
    },
  });

  if (isMatchLoading) {
    return (
      <AppShell title="読み込み中...">
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">読み込み中...</div>
      </AppShell>
    );
  }

  if (!match) {
    return (
      <AppShell title="エラー"><div className="p-4 text-center text-muted-foreground">試合情報がありません。</div></AppShell>
    );
  }

  const canBet = match.status === "scheduled";

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4 space-y-6 max-w-xl mx-auto">
        
        <div className="text-center py-6 bg-card rounded-xl border border-border">
          <div className="flex justify-around items-center text-xl font-bold">
            <div className="text-right w-1/3 truncate">{match.home_team}</div>
            <div className="text-2xl px-4 text-muted-foreground">VS</div>
            <div className="text-left w-1/3 truncate">{match.away_team}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">ステータス: {match.status}</p>
        </div>

        {canBet ? (
          <div className="space-y-6">
            <div className="bg-card p-5 rounded-xl border border-border space-y-4">
              <h2 className="text-base font-semibold text-primary">① 勝敗予想</h2>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={pick === "HOME" ? "default" : "outline"} onClick={() => setPick("HOME")} className="w-full">
                  {match.home_team} 勝利
                </Button>
                <Button type="button" variant={pick === "AWAY" ? "default" : "outline"} onClick={() => setPick("AWAY")} className="w-full">
                  {match.away_team} 勝利
                </Button>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">勝敗に賭けるBASHI額</label>
                <Input type="number" placeholder="数値を入力" value={matchAmount} onChange={(e) => setMatchAmount(e.target.value)} />
              </div>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border space-y-4">
              <h2 className="text-base font-semibold text-primary">② 得点者 (スコアラー) 予想</h2>
              
              <div className="space-y-3">
                {goalBets.map((row, index) => (
                  <div key={index} className="flex gap-2 items-end border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] text-muted-foreground block">選手 {index + 1}</label>
                      <select
                        value={row.player_name}
                        onChange={(e) => updateScorerRow(index, "player_name", e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">-- 選手を選択 --</option>
                        
                        {/* 💡 ホームチームのグループ */}
                        {homePlayers.length > 0 && (
                          <optgroup label={match.home_team}>
                            {homePlayers.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </optgroup>
                        )}

                        {/* 💡 アウェイチームのグループ */}
                        {awayPlayers.length > 0 && (
                          <optgroup label={match.away_team}>
                            {awayPlayers.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    <div className="w-32 space-y-1">
                      <label className="text-[11px] text-muted-foreground block">賭けるBASHI</label>
                      <Input type="number" placeholder="数値" value={row.amount} onChange={(e) => updateScorerRow(index, "amount", e.target.value)} />
                    </div>

                    {goalBets.length > 1 && (
                      <Button type="button" variant="destructive" className="px-3 h-10" onClick={() => removeScorerRow(index)}>✕</Button>
                    )}
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" className="w-full text-xs mt-2" onClick={addScorerRow}>
                + 別の得点者予想を追加する
              </Button>
            </div>

            <Button onClick={() => mutation.mutate()} className="w-full py-6 text-base font-bold bg-primary text-primary-foreground rounded-xl" disabled={mutation.isPending}>
              {mutation.isPending ? "保存中..." : "この内容で予想を確定する"}
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">予想変更期間外です。</div>
        )}
      </div>
    </AppShell>
  );
}
