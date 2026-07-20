import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/news")({
  component: NewsPage,
  head: () => ({
    meta: [
      {
        title:
          "BASHI CUP 2026 完全総括特集 - BASHI TIMES",
      },
    ],
  }),
});

function NewsPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <header className="border-b bg-white h-[52px]">
        <div className="mx-auto flex h-full max-w-[1280px] items-center px-6">
          <div className="text-[34px] font-bold text-[#ff0033]">
            Yahoo!
          </div>

          <div className="ml-2 text-[28px] font-bold">
            ニュース
          </div>
        </div>
      </header>

      <div className="mx-auto mt-6 flex max-w-[1200px] gap-8 px-4">
        {/* Main */}
        <main className="w-[740px] shrink-0 bg-white px-10 py-8">
          <div className="text-[13px] text-[#666]">
            BASHI TIMES
          </div>

          <h1 className="mt-2 text-[46px] font-bold leading-[1.35] tracking-[-0.02em]">
            王者SABATINI、856,392,000BASHIで戴冠！
            数億BASHIが乱れ飛んだ史上最大の予想バトル
          </h1>

          <div className="mt-5 flex items-center justify-between border-b pb-5">
            <div className="text-[13px] text-[#666]">
              BASHI TIMES特別編集版
              <span className="ml-3">
                2026/7/20(月) 23:58 配信
              </span>
            </div>

            <div className="flex gap-3">
              <button className="rounded-full border px-4 py-2 text-sm">
                💬14
              </button>

              <button className="rounded-full border px-4 py-2 text-sm">
                ↗ シェア
              </button>
            </div>
          </div>

          <img
            src="https://placehold.co/1200x630"
            className="mt-8 w-full"
          />

          <p className="mt-2 text-xs text-[#666]">
            BASHI CUP 2026 王者・SABATINI
          </p>

          <article className="mt-10 space-y-8 text-[17px] leading-[2.1] text-[#222]">
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
              最後にトロフィーを掲げたのは
              SABATINIだった。
            </p>

            <h2 className="text-[30px] font-bold mt-16">
              最終順位
            </h2>

            <table className="mt-6 w-full border-collapse text-[15px]">
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

            <h2 className="mt-16 text-[30px] font-bold">
              BASHI CUP 2026 完全総括
            </h2>

            <p>
              最後まで守らなかった男。
              その大胆さこそが、
              BASHI CUP 2026を象徴する
              “王者の戦い方”だった。
            </p>
          </article>
        </main>

        {/* Sidebar */}
        <aside className="hidden w-[320px] lg:block">
          <div className="bg-white p-5">
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
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
