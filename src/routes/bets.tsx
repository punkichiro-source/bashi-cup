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
  return `${m.home_team} vs ${m.away_team}`;
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
    ? { label: `的中！ (+${formatBashi(row.payout)})`, cls: "bg-primary/20 text-primary" }
    : { label: "ハズレ", cls: "bg-destructive/20 text-destructive" };
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
  when,
  side,
  result,
}: {
  who: string;
  what?: string;
  amount: number;
  when?: string;
  side?: string;
  result?: { label: string; cls: string } | null;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-foreground">{who}</p>
        <span className="text-xs font-bold text-primary">{formatBashi(amount)}</span>
      </div>
      
      <div className="flex items-center justify-between gap-2 text-xs">
        <p className="text-muted-foreground">{what || side}</p>
        {result && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${result.cls}`}>
            {result.label}
          </span>
        )}
      </div>
      
      {when && (
        <p className="text-[10px] text-muted-foreground/70 text-right">
          {formatDateTime(when)}
        </p>
      )}
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

  // 【新ロジック】勝敗予想を試合（match_id）ごとにグループ化
  const groupedMatchBets = matchBets.reduce((acc: any, bet: any) => {
    const m = bet.matches;
    if (!m) return acc;
    if (!acc[m.id]) {
      acc[m.id] = { match: m, bets: [] };
    }
    acc[m.id].bets.push(bet);
    return acc;
  }, {});

  // 【新ロジック】ゴール予想を試合（match_id）ごとにグループ化
  const groupedGoalBets = goalBets.reduce((acc: any, bet: any) => {
    const m = bet.matches;
    if (!m) return acc;
    if (!acc[m.id]) {
      acc[m.id] = { match: m, bets: [] };
    }
    acc[m.id].bets.push(bet);
    return acc;
  }, {});

  return (
    <AppShell title="みんなの予想">
      <p className="mb-4 text-xs text-muted-foreground">
        参加者全員の予想を試合ごとに確認できます。
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="match">勝敗</TabsTrigger>
            <TabsTrigger value="goal">ゴール</TabsTrigger>
            <TabsTrigger value="champion">優勝</TabsTrigger>
          </TabsList>

          {/* ① 勝敗予想（試合単位） */}
          <TabsContent value="match" className="space-y-4 mt-3">
            {Object.keys(groupedMatchBets).length === 0 ? (
              <Empty />
            ) : (
              Object.values(groupedMatchBets).map((group: any) => {
                const badge = matchStatusBadge(group.match.status);
                return (
                  <div key={group.match.id} className="border border-border rounded-xl p-3 bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <h3 className="font-display text-sm font-bold text-foreground">
                        {matchLabel(group.match)}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.bets.map((b: any) => (
                        <BetCard
                          key={b.id}
                          who={userName(b)}
                          what={b.pick === "HOME" ? "🏠 ホーム勝利" : "🚌 アウェイ勝利"}
                          amount={b.amount}
                          when={b.created_at}
                          result={resultBadge(b)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* ② ゴール予想（試合単位） */}
          <TabsContent value="goal" className="space-y-4 mt-3">
            {Object.keys(groupedGoalBets).length === 0 ? (
              <Empty />
            ) : (
              Object.values(groupedGoalBets).map((group: any) => {
                const badge = matchStatusBadge(group.match.status);
                return (
                  <div key={group.match.id} className="border border-border rounded-xl p-3 bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <h3 className="font-display text-sm font-bold text-foreground">
                        {matchLabel(group.match)}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.bets.map((b: any) => (
                        <BetCard
                          key={b.id}
                          who={userName(b)}
                          what={`⚽ 得点者: ${b.player_name}`}
                          amount={b.amount}
                          when={b.created_at}
                          result={resultBadge(b)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* ③ 優勝国予想（全体リスト） */}
          <TabsContent value="champion" className="space-y-2 mt-3">
            {championBets.length === 0 ? (
              <Empty />
            ) : (
              championBets.map((b: any) => (
                <div key={b.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-display text-base text-primary">{userName(b)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      👑 優勝国: <span className="text-foreground font-semibold">{b.team}</span>
                    </p>
                    <span className="inline-block mt-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                      第{b.rank}候補
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary">{formatBashi(b.amount)}</span>
                    <p className="text-[9px] text-muted-foreground/70 mt-1">{formatDateTime(b.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}
