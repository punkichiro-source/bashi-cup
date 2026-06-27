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
import { supabase } from "@/integrations/supabase/client";
import { Side } from "@/types/domain";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchDetailPage,
});

function MatchDetailPage() {
  const { matchId } = Route.useParams();
  const queryClient = useQueryClient();

  // フォーム用ローカル状態
  const [userId, setUserId] = useState<string | null>(null);
  const [pick, setPick] = useState<Side>("HOME");
  const [matchAmount, setMatchAmount] = useState<string>("");
  const [scorerName, setScorerName] = useState<string>("");
  const [goalAmount, setGoalAmount] = useState<string>("");

  // ユーザーIDの取得
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  // 1. 試合データの取得
  const { data: match, isLoading: isMatchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId),
  });

  // 2. DBから全選手リストを取得（JS側でチーム順・名前順にソート済みデータ）
  const { data: players = [] } = useQuery({
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

  // 既存データがある場合にフォームへ初期値を詰める
  useEffect(() => {
    if (existingMatchBet) {
      setPick(existingMatchBet.pick);
      setMatchAmount(existingMatchBet.amount.toString());
    }
  }, [existingMatchBet]);

  useEffect(() => {
    if (existingGoalBets && existingGoalBets.length > 0) {
      setScorerName(existingGoalBets[0].player_name);
      setGoalAmount(existingGoalBets[0].amount.toString());
    }
  }, [existingGoalBets]);

  // 予想保存ミューテーション
  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId || !match) return;

      // 1. 勝敗予想の保存
      if (matchAmount) {
        await saveMatchBet(userId, match, pick, Number(matchAmount));
      }

      // 2. ゴール予想の保存
      if (scorerName && goalAmount) {
        await saveGoalBets(userId, match, [
          { player_name: scorerName, amount: Number(goalAmount) }
        ]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["userMatchBet", userId, matchId] });
      queryClient.invalidateQueries({ queryKey: ["userGoalBets", userId, matchId] });
      alert("予想を保存しました！");
    },
    onError: (err: any) => {
      alert("保存に失敗しました: " + (err.message || "エラーが発生しました"));
    },
  });

  if (isMatchLoading) return <AppShell title="読み込み中..."><div className="p-4 text-muted-foreground">読み込み中...</div></AppShell>;
  if (!match) return <AppShell title="エラー"><div className="p-4 text-muted-foreground">試合が見つかりません</div></AppShell>;

  const canBet = match.status === "scheduled";

  // 1249件の選手データをセレクトボックスの <optgroup> 用に国（チーム）ごとにグループ化
  const groupedPlayers = players.reduce((acc, player) => {
    if (!acc[player.team]) {
      acc[player.team] = [];
    }
    acc[player.team].push(player);
    return acc;
  }, {} as Record<string, typeof players>);

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4 space-y-6 max-w-xl mx-auto">
        
        {/* 試合カード表示 */}
        <div className="text-center py-6 bg-card rounded-xl border border-border">
          <div className="flex justify-around items-center text-xl font-bold">
            <div className="text-right w-1/3">{match.home_team}</div>
            <div className="text-2xl px-4 text-muted-foreground">VS</div>
            <div className="text-left w-1/3">{match.away_team}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">ステータス: {match.status}</p>
        </div>

        {/* 予想入力フォーム */}
        {canBet ? (
          <div className="space-y-6">
            
            {/* 勝敗予想ブロック */}
            <div className="bg-card p-5 rounded-xl border border-border space-y-4">
              <h2 className="text-base font-semibold text-primary">勝敗予想</h2>
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
                <label className="text-xs text-muted-foreground">勝敗予想に賭けるBASHI額</label>
                <Input
                  type="number"
                  placeholder="数値を入力"
                  value={matchAmount}
                  onChange={(e) => setMatchAmount(e.target.value)}
                />
              </div>
            </div>

            {/* 得点者予想ブロック */}
            <div className="bg-card p-5 rounded-xl border border-border space-y-4">
              <h2 className="text-base font-semibold text-primary">得点者 (スコアラー) 予想</h2>
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">選手を選択</label>
                <select
                  value={scorerName}
                  onChange={(e) => setScorerName(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">-- 選手を選択してください --</option>
                  {Object.entries(groupedPlayers).map(([teamName, teamPlayers]) => (
                    <optgroup key={teamName} label={teamName}>
                      {teamPlayers.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">ゴール予想に賭けるBASHI額</label>
                <Input
                  type="number"
                  placeholder="数値を入力"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>
            </div>

            {/* 確定ボタン */}
            <Button
              onClick={() => mutation.mutate()}
              className="w-full py-6 text-base font-bold bg-primary text-primary-foreground"
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
