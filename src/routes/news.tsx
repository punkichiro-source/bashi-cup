import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/news")({
  component: NewsPage,
});

function NewsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* Yahoo Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
          <div className="text-[34px] font-bold text-red-600">
            Yahoo!
          </div>
          <div className="ml-2 text-2xl font-bold">
            ニュース
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">

        {/* Article */}
        <main className="flex-1">
          <article className="rounded bg-white p-10 shadow-sm">

            <div className="text-sm text-gray-500">
              BASHI TIMES 特別編集部
            </div>

            <h1 className="mt-3 text-[38px] font-bold leading-tight">
              王者SABATINI、856,392,000BASHIで戴冠！
              数億BASHIが乱れ飛んだ史上最大の予想バトル
            </h1>

            <div className="mt-4 border-b pb-5 text-sm text-gray-500">
              7/20(月) 23:58 配信
            </div>

            <img
              src="/images/bashi-news.jpg"
              className="mt-8 w-full rounded"
            />

            <p className="mt-2 text-xs text-gray-500">
              BASHI CUP 2026で優勝したSABATINI
            </p>

            <div className="mt-10 space-y-8 text-[18px] leading-10">

              <p>
                4人の予想家によって争われた
                「BASHI CUP 2026」は、
                序盤の数百BASHIの小さな勝負から始まり、
                最終的には数億BASHIが飛び交う壮絶な資金戦へと発展した。
              </p>

              <p>
                堅実に積み上げたBASSI。
                高配当市場を切り開いたENDY。
                終盤に猛追したWATA。
                そして最後まで攻め続けたSABATINI。
              </p>

              <p>
                数々のドラマを経て、
                最後にトロフィーを掲げたのはSABATINIだった。
              </p>

              <p className="font-bold text-red-600">
                優勝国予想ボーナス2,500BASHIを加え、
                最終残高は856,392,000BASHI。
              </p>

              <h2 className="border-l-4 border-blue-600 pl-4 text-3xl font-bold">
                最終順位
              </h2>

              <table className="w-full border text-center">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-3">順位</th>
                    <th className="border p-3">プレイヤー</th>
                    <th className="border p-3">最終残高</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3">🥇1位</td>
                    <td className="border p-3 font-bold">
                      SABATINI
                    </td>
                    <td className="border p-3 font-bold text-red-600">
                      856,392,000 BASHI
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-3">🥈2位</td>
                    <td className="border p-3">WATA</td>
                    <td className="border p-3">
                      1,000 BASHI
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-3">🥉3位</td>
                    <td className="border p-3">ENDY</td>
                    <td className="border p-3">0 BASHI</td>
                  </tr>
                  <tr>
                    <td className="border p-3">4位</td>
                    <td className="border p-3">BASSI</td>
                    <td className="border p-3">0 BASHI</td>
                  </tr>
                </tbody>
              </table>

              <h2 className="border-l-4 border-blue-600 pl-4 text-3xl font-bold">
                流れを変えた5つのターニングポイント
              </h2>

              <h3 className="text-2xl font-bold">
                【6月中旬】BASSI、序盤首位へ
              </h3>

              <p>
                大会開幕直後は小口ベットが中心。
                BASSIが勝敗市場で着実に的中を積み重ね、
                最初の主導権を握った。
              </p>

              <blockquote className="border-l-4 border-gray-300 bg-gray-50 p-6 italic">
                「このままBASSIが逃げ切るのではないか」
              </blockquote>

              <h3 className="text-2xl font-bold">
                【7月上旬】ENDYの大爆発
              </h3>

              <p>
                エンバペ、ヤマル、ケインといった
                高倍率銘柄を次々に狙い、
                一時的に優勝争いへ名乗りを上げた。
              </p>

              <blockquote className="border-l-4 border-gray-300 bg-gray-50 p-6 italic">
                「一撃で世界を変える。」
              </blockquote>

              <h3 className="text-2xl font-bold">
                【7月中旬】WATA、数億BASHIの猛攻
              </h3>

              <p>
                ラウタロ・マルティネス、
                ラミン・ヤマル、
                オヤルサバルへ巨額投資。
              </p>

              <blockquote className="border-l-4 border-gray-300 bg-gray-50 p-6 italic">
                「守って2位になるくらいなら、
                負けても優勝を狙う。」
              </blockquote>

              <h3 className="text-2xl font-bold">
                【決勝ラウンド】
                SABATINIが王者の資金運用を披露
              </h3>

              <p>
                数千万。
                数億。
                勝った資金をさらに賭ける。
              </p>

              <p>
                その姿はもはや
                「予想家」というより
                「投資家」だった。
              </p>

              <h2 className="border-l-4 border-blue-600 pl-4 text-3xl font-bold">
                編集部総評
              </h2>

              <p>
                BASHI CUP 2026は、
                単なる予想大会ではなかった。
              </p>

              <p>
                堅実さ。
                焦り。
                逆転への執念。
                そして王者の自信。
              </p>

              <p className="text-xl font-bold">
                最後まで守らなかった男。
              </p>

              <p className="text-2xl font-bold text-red-600">
                王者 SABATINI
              </p>

              <p className="font-bold">
                最終残高：
                856,392,000 BASHI
              </p>

            </div>
          </article>
        </main>

        {/* Yahoo風サイドバー */}
        <aside className="hidden w-[320px] lg:block">
          <div className="rounded bg-white p-5 shadow-sm">
            <h3 className="border-b pb-3 text-lg font-bold">
              アクセスランキング
            </h3>

            <div className="space-y-4 pt-4 text-sm">
              <div>① SABATINI完全優勝</div>
              <div>② WATA、数億BASHIの猛追</div>
              <div>③ ENDYの一撃戦略</div>
              <div>④ BASSI序盤首位から失速</div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
