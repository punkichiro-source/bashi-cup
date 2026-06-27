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
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // 2. 選手リストの取得
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

      // 1. 勝敗予想の保存 (金額が入力されている場合)
      if (matchAmount) {
        await saveMatchBet(userId, match, pick, Number(matchAmount));
      }

      // 2. ゴール予想の保存 (選手名と金額が入力されている場合)
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
      alert("すべての予想を保存しました！");
    },
    onError: (err: any) => {
      alert("保存に失敗しました: " + (err.message || "エラーが発生しました"));
    },
  });

  if (isMatchLoading) return <AppShell title="読み込み中..."><div className="p-4 text-muted-foreground">読み込み中...</div></AppShell>;
  if (!match) return <AppShell title="エラー"><div className="p-4 text-muted-foreground">試合が見つかりません</div></AppShell>;

  const canBet = match.status === "scheduled";

  // 選手検索フィルタリング
  const filteredPlayers = searchQuery
    ? players.filter(p => p.name.includes(searchQuery) || p.team.includes(searchQuery)).slice(0, 5)
    : [];

  return (
    <AppShell title={`${match.home_team} vs ${match.away_team}`}>
      <div className="p-4 space-y-6 max-w-xl mx-auto">
        {/* 試合ヘッダー */}
        <div className="text-center py-6 bg-card rounded-xl border border-border">
          <div className="flex justify-around items-center text-xl font-bold">
            <div className="text-right w-1/3">{match.home_team}</div>
            <div className="text-2xl px-4 text-muted-foreground">VS</div>
            <div className="text-left w-1/3">{match.away_team}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">ステータス: {match.status}</p>
        </div>

        {/* 予想フォームセクション */}
        {canBet ? (
          <div className="space-y-6">
            {/* 1. 勝敗予想 */}
            <div className="bg-card p-4 rounded-xl border border-border space-y-4">
              <h2 className="text-sm font-semibold border-b border-border pb-2">① 勝敗予想</h2>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={pick === "HOME" ? "default" : "outline"}
                  onClick={() => setPick("HOME")}
                  className="w-full"
                >
                  {match.home_team} の勝利
                </Button>
                <Button
                  type="button"
                  variant={pick === "AWAY" ? "default" : "outline"}
                  onClick={() => setPick("AWAY")}
                  className="w-full"
                >
                  {match.away_team} の勝利
                </Button>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">勝敗に賭けるBASHI</label>
                <Input
                  type="number"
                  placeholder="額を入力"
                  value={matchAmount}
                  onChange={(e) => setMatchAmount(e.target.value)}
                />
              </div>
            </div>

            {/* 2. 得点者予想 */}
            <div className="bg-card p-4 rounded-xl border border-border space-y-4">
              <h2 className="text-sm font-semibold border-b border-border pb-2">② 得点者 (スコアラー) 予想</h2>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block">選手を検索して選択</label>
                <Input
                  type="text"
                  placeholder="選手名または国名を入力..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {/* 検索候補 */}
                {filteredPlayers.length > 0 && (
                  <div className="bg-popover border border-border rounded-md divide-y divide-border overflow-hidden">
                    {filteredPlayers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setScorerName(p.name);
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted block"
                      >
                        {p.name} <span className="text-xs text-muted-foreground">({p.team})</span>
                      </button>
                    ))}
                  </div>
                )}

                {scorerName && (
                  <div className="p-2 bg-secondary text-secondary-foreground text-xs rounded-md flex justify-between items-center">
                    <span>選択中: <strong>{scorerName}</strong></span>
                    <button type="button" onClick={() => setScorerName("")} className="text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">ゴール予想に賭けるBASHI</label>
                <Input
                  type="number"
                  placeholder="額を入力"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>
            </div>

            {/* 送信ボタン */}
            <Button
              onClick={() => mutation.mutate()}
              className="w-full py-6 text-base font-bold"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "保存中..." : "この内容で予想を確定する"}
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
            この試合は現在、予想の新規登録・変更は行えません。
          </div>
        )}
      </div>
    </AppShell>
  );
}
