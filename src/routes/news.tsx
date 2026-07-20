// src/routes/news.tsx

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/news")({
  component: NewsPage,
  head: () => ({
    meta: [
      {
        title:
          "SABATINIが856,392,000BASHIで完全優勝 - BASHI TIMES",
      },
    ],
  }),
});

function NewsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] py-10">
      <div className="mx-auto max-w-4xl bg-white p-10 shadow-sm">

        <div className="text-sm font-bold text-[#1a73e8]">
          BASHI TIMES
        </div>

        <h1 className="mt-4 text-4xl font-bold leading-tight">
          SABATINIが856,392,000BASHIで完全優勝　
          終盤の連続大型ベットで独走、
          WATAの猛追振り切る【BASHI CUP 2026】
        </h1>

        <div className="mt-3 text-sm text-gray-500">
          2026/07/20 23:58 配信
        </div>

        <div className="mt-10 space-y-7 text-lg leading-9">

          <p>
            4人の予想家によって争われた
            「BASHI CUP 2026」は、
            数億BASHIが飛び交う壮絶な戦いの末、
            SABATINIが856,392,000BASHIで優勝を果たした。
          </p>

          <h2 className="border-l-4 border-blue-500 pl-4 text-2xl font-bold">
            序盤はBASSIが主導権
          </h2>

          <p>
            開幕直後はBASSIが小口ベットを連続的中。
            堅実な戦いで首位に立ち、
            「このまま逃げ切るのでは」
            という空気が漂った。
          </p>

          <h2 className="border-l-4 border-blue-500 pl-4 text-2xl font-bold">
            ENDYが高倍率市場で躍進
          </h2>

          <p>
            得点者市場が始まると、
            ENDYがエンバペ、ケイン、
            ラミン・ヤマル市場で爆発。
            一時は優勝争いの中心へ躍り出た。
          </p>

          <blockquote className="border-l-4 border-gray-300 bg-gray-50 p-5 italic">
            「堅実だけでは届かない。
            一撃で流れを変えるしかない。」
          </blockquote>

          <h2 className="border-l-4 border-blue-500 pl-4 text-2xl font-bold">
            WATA、数億BASHIの猛追
          </h2>

          <p>
            終盤にはWATAが数億BASHI規模の
            大型ベットを敢行。

            ラウタロ・マルティネス、
            ラミン・ヤマル、
            オヤルサバルへ巨額投資し、
            一時は逆転優勝も現実味を帯びた。
          </p>

          <blockquote className="border-l-4 border-gray-300 bg-gray-50 p-5 italic">
            「2位では意味がない。」
          </blockquote>

          <h2 className="border-l-4 border-blue-500 pl-4 text-2xl font-bold">
            王者SABATINI、“守らない王者”
          </h2>

          <p>
            首位に立った後もSABATINIは
            一切守りに入らなかった。

            利益を再投資し、
            数千万、数億BASHI単位の勝負を連続成功。

            最後は優勝国予想も的中し、
            856,392,000BASHIで大会を制した。
          </p>

        </div>

      </div>
    </div>
  );
}
