import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listMatches } from "@/lib/data/repository";

export const Route = createFileRoute("/matches/")({
  component: MatchesIndex,
});

// 国名から国旗絵文字を安全に動的生成
function getFlagEmoji(countryName: string): string {
  if (!countryName) return "🏳️";
  
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
    if (countryName === "イングランド") return "🏴";
    return "🏳️";
  }

  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(char => 127397 + char.charCodeAt(0))
  );
}

// 日本時間のフォーマット（kickoff_time用）
function formatJST(dateString: string): string {
  if (!dateString) return "日時未定";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "日時未定";
    
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${month}/${date}(${dayOfWeek}) ${hours}:${minutes}`;
  } catch (e) {
    return "日時未定";
  }
}

function MatchesIndex() {
  const navigate = useNavigate();
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: listMatches,
  });

  // ★【開発・テスト用モード】
  // 日時が過去でも、一律で「予想受付中」にして動作確認したい場合はここを true にしてください。
  // 本番運用時は false にすると、試合開始30分前に自動で締め切られます。
  const FORCE_ALL_OPEN_FOR_TEST = true;

  if (isLoading) return <AppShell title="読み込み中"><div className="p-4 text-muted-foreground">読み込み中...</div></AppShell>;

  return (
    <AppShell title="試合一覧">
      <div className="p-4 space-y-4 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-primary">トーナメント日程</h2>
        
        <div className="space-y-3">
          {matches?.map((m: any) => {
            // 分析結果に基づき「kickoff_time」を確実に取得
            const rawDate = m.kickoff_time || m.match_date || m.date;
            
            let isBetOpen = false;
            let displayDate = "日時未定";

            if (rawDate) {
              const matchTime = new Date(rawDate).getTime();
              const now = Date.now();
              
              if (!isNaN(matchTime)) {
                const deadline = matchTime - 30 * 60 * 1000;
                // 30分前 かつ 試合がまだ終了(finished)していなければ受付中
                isBetOpen = now < deadline && m.status !== "finished";
                displayDate = formatJST(rawDate);
              }
            }

            // テスト用フラグ、または未精算の試合であれば強制的に受付中にする
            if (FORCE_ALL_OPEN_FOR_TEST && m.status !== "finished" && !m.settled) {
              isBetOpen = true;
            }

            // DB上の実際の「stage」カラムを反映
            const stageName = m.stage || "ベスト36";

            return (
              <div 
                key={m.id} 
                onClick={() => {
                  // 常に詳細ページ（予想入力）へ遷移できるようにクリック制限を解放
                  navigate({ to: "/matches/$matchId", params: { matchId: m.id } });
                }}
                className="p-4 border rounded-xl shadow-sm transition-all bg-card cursor-pointer hover:border-primary border-border"
              >
                {/* ヘッダー: ステージ名 & 受付ステータス */}
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

                {/* メイン: 対戦カード */}
                <div className="flex justify-center items-center py-2 text-base font-bold">
                  <div className="flex items-center gap-2 w-5/12 justify-end text-right">
                    <span>{m.home_team || "未定"}</span>
                    <span className="text-xl">{getFlagEmoji(m.home_team)}</span>
                  </div>
                  <div className="w-2/12 text-center text-xs text-muted-foreground font-normal">VS</div>
                  <div className="flex items-center gap-2 w-5/12 justify-start text-left">
                    <span className="text-xl">{getFlagEmoji(m.away_team)}</span>
                    <span>{m.away_team || "未定"}</span>
                  </div>
                </div>

                {/* フッター: 試合開始日時 */}
                <div className="text-center mt-3 pt-2 border-t border-border/40 text-xs text-muted-foreground font-medium">
                  試合開始 (JST): {displayDate}
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
