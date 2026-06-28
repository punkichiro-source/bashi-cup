import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { listAllUsersBets } from "@/lib/data/repository";
import { formatBashi, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/bets")({
  head: () => ({ meta: [{ title: "みんなの予想 — BASHI CUP 2026" }] }),
  component: BetsPage,
});

function userName(row: any): string {
  return row?.users?.name ?? "不明";
}

function matchLabel(m: any): string {
  if (!m) return "試合情報なし";
  return `${m.home_team || "未定"} vs ${m.away_team || "未定"}`;
}

function matchStatusBadge(status?: string): { label: string; cls: string } {
  switch (status) {
    case "finished":
      return { label: "終了", cls: "bg-muted text-muted-foreground border border-border" };
    case "live":
      return { label: "LIVE", cls: "bg-destructive/10 text-destructive border border-destructive/20" };
    default:
      return { label: "受付中", cls: "bg-primary/15 text-primary border border-primary/20" };
  }
}

function resultBadge(row: any): { label: string; cls: string } | null {
  const status = row?.matches?.status;
  if (status !== "finished") return null;
  const win = (row?.payout ?? 0) > 0;
  return win
    ? { label: `的中！ (+${formatBashi(row.payout)})`, cls: "bg-primary/20 text-primary animate-pulse" }
    : { label: "ハズレ", cls: "bg-destructive/20 text-destructive" };
}

// 🛠️ 【修正】どんな日付文字列が来ても確実に「日本時間 (JST) 24時間制」で整形する安全な関数
function formatKickoff(dateString?: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // 不正な日付文字列の場合は空文字
    
    // タイムゾーンを Asia/Tokyo に固定してフォーマット
    return "📅 " + date.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return "";
  }
}

function Empty() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      まだ予想はありません
    </div>
  );
}

function BetCard({
  who,
  what,
  amount,
  result,
}: {
  who: string;
  what?: string;
  amount: number;
  result?: { label: string; cls: string } | null;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-foreground">{who}</p>
        <span className="text-xs font-bold text-primary">{formatBashi(amount)}</span>
      </div>
      
      <div className="flex items-center justify-between gap-2 text-xs">
        <p className="text-muted-foreground">{what}</p>
        {result && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${result.cls}`}>
            {result.label}
          </span>
        )}
      </div>
    </div>
  );
}

function BetsPage() {
  const [tab, setTab] = useState("match");
  const { data, isLoading } = useQuery({
    queryKey: ["allUsersBets"],
    queryFn: listAllUsersBets,
  });

  const matchBets = data?.matchBets ?? [];
  const goalBets = data?.goalBets ?? [];
  const championBets = data?.championBets ?? [];

  // --- ① グループ化 & 日時順ソートロジック（勝敗・ゴール共通） ---
  const processGroups = (bets: any[]) => {
    const grouped = bets.reduce((acc: any, bet: any) => {
      const m = bet.matches;
      const mId = bet.match_id || m?.id;
      if (!mId || !m) return acc;
      
      if (!acc[mId]) {
        acc[mId] = { match: m, bets: [] };
      }
      acc[mId].bets.push(bet);
      return acc;
    }, {});

    // 配列化して、各試合の kickoff_time をタイムスタンプに変換して古い順 (開催が近い順) にソート
    return Object.values(grouped).sort((a: any, b: any) => {
      const timeA = a.match.kickoff_time ? new Date(a.match.kickoff_time).getTime() : 0;
      const timeB = b.match.kickoff_time ? new Date(b.match.kickoff_time).getTime() : 0;
      return timeA - timeB;
    });
  };

  const sortedMatchGroups = processGroups(matchBets);
  const sortedGoalGroups = processGroups(goalBets);

  // ステータスで「受付中/LIVE（未精算）」と「終了（精算済み）」にフィルタリング
  const activeMatchGroups = sortedMatchGroups.filter((g: any) => g.match.status !== "finished");
  const settledMatchGroups = sortedMatchGroups.filter((g: any) => g.match.status === "finished");

  const activeGoalGroups = sortedGoalGroups.filter((g: any) => g.match.status !== "finished");
  const settledGoalGroups = sortedGoalGroups.filter((g: any) => g.match.status === "finished");

  // --- ③ 優勝予想をメンバー（ユーザー）ごとに集計ロジック ---
  const groupedChampionBetsByUsers = championBets.reduce((acc: any, bet: any) => {
    const uName = userName(bet);
    if (!acc[uName]) {
      acc[uName] = [];
    }
    acc[uName].push(bet);
    return acc;
  }, {});

  // メンバーごとのカードを描画する共通コンポーネント
  const renderMatchList = (groups: any[], isGoal: boolean) => (
    <div className="space-y-4">
      {groups.map((group: any) => {
        const badge = matchStatusBadge(group.match.status);
        return (
          <div key={group.match.id} className="border border-border rounded-xl p-3 bg-muted/10 space-y-3">
            <div className="flex flex-col gap-1 border-b border-border/40 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-foreground">
                  {matchLabel(group.match)}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              {/* ② キックオフ日時を表示 */}
              <p className="text-[10px] font-medium text-muted-foreground/80">
                {formatKickoff(group.match.kickoff_time)}
              </p>
            </div>
            <div className="space-y-2">
              {group.bets.map((b: any) => (
                <BetCard
                  key={b.id}
                  who={userName(b)}
                  what={
                    isGoal
                      ? `⚽ 得点者: ${b.player_name}`
                      : b.pick === "HOME"
                      ? `🏠 ${group.match.home_team || "ホーム"} 勝利`
                      : `🚌 ${group.match.away_team || "アウェイ"} 勝利`
                  }
                  amount={b.amount}
                  result={resultBadge(b)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <AppShell title="みんなの予想">
      <p className="mb-4 text-xs text-muted-foreground">
        参加者全員の予想をリアルタイムで確認できます。
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground animate-pulse">読み込み中...</p>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="match">勝敗</TabsTrigger>
            <TabsTrigger value="goal">ゴール</TabsTrigger>
            <TabsTrigger value="champion">優勝</TabsTrigger>
            <TabsTrigger value="results">結果</TabsTrigger>
          </TabsList>

          {/* ① 勝敗予想（開催前の未精算分のみ表示） */}
          <TabsContent value="match" className="mt-0">
            {activeMatchGroups.length === 0 ? <Empty /> : renderMatchList(activeMatchGroups, false)}
          </TabsContent>

          {/* ② ゴール予想（開催前の未精算分のみ表示） */}
          <TabsContent value="goal" className="mt-0">
            {activeGoalGroups.length === 0 ? <Empty /> : renderMatchList(activeGoalGroups, true)}
          </TabsContent>

          {/* ③ 優勝国予想（メンバーごとの表示に刷新） */}
          <TabsContent value="champion" className="space-y-3 mt-0">
            {Object.keys(groupedChampionBetsByUsers).length === 0 ? (
              <Empty />
            ) : (
              Object.entries(groupedChampionBetsByUsers).map(([user, bets]: [string, any]) => (
                <div key={user} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="border-b border-border/40 pb-1.5">
                    <p className="font-display text-base font-bold text-primary">👤 {user} さんの予想</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {bets.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between bg-muted/30 p-2.5 rounded-lg text-xs">
                        <div>
                          <p className="font-medium text-foreground">
                            👑 優勝国: <span className="text-primary font-bold">{b.team}</span>
                          </p>
                          <span className="inline-block mt-1 text-[10px] text-muted-foreground">
                            第{b.rank}候補
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">{formatBashi(b.amount)}</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5">{formatDateTime(b.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* ④ 結果タブ（精算後の全勝敗・ゴール予想、当選金や当たりハズレを表示） */}
          <TabsContent value="results" className="space-y-6 mt-0">
            {settledMatchGroups.length === 0 && settledGoalGroups.length === 0 ? (
              <Empty />
            ) : (
              <>
                {settledMatchGroups.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold text-muted-foreground tracking-wider uppercase pl-1">【精算済み】勝敗予想の結果</h2>
                    {renderMatchList(settledMatchGroups, false)}
                  </div>
                )}
                {settledGoalGroups.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-bold text-muted-foreground tracking-wider uppercase pl-1">【精算済み】ゴール予想の結果</h2>
                    {renderMatchList(settledGoalGroups, true)}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}
