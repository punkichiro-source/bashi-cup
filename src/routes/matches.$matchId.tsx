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

  // フォーム用ローカル状態
  const [userId, setUserId] = useState<string | null>(null);
  const [pick, setPick] = useState<Side>("HOME");
  const [matchAmount, setMatchAmount] = useState<string>("");
  const [goalBets, setGoalBets] = useState<GoalBetInput[]>([
    { player_name: "", amount: "" }
  ]);

  // セッションUserIDの取得
  useEffect(() => {
    const localUserId = localStorage.getItem("bashi_cup_session_user_id");
    if (localUserId) {
      setUserId(localUserId);
    } else {
      const fallbackId = "455c3128-25f5-488e-a62b-d55e7d162241";
      setUserId(fallbackId);
    }
  }, []);

  // 1. 試合データの取得
  const { data: match, isLoading: isMatchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId),
  });

  // 2. 全選手リストの取得
  const { data: allPlayers = [] } = useQuery({
    queryKey: ["players"],
    queryFn: listPlayers,
  });

  // 3. 既存の勝敗予想データの取得
  const { data: existingMatchBet } = useQuery({
    queryKey: ["userMatchBet", userId, matchId],
    queryFn: () => (userId ? getUserMatchBet(userId, matchId) : null),
    enabled: !!userId,
  });

  // 4. 既存のゴール予想データの取得
  const { data: existingGoalBets } = useQuery({
    queryKey: ["userGoalBets", userId, matchId],
    queryFn: () => (userId ? getUserGoalBets(userId, matchId) : null),
    enabled: !!userId,
  });

  // 既存データがある場合にフォームへ初期値をセット
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

  // 💡 表記ブレ（メキシコ / Mexico / MEX など）に対応するための判定関数
  const isTeamMatch = (playerTeam: string, matchTeam: string) => {
    if (!playerTeam || !matchTeam) return false;
    const p = playerTeam.trim().toLowerCase();
    const m = matchTeam.trim().toLowerCase();
    // 完全一致、またはどちらかがどちらかを含んでいる場合にマッチとする
    return p === m || p.includes(m) || m.includes(p);
  };

  // チーム名判定関数を用いて選手をフィルタリング
  const homePlayers = match ? allPlayers.filter(p => isTeamMatch(p.team, match.home_team)) : [];
  const awayPlayers = match ? allPlayers.filter(p => isTeamMatch(p.team, match.away_team)) : [];

  // デバッグ用ログ（万が一まだ出ない場合に原因を突き止めるため）
  useEffect(() => {
    if (match && allPlayers.length > 0) {
      console.log("--- 選手データマッチング状況 ---");
      console.log("全選手数:", allPlayers.length);
      console.log(`ホーム(${match.home_team})の一致数:`, homePlayers.length);
      console.log(`アウェイ(${match.away_team})の一致数:`, awayPlayers.length);
      if (homePlayers.length === 0 && awayPlayers.length === 0) {
        console.log("データサンプル(1件目):", allPlayers[0]);
      }
    }
  }, [match, allPlayers, homePlayers, awayPlayers]);

  // 行操作ロジック
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

  // 予想保存ミューテーション
  const mutation = useMutation({
    mutationFn: async () => {
      const activeUserId = userId || localStorage.getItem("bashi_cup_session_user_id") || "455c3128-25f5-488e-a62b-d55e7d162241";
      
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
      
      alert("予想をすべて保存しました！残高が更新されました。");
    },
    onError: (err: any) => {
      alert("保存に失敗しました:\n" + (err.message || "エラーが発生しました"));
    },
  });

  if (isMatchLoading) {
    return (
      <AppShell title="読み込み中...">
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          データを読み込み中...
        </div>
      </AppShell>
    );
  }

  if (!match) {
    return (
      <AppShell title="エラー">
        <div className="p-4 text-center text-muted-foreground">
          試合情報が見つかりません。
        </div>
      </AppShell>
    );
  }

  const canBet = match.status === "scheduled";

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4 space-y-6 max-w-xl mx-auto">
        
        {/* 試合対戦カード */}
        <div className="text-center py-6 bg-card rounded-xl border border-border">
          <div className="flex justify-around items-center text-xl font-bold">
            <div className="text-right w-1/3 truncate">{match.home_team}</div>
            <div className="text-2xl px-4 text-muted-foreground select-none">VS</div>
            <div className="text-left w-1/3 truncate">{match.away_team}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">ステータス: {match.status}</p>
        </div>

        {canBet ? (
          <div className="space-y-6">
            
            {/* ① 勝敗予想セクション */}
            <div className="bg-card p-5 rounded-xl border border-border space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-primary">① 勝敗予想</h2>
                <span className="text-[11px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded border border-amber-500/20">
                  的中配当: x5倍
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={pick === "HOME" ? "default" : "outline"}
                  onClick={() => setPick("HOME")}
                  className="w-full"
                >
                  {match.home_team} 勝利
                </Button>
                <Button
                  type="button"
                  variant={pick === "AWAY" ? "default" : "outline"}
                  onClick={() => setPick("AWAY")}
                  className="w-full"
                >
                  {match.away_team} 勝利
                </Button>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">勝敗に賭けるBASHI額</label>
                <Input
                  type="number"
                  placeholder="数値を入力"
                  value={matchAmount}
                  onChange={(e) => setMatchAmount(e.target.value)}
                />
              </div>
            </div>

            {/* ② 得点者予想セクション */}
            <div className="bg-card p-5 rounded-xl border border-border space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-primary">② 得点者 (スコアラー) 予想</h2>
                <span className="text-[11px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded border border-amber-500/20">
                  的中配当: 各x5倍
                </span>
              </div>
              
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
                        {homePlayers.length > 0 && (
                          <optgroup label={match.home_team}>
                            {homePlayers.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </optgroup>
                        )}
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
                      <Input
                        type="number"
                        placeholder="数値"
                        value={row.amount}
                        onChange={(e) => updateScorerRow(index, "amount", e.target.value)}
                      />
                    </div>

                    {goalBets.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        className="px-3 h-10"
                        onClick={() => removeScorerRow(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full text-xs mt-2"
                onClick={addScorerRow}
              >
                + 別の得点者予想を追加する
              </Button>
            </div>

            {/* 確定保存ボタン */}
            <Button
              onClick={() => mutation.mutate()}
              className="w-full py-6 text-base font-bold bg-primary text-primary-foreground rounded-xl"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "保存中..." : "この内容で予想を確定する"}
            </Button>

          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
            この試合は現在、予想の変更期間外です。
          </div>
        )}
      </div>
    </AppShell>
  );
}
