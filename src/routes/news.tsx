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
    <div
      className="min-h-screen bg-[#f5f5f5]"
      style={{ color: "#222" }}
    >
      {/* Header */}
      <header className="border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center px-4">
          <div className="text-[30px] font-bold text-[#ff0033]">
            Bashii!
          </div>

          <div className="ml-3 text-[22px] font-bold text-[#666]">
            ニュース
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-3 py-3 lg:flex-row lg:px-4 lg:py-6">
        {/* Main */}
        <main
          className="
            w-full
            bg-white
            px-5
            py-6
            lg:w-[740px]
            lg:px-10
            lg:py-8
          "
          style={{ color: "#222" }}
        >
          <div className="text-[13px] text-[#666]">
            BASHI TIMES
          </div>

          <h1
            className="
              mt-4
              text-[34px]
              font-bold
              leading-[1.35]
              tracking-[-0.02em]
              lg:text-[48px]
            "
            style={{ color: "#222" }}
          >
            王者SABATINI、
            856,392,000BASHIで戴冠！
            数億BASHIが乱れ飛んだ
            史上最大の予想バトル
          </h1>

          <div className="mt-6 border-b border-[#e5e5e5] pb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-[13px] text-[#666]">
                BASHI TIMES特別編集版　
                2026/7/20(月) 23:58配信
              </div>

              <div className="flex gap-3">
                <button className="rounded-full border border-[#d9d9d9] bg-white px-4 py-2 text-sm text-[#444]">
                  💬14
                </button>

                <button className="rounded-full border border-[#d9d9d9] bg-white px-4 py-2 text-sm text-[#444]">
                  ↗ シェア
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden bg-[#e8e8e8]">
            <div className="flex aspect-[16/9] items-center justify-center text-[40px] font-bold text-[#999] lg:text-[60px]">
              BASHI CUP 2026
            </div>
          </div>

          <p className="mt-2 text-xs text-[#666]">
            BASHI CUP 2026 王者・SABATINI（BASHI TIMES）
          </p>

          <article
            className="
              mt-10
              space-y-8
              text-[17px]
              leading-[2.1]
            "
            style={{ color: "#333" }}
          >
            <h2 className="text-[34px] font-bold text-[#222]">
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

            <p className="font-bold text-[#222]">
              優勝国予想ボーナス2,500BASHIを加え、
              最終残高は856,392,000BASHI。
              まさに王者にふさわしい完全優勝だった。
            </p>

            <h3 className="mt-14 text-[28px] font-bold text-[#222]">
              最終順位
            </h3>

            <div className="overflow-hidden rounded border border-[#e5e5e5]">
              <table className="w-full text-[15px]">
                <tbody>
                  {[
                    ["🥇1位", "SABATINI", "856,392,000 BASHI"],
                    ["🥈2位", "WATA", "1,000 BASHI"],
                    ["🥉3位", "ENDY", "0 BASHI"],
                    ["4位", "BASSI", "0 BASHI"],
                  ].map((r) => (
                    <tr
                      key={r[1]}
                      className="border-b border-[#eee] last:border-none"
                    >
                      <td className="px-4 py-4">{r[0]}</td>
                      <td>{r[1]}</td>
                      <td className="pr-4 text-right font-semibold">
                        {r[2]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-16 text-[28px] font-bold text-[#222]">
              流れを変えた5つのターニングポイント
            </h3>

            <h4 className="text-[22px] font-bold text-[#222]">
              【6月中旬】BASSI、序盤首位へ
            </h4>

            <p>
              大会開幕直後は小口ベットが中心。
              BASSIが勝敗市場で着実に的中を積み重ね、
              最初の主導権を握った。
            </p>

            <blockquote className="border-l-4 border-[#d9d9d9] bg-[#fafafa] px-5 py-4 text-[#666]">
              「このままBASSIが逃げ切るのではないか」
            </blockquote>

            <h4 className="text-[22px] font-bold text-[#222]">
              【7月上旬】ENDYの大爆発
            </h4>

            <p>
              ENDYが高配当市場へ積極投資。
              エンバペ、ヤマル、ケインら高倍率市場へ挑み、
              一時は優勝争いへ名乗りを上げた。
            </p>

            <blockquote className="border-l-4 border-[#d9d9d9] bg-[#fafafa] px-5 py-4 text-[#666]">
              「一撃で世界を変える。」
            </blockquote>

            <h4 className="text-[22px] font-bold text-[#222]">
              【7月中旬】WATA、数億BASHIの猛攻
            </h4>

            <p>
              ラウタロ・マルティネス、
              ラミン・ヤマル、
              オヤルサバルらスター選手へ夢を託し、
              大会最大のドラマを演出した。
            </p>

            <blockquote className="border-l-4 border-[#d9d9d9] bg-[#fafafa] px-5 py-4 text-[#666]">
              「守って2位になるくらいなら、
              負けても優勝を狙う。」
            </blockquote>

            <h3 className="mt-16 text-[28px] font-bold text-[#222]">
              決勝ラウンド総括
            </h3>

            <p>
              WATAは559,769,350BASHIを投資し、
              784,195,500BASHIを回収。
              最後まで逆転を狙い続けた。
            </p>

            <p>
              SABATINIは勝敗市場・得点者市場で
              数十億BASHI規模を動かしながら資金を維持。
              王者の資金運用を披露した。
            </p>

            <h3 className="mt-16 text-[28px] font-bold text-[#222]">
              プレイヤー心理分析
            </h3>

            <p>
              「勝っている時こそ攻める」SABATINI。
              「2位はいらない」WATA。
              「一撃でひっくり返す」ENDY。
              「まずは生き残る」BASSI。
            </p>

            <h3 className="mt-16 text-[28px] font-bold text-[#222]">
              編集部総評
            </h3>

            <p>
              BASHI CUP 2026は、単なる予想大会ではなかった。
              堅実さ、焦り、逆転への執念、
              そして王者の自信。
              すべての感情がBASHIという数字になって表れた大会だった。
            </p>

            <div className="border-t border-[#e5e5e5] pt-10">
              <div className="text-[32px] font-bold text-[#222]">
                BASHI CUP 2026 王者
              </div>

              <div className="mt-4 text-[48px] font-bold text-[#111]">
                SABATINI
              </div>

              <div className="mt-3 text-[22px] font-semibold">
                最終残高：856,392,000 BASHI
              </div>
            </div>
          </article>
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-[320px]">
          <div className="bg-white p-5 lg:sticky lg:top-5">
            <h3 className="border-b border-[#e5e5e5] pb-3 text-[20px] font-bold text-[#222]">
              アクセスランキング
            </h3>

            <div className="space-y-5 pt-5">
              {[
                "SABATINI完全優勝",
                "WATA、数億BASHIの猛追",
                "ENDY、高配当市場で躍進",
              ].map((v, i) => (
                <div key={v} className="flex gap-3">
                  <div className="font-bold text-[#ff0033]">
                    {i + 1}
                  </div>
                  <div className="text-[15px] text-[#333]">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
