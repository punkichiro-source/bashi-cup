import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      {
        title: "Bashii! ニュース",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-[56px] max-w-[1280px] items-center px-4">
          <div className="text-[26px] font-bold text-[#ff0033] lg:text-[34px]">
            Bashii!
          </div>
          <div className="ml-2 text-[20px] font-bold lg:text-[28px]">
            ニュース
          </div>
        </div>
      </header>

      <div className="mx-auto mt-4 flex max-w-[1200px] flex-col gap-6 px-3 lg:mt-6 lg:flex-row lg:px-4">
        {/* Main */}
        <main className="w-full shrink-0 bg-white px-5 py-6 sm:px-7 lg:w-[740px] lg:px-10 lg:py-8">
          <div className="text-[12px] text-[#666]">
            BASHI TIMES
          </div>

          <h1 className="mt-3 text-[30px] font-bold leading-[1.35] tracking-[-0.02em] sm:text-[38px] lg:text-[46px]">
            王者SABATINI、856,392,000BASHIで戴冠！
            数億BASHIが乱れ飛んだ史上最大の予想バトル
          </h1>

          <div className="mt-5 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[13px] text-[#666]">
              BASHI TIMES特別編集版
              <span className="ml-3">
                2026/7/20(月) 23:58配信
              </span>
            </div>

            <div className="flex gap-2">
              <button className="rounded-full border px-4 py-2 text-sm">
                💬14
              </button>
              <button className="rounded-full border px-4 py-2 text-sm">
                ↗ シェア
              </button>
            </div>
          </div>

          <img
            src="https://placehold.co/1200x650?text=BASHI+CUP+2026"
            className="mt-8 w-full"
          />

          <p className="mt-2 text-xs text-[#666]">
            BASHI CUP 2026 王者・SABATINI（BASHI TIMES）
          </p>

          <article className="mt-8 space-y-7 text-[16px] leading-[2] text-[#222] sm:text-[17px]">
            <h2 className="text-[28px] font-bold">
              BASHI CUP 2026 完全総括特集
            </h2>

            <p>
              4人の予想家によって争われた「BASHI CUP
              2026」は、序盤の数百BASHIの小さな勝負から始まり、
              最終的には数億BASHIが飛び交う壮絶な資金戦へと発展した。
            </p>

            <p>
              堅実に積み上げたBASSI。
              高配当市場を切り開いたENDY。
              終盤に猛追したWATA。
              そして最後まで攻め続けたSABATINI。
            </p>

            <p>
              数々のドラマを経て、最後にトロフィーを掲げたのは
              SABATINIだった。
            </p>

            <p className="font-bold text-[20px]">
              優勝国予想ボーナス2,500BASHIを加え、
              最終残高は856,392,000BASHI。
              まさに王者にふさわしい完全優勝だった。
            </p>

            <h3 className="mt-14 text-[24px] font-bold">
              最終順位
            </h3>

            <div className="overflow-x-auto">
              <table className="mt-4 w-full text-left">
                <tbody>
                  <tr className="border-b">
                    <td className="py-4">🥇1位</td>
                    <td>SABATINI</td>
                    <td className="font-bold text-red-600">
                      856,392,000 BASHI
                    </td>
                  </tr>

                  <tr className="border-b">
                    <td className="py-4">🥈2位</td>
                    <td>WATA</td>
                    <td>1,000 BASHI</td>
                  </tr>

                  <tr className="border-b">
                    <td className="py-4">🥉3位</td>
                    <td>ENDY</td>
                    <td>0 BASHI</td>
                  </tr>

                  <tr>
                    <td className="py-4">4位</td>
                    <td>BASSI</td>
                    <td>0 BASHI</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="mt-14 text-[24px] font-bold">
              流れを変えた5つのターニングポイント
            </h3>

            <h4 className="text-[20px] font-bold">
              【6月中旬】BASSI、序盤首位へ
            </h4>

            <p>
              大会開幕直後は小口ベットが中心。
              BASSIが勝敗市場で着実に的中を積み重ね、
              最初の主導権を握った。
            </p>

            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
              「このままBASSIが逃げ切るのではないか」
            </blockquote>

            <h4 className="text-[20px] font-bold">
              【7月上旬】ENDYの大爆発
            </h4>

            <p>
              ENDYは高倍率市場へ積極投資。
              「一撃で世界を変える」というギャンブラーらしい戦いで、
              一時は優勝争いへ躍り出た。
            </p>

            <h4 className="text-[20px] font-bold">
              【7月中旬】WATA、数億BASHIの猛攻
            </h4>

            <p>
              ラウタロ・マルティネス、
              ラミン・ヤマル、
              オヤルサバルらに優勝への夢を託し、
              大会最大級のドラマを演出した。
            </p>

            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
              「守って2位になるくらいなら、
              負けても優勝を狙う。」
            </blockquote>

            <h3 className="mt-14 text-[24px] font-bold">
              決勝ラウンド総括
            </h3>

            <p>
              WATAは559,769,350BASHIを投資し、
              784,195,500BASHIを回収。
              一時はSABATINIとの差を急速に縮めた。
            </p>

            <p>
              一方でSABATINIは、
              勝敗市場753,398,600投資・2,216,330,500回収、
              得点者市場4,034,151,900投資・
              3,427,601,000回収という圧倒的数字を記録。
            </p>

            <h3 className="mt-14 text-[24px] font-bold">
              プレイヤー心理分析
            </h3>

            <p>
              「勝っている時こそ攻める」SABATINI。
              「2位はいらない」WATA。
              「一撃でひっくり返す」ENDY。
              「まずは生き残る」BASSI。
            </p>

            <h3 className="mt-14 text-[24px] font-bold">
              編集部総評
            </h3>

            <p>
              BASHI CUP 2026は、単なる予想大会ではなかった。
              そこには堅実さ、焦り、逆転への執念、
              そして王者の自信が存在した。
            </p>

            <p className="text-[24px] font-bold leading-[1.8]">
              BASHI CUP 2026 王者<br />
              SABATINI<br />
              最終残高：856,392,000 BASHI
            </p>

            <p>
              最後まで守らなかった男。
              その大胆さこそが、
              BASHI CUP 2026を象徴する
              “王者の戦い方”だった。
            </p>
          </article>
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-[320px]">
          <div className="sticky top-4 bg-white p-5">
            <h3 className="border-b pb-3 text-[20px] font-bold">
              アクセスランキング
            </h3>

            <div className="space-y-5 pt-5 text-[15px]">
              <div className="flex gap-3">
                <div className="font-bold text-red-600">
                  1
                </div>
                <div>
                  SABATINI完全優勝
                </div>
              </div>

              <div className="flex gap-3">
                <div className="font-bold text-red-600">
                  2
                </div>
                <div>
                  WATA、数億BASHIの猛追
                </div>
              </div>

              <div className="flex gap-3">
                <div className="font-bold text-red-600">
                  3
                </div>
                <div>
                  ENDY、高配当市場で躍進
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
