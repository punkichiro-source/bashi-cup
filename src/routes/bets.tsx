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

function matchLabel(row: any): string {
  const m = row?.matches;
  if (!m) return "試合情報なし";
  return `${m.home_team} vs ${m.away_team}`;
}

function matchStatusBadge(status?: string): { label: string; cls: string } {
  switch (status) {
    case "finished":
      return { label: "終了", cls: "bg-muted text-muted-foreground" };
    case "live":
      return { label: "LIVE", cls: "bg-destructive/20 text-destructive" };
    default:
      return { label: "受付中", cls: "bg-primary/15 text-primary" };
  }
}

// 試合終了後の的中/ハズレ結果バッジを返す（未確定なら null）
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
  badge,
  side,
  result,
}: {
  who: string;
  what: string;
  amount: number;
  when?: string;
  badge?: { label: string; cls: string };
  side?: string;
  result?: { label: string; cls: string } | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-base text-primary">{who}</p>
        <span className="text-sm font-semibold text-primary">{formatBashi(amount)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-sm text-foreground">{what}</p>
        {result && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${result.cls}`}>
            {result.label}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{when ? formatDateTime(when) : ""}</span>
        <div className="flex items-center gap-2">
          {side && (
            <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
              {side}
            </span>
          )}
          {badge && (
            <span className={`rounded-full px-2 py-0.5 font-medium ${badge.cls}`}>{badge.label}</span>
          )}
        </div>
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

  return (
    <AppShell title="みんなの予想">
      <p className="mb-4 text-xs text-muted-foreground">
        参加者全員の予想を一覧で確認できます。
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

          <TabsContent value="match" className="space-y-2">
            {matchBets.length === 0 ? (
              <Empty />
            ) : (
              matchBets.map((b: any) => (
                <BetCard
                  key={b.id}
                  who={userName(b)}
                  what={matchLabel(b)}
                  amount={b.amount}
                  when={b.created_at}
                  side={b.pick === "HOME" ? "ホーム勝利" : "アウェイ勝利"}
                  badge={matchStatusBadge(b.matches?.status)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="goal" className="space-y-2">
            {goalBets.length === 0 ? (
              <Empty />
            ) : (
              goalBets.map((b: any) => (
                <BetCard
                  key={b.id}
                  who={userName(b)}
                  what={`${matchLabel(b)}｜得点者: ${b.player_name}`}
                  amount={b.amount}
                  when={b.created_at}
                  badge={matchStatusBadge(b.matches?.status)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="champion" className="space-y-2">
            {championBets.length === 0 ? (
              <Empty />
            ) : (
              championBets.map((b: any) => (
                <BetCard
                  key={b.id}
                  who={userName(b)}
                  what={`優勝予想: ${b.team}`}
                  amount={b.amount}
                  when={b.created_at}
                  side={`第${b.rank}候補`}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}
