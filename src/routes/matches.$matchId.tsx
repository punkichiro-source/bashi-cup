import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { getMatch, listPlayers, applyBalanceChange } from "@/lib/data/repository";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth/session";

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchDetail,
});

function MatchDetail() {
  const { matchId } = useParams({ from: "/matches/$matchId" });
  const { user } = useSession();
  const qc = useQueryClient();
  const [betAmount, setBetAmount] = useState(10);
  const [selectedSide, setSelectedSide] = useState<"HOME" | "AWAY" | "draw" | null>(null);
  const [selectedScorers, setSelectedScorers] = useState<string[]>([]);

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: listPlayers,
  });

  // 現在のユーザーの最新残高を明示的に取得するクエリ
  const { data: currentBalance } = useQuery({
    queryKey: ["balance", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase
        .from("balances")
        .select("amount")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.amount ?? 0;
    },
    enabled: !!user,
  });

  if (matchLoading || !match) return <AppShell title="読み込み中">読み込み中...</AppShell>;

  const availablePlayers = players.filter(
    (p) => p.team === match.home_team || p.team === match.away_team
  );

  const handleBetSubmit = async () => {
    if (!user) {
      toast.error("ログインが必要です");
      return;
    }
    if (!selectedSide && selectedScorers.length === 0) {
      toast.error("予想を選択してください");
      return;
    }

    // 総ベット額の計算 (勝敗1個[あれば] + 得点者数) × 単価
    const totalBetCount = (selectedSide ? 1 : 0) + selectedScorers.length;
    const totalCost = totalBetCount * betAmount;

    // 残高不足チェック
    if ((currentBalance ?? 0) < totalCost) {
      toast.error(`残高が不足しています (必要: ${totalCost}B$ / 所持: ${currentBalance ?? 0}B$)`);
      return;
    }

    try {
      // ① 勝敗予想の保存
      if (selectedSide) {
        await supabase.from("match_bets").insert({
          user_id: user.id,
          match_id: matchId,
          pick: selectedSide,
          amount: betAmount,
          settled: false,
          payout: 0
        });
      }

      // ② 得点者予想の保存
      for (const scorer of selectedScorers) {
        await supabase.from("goal_bets").insert({
          user_id: user.id,
          match_id: matchId,
          player_name: scorer,
          amount: betAmount,
          settled: false,
          payout: 0
        });
      }

      // ★【最重要】投票完了した瞬間に、ユーザーの所持残高からベット総額を引き落とす
      const label = `${match.home_team} vs ${match.away_team}`;
      await applyBalanceChange(user.id, -totalCost, "bet", `試合予想へのベット: ${label} (${totalBetCount}箇所)`);

      // ★ ヘッダーを含む画面全体の残高・ベッティングキャッシュを「即時」強制リフレッシュ
      await qc.invalidateQueries();
      await qc.invalidateQueries({ queryKey: ["balance"] });
      await qc.invalidateQueries({ queryKey: ["user"] });
      
      toast.success(`予想を送信しました！ (${totalCost}B$ を使用)`);
      
      // フォームの選択状態をクリア
      setSelectedSide(null);
      setSelectedScorers([]);
    } catch (e) {
      console.error(e);
      toast.error("エラーが発生しました");
    }
  };

  return (
    <AppShell title="試合予想">
      <div className="p-4 space-y-6 max-w-md mx-auto mb-20">
        
        {/* 対戦カード */}
        <div className="text-center p-4 border rounded-xl bg-card">
          <div className="text-xs text-muted-foreground mb-1">{match.stage || "グループステージ"}</div>
          <div className="flex justify-center items-center gap-4 text-lg font-bold">
            <span>{match.home_team}</span>
            <span className="text-sm font-normal text-muted-foreground">vs</span>
            <span>{match.away_team}</span>
          </div>
        </div>

        {/* ① 勝敗予想セクション */}
        <div className="space-y-3 p-4 border rounded-xl bg-card relative overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-primary">① 勝利予想</h3>
            <span className="text-[11px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded border border-amber-500/20">
              的中配当: ベット額 × 5倍
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["HOME", "draw", "AWAY"] as const).map((side) => (
              <button
                key={side}
                onClick={() => setSelectedSide(side)}
                className={`py-3 text-xs font-semibold rounded-lg border transition-all ${
                  selectedSide === side
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {side === "HOME" ? match.home_team : side === "AWAY" ? match.away_team : "引き分け"}
              </button>
            ))}
          </div>
        </div>

        {/* ② 得点者予想セクション */}
        <div className="space-y-3 p-4 border rounded-xl bg-card">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-primary">② 得点者予想 (複数選択可)</h3>
            <span className="text-[11px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded border border-amber-500/20">
              的中配当: 1名につき × 5倍
            </span>
          </div>
          
          <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-background space-y-1">
            {availablePlayers.map((p) => {
              const isSelected = selectedScorers.includes(p.name);
              return (
                <label key={p.id} className="flex items-center justify-between p-2 hover:bg-muted rounded text-xs cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedScorers(prev =>
                          isSelected ? prev.filter(n => n !== p.name) : [...prev, p.name]
                        );
                      }}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{p.team}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* ベット額設定と送信 */}
        <div className="p-4 border rounded-xl bg-card space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-muted-foreground">1予想あたりのベット額</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-20 text-center p-1 border rounded font-bold"
              />
              <span className="font-bold text-primary">B$</span>
            </div>
          </div>

          <button
            onClick={handleBetSubmit}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow hover:opacity-90 transition-opacity"
          >
            予想を確定して投票する
          </button>
        </div>

      </div>
    </AppShell>
  );
}
