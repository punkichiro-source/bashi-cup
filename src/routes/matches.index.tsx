import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listMatches } from "@/lib/data/repository";

export const Route = createFileRoute("/matches/")({
  component: MatchesIndex,
});

// 国名から国旗絵文字を安全に動的生成（特殊文字を直接書かないことでGitHubの警告を回避）
function getFlagEmoji(countryName: string): string {
  if (!countryName) return "🏳️";
  
  // 国名と2文字の国コード（ISO）のマッピング
  const isoCodes: Record<string, string> = {
    "日本": "JP",
    "ブラジル": "BR",
    "フランス": "FR",
    "アルゼンチン": "AR",
    "ドイツ": "DE",
    "スペイン": "ES",
    "イタリア": "IT",
    "ポルトガル": "PT",
    "オランダ": "NL",
    "クロアチア": "HR",
    "ウルグアイ": "UY",
    "アメリカ": "US",
    "韓国": "KR",
    "オーストラリア": "AU",
  };

  const code = isoCodes[countryName];
  if (!code) {
    // イングランドなどの特殊な国旗のフォールバック
    if (countryName === "イングランド") return "🏴";
    return "🏳️";
  }

  // アルファベットを国旗コードポイントに変換するクリーンなロジック
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(char => 127397 + char.charCodeAt(0))
  );
}

function formatJST(dateString: string): string {
  if (!dateString) return "日時未定";
  try {
    const d = new Date(dateString);
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${month}/${date}(${dayOfWeek}) ${hours}:${minutes}`;
  } catch (e) {
    return dateString;
  }
}

function MatchesIndex() {
  const navigate = useNavigate();
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: listMatches,
  });

  if (isLoading) return <AppShell title="読み込み中"><div className="p-4 text-muted-foreground">読み込み中...</div></AppShell>;

  return (
    <AppShell title="試合一覧">
      <div className="p-4 space-y-4 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-primary">トーナメント日程</h2>
        
        <div className="space-y-3">
          {matches?.map((m) => {
            const matchTime = new Date(m.match_date || (m as any).date).getTime();
            const now = Date.now();
            const deadline = matchTime - 30 * 60 * 1000;
            const isBetOpen = now < deadline && m.status === "scheduled";
            const stageName = (m as any).stage || "ベスト36";

            return (
              <div 
                key={m.id} 
                onClick={() => {
                  if (isBetOpen) {
                    navigate({ to: "/matches/$matchId", params: { matchId: m.id } });
                  }
                }}
                className={`p-4 border rounded-xl shadow-sm transition-all bg-card ${
                  isBetOpen 
                    ? "cursor-pointer hover:border-primary border-border" 
                    : "opacity-75 border-border/60 bg-muted/20"
                }`}
              >
                <div className="flex justify-between items-center text-xs mb-3">
                  <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {stageName}
                  </span>
                  {isBetOpen ? (
                    <span className="bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-full text-[11px] animate-pulse">
                      予想受付中
                    </span>
                  ) : (
                    <span className="bg-secondary text-secondary-foreground font-medium px-2.5 py-0.5 rounded-full text-[11px]">
                      受付終了
                    </span>
                  )}
                </div>

                <div className="flex justify-center items-center py-2 text-base font-bold">
                  <div className="flex items-center gap-2 w-5/12 justify-end text-right">
                    <span>{m.home_team}</span>
                    <span className="text-xl">{getFlagEmoji(m.home_team)}</span>
                  </div>
                  <div className="w-2/12 text-center text-xs text-muted-foreground font-normal">VS</div>
                  <div className="flex items-center gap-2 w-5/12 justify-start text-left">
                    <span className="text-xl">{getFlagEmoji(m.away_team)}</span>
                    <span>{m.away_team}</span>
                  </div>
                </div>

                <div className="text-center mt-3 pt-2 border-t border-border/40 text-xs text-muted-foreground font-medium">
                  試合開始 (JST): {formatJST(m.match_date || (m as any).date)}
                </div>
              </div>
            );
          })}

          {(!matches || matches.length === 0) && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              登録されている試合がありません。
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
