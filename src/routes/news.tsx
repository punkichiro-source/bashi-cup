import { createFileRoute } from "@tanstack/react-router";
import React from "react";

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
    <div className="min-h-screen bg-[#f5f5f5]" style={{ color: "#222" }}>
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
          className="w-full bg-white px-5 py-6 lg:w-[740px] lg:px-10 lg:py-8"
          style={{ color: "#222" }}
        >
          <div className="text-[13px] text-[#666]">
            BASHI TIMES
          </div>

          <h1 className="mt-4 text-[34px] font-bold leading-[1.35] tracking-[-0.02em] lg:text-[48px]">
            王者SABATINI、856,392,000BASHIで戴冠！<br className="hidden lg:block"/>数億BASHIが乱れ飛んだ史上最大の予想バトル
          </h1>

          <div className="mt-6 border-b border-[#e5e5e5] pb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-[13px] text-[#666]">
                BASHI TIMES特別編集版 2026/7/20(月) 23:58配信
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
            className="mt-10 space-y-10 text-[17px] leading-[2.1]"
            style={{ color: "#333" }}
          >
            {/* 記事本文セクション */}
            <section>
              <h2 className="mb-4 text-[24px] font-bold text-[#222] border-l-4 border-[#ff0033] pl-3">
                【キックオフ】前代未聞のマネーゲームが開幕
              </h2>
              <p>
                世界中のサッカーファンが熱狂した「BASHI CUP 2026」。4名のプレイヤー（SABATINI、WATA、ENDY、BASSI）が持てる知識と度胸のすべてをベットしたこの大会は、最終的に数億BASHIが乱れ飛ぶ、かつてない異常なインフレ相場となった。
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-[24px] font-bold text-[#222] border-l-4 border-[#ff0033] pl-3">
                【前半12分】序盤王者BASSI、怒涛の10連勝
              </h2>
              <p>
                序盤、見事な立ち回りを見せたのはBASSIだった。<strong>「まずは生き残る」</strong>と語っていた男は、フランス戦やイングランド戦で的確に勝敗とゴールを読み切り、驚異の10連勝を記録。キリアン・エンバペのゴール的中で一撃6億BASHIを回収するなど、最大残高は8億2591万BASHIに到達。圧倒的な「序盤王者」として君臨した。
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-[24px] font-bold text-[#222] border-l-4 border-[#ff0033] pl-3">
                【前半39分】一撃を狙うENDY、孤高のオールイン
              </h2>
              <p>
                上位陣が億単位の攻防を繰り広げる中、ENDYは我が道を往く。<strong>「一撃でひっくり返す」</strong>の言葉通り、オールイン率13.5%という極めてアグレッシブな投資スタイルを敢行。的中率45.4%と健闘し、最大残高81万BASHIまで見せ場を作ったが、上位陣の爆発力には一歩及ばず、最後は散った。
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-[24px] font-bold text-[#222] border-l-4 border-[#ff0033] pl-3">
                【後半56分】猛追するWATA、堅実と執念
              </h2>
              <p>
                <strong>「2位では意味がない」</strong>。そう静かに闘志を燃やしたWATAは、驚異の最大11連勝をマーク。平均ベット額100万BASHIと、大味な勝負に走るライバルたちを尻目に堅実な投資を続け、最大残高3114万BASHIまで到達する。しかし、狂乱の相場となった終盤戦において、その堅実さゆえにインフレの波に乗り切れず、最終残高は1,000BASHI。それでも見事に2位へ滑り込んだ。
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-[24px] font-bold text-[#222] border-l-4 border-[#ff0033] pl-3">
                【後半72分】BASSIの崩壊と、巨大なマイナス
              </h2>
              <p>
                大会のターニングポイントはフランスvsスペイン戦だった。首位を走っていたBASSIが、ここに10億BASHIを投じる。しかし結果は無情にも不的中。これを機に歯車が狂い始めたBASSIは、怒涛の9連敗を喫し、一時は-10億7708万BASHIという途方もないドローダウンを記録。「生き残る」はずだった王者は、ここで力尽きた。
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-[24px] font-bold text-[#222] border-l-4 border-[#ff0033] pl-3">
                【後半90+4分】王者SABATINI、奇跡の数十億回収
              </h2>
              <p>
                劇的な結末は最終盤に待っていた。一時は-19億7872万BASHIという絶望的な負債を抱えていたSABATINI。しかし<strong>「勝っている時こそ攻める」</strong>狂気のベットを連発。
                <br /><br />
                イングランドvsアルゼンチン戦、エンソ・フェルナンデスとラウタロ・マルティネスのゴール予想に数十億BASHIを突っ込み、これがまさかの完全的中。一撃20億BASHIの払い戻しを連続で叩き出し、最大残高は前人未到の37億7127万BASHIへ。
                最後はスペインvsアルゼンチン戦できっちりと勝敗を読み切り、856,392,000BASHIでフィニッシュ。他の3名が実質破産状態となる中、完全な一人勝ちで大会を制圧した。
              </p>
            </section>

            {/* プレイヤー詳細スタッツ */}
            <h3 className="mt-14 text-[28px] font-bold text-[#222]">
              プレイヤー詳細スタッツ
            </h3>
            <div className="overflow-x-auto rounded border border-[#e5e5e5]">
              <table className="w-full text-left text-[15px] whitespace-nowrap">
                <thead className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                  <tr>
                    <th className="p-3">項目</th>
                    <th className="p-3">SABATINI</th>
                    <th className="p-3">WATA</th>
                    <th className="p-3">ENDY</th>
                    <th className="p-3 text-[#ff0033]">BASSI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#eee]">
                    <td className="p-3 font-bold bg-[#fafafa]">最終残高</td>
                    <td className="p-3 font-bold text-[#ff0033]">8億5639万</td>
                    <td className="p-3">1,000</td>
                    <td className="p-3">0</td>
                    <td className="p-3">0</td>
                  </tr>
                  <tr className="border-b border-[#eee]">
                    <td className="p-3 font-bold bg-[#fafafa]">的中率</td>
                    <td className="p-3">33.65%</td>
                    <td className="p-3">45.94%</td>
                    <td className="p-3">45.45%</td>
                    <td className="p-3 font-bold text-[#ff0033]">52.85%</td>
                  </tr>
                  <tr className="border-b border-[#eee]">
                    <td className="p-3 font-bold bg-[#fafafa]">最大連勝</td>
                    <td className="p-3">3</td>
                    <td className="p-3 font-bold text-[#ff0033]">11</td>
                    <td className="p-3">3</td>
                    <td className="p-3">10</td>
                  </tr>
                  <tr className="border-b border-[#eee]">
                    <td className="p-3 font-bold bg-[#fafafa]">オールイン率</td>
                    <td className="p-3">4.16%</td>
                    <td className="p-3">7.93%</td>
                    <td className="p-3 font-bold text-[#ff0033]">13.51%</td>
                    <td className="p-3">9.67%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold bg-[#fafafa]">最大残高</td>
                    <td className="p-3 font-bold text-[#ff0033]">37億7127万</td>
                    <td className="p-3">3114万</td>
                    <td className="p-3">81万</td>
                    <td className="p-3">8億2591万</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 編集部総評 */}
            <div className="mt-10 border border-[#e5e5e5] bg-[#fafafa] p-6 rounded">
              <h4 className="mb-3 text-[20px] font-bold text-[#222]">編集部総評</h4>
              <p className="text-[15px] leading-relaxed text-[#555]">
                データが物語る通り、最も勝率が高かったのはBASSI（52.85%）であったが、マネーマネジメントと爆発力においてSABATINIが一線を画していた。勝負所での10億BASHI単位のベットが明暗を分けた、まさにドラマチックな大会であったと言える。
              </p>
            </div>
          </article>
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-[320px]">
          <div className="flex flex-col gap-6 lg:sticky lg:top-5">
            
            {/* 最終順位 */}
            <div className="bg-white rounded border border-[#e5e5e5]">
              <h3 className="bg-[#f9f9f9] p-4 text-[18px] font-bold text-[#222] border-b border-[#e5e5e5]">
                最終順位
              </h3>
              <ul className="text-[15px]">
                <li className="flex justify-between items-center p-4 border-b border-[#eee]">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥇</span>
                    <span className="font-bold">SABATINI</span>
                  </div>
                  <span className="text-[#ff0033] font-bold">856,392,000</span>
                </li>
                <li className="flex justify-between items-center p-4 border-b border-[#eee]">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥈</span>
                    <span className="font-bold">WATA</span>
                  </div>
                  <span className="font-bold">1,000</span>
                </li>
                <li className="flex justify-between items-center p-4 border-b border-[#eee]">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥉</span>
                    <span className="font-bold">ENDY</span>
                  </div>
                  <span className="text-[#666]">0</span>
                </li>
                <li className="flex justify-between items-center p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#999] ml-1">4位</span>
                    <span className="font-bold ml-1">BASSI</span>
                  </div>
                  <span className="text-[#666]">0</span>
                </li>
              </ul>
            </div>

            {/* 大会表彰 */}
            <div className="bg-white rounded border border-[#e5e5e5]">
              <h3 className="bg-[#f9f9f9] p-4 text-[18px] font-bold text-[#222] border-b border-[#e5e5e5]">
                大会表彰
              </h3>
              <div className="p-4 space-y-4 text-[14px]">
                <div>
                  <div className="text-[#ff0033] font-bold text-[12px] mb-1">MVP / 一撃賞</div>
                  <div className="font-bold text-[#222]">SABATINI</div>
                  <div className="text-[#666] mt-1">エンソ・フェルナンデス的中で20億獲得</div>
                </div>
                <hr className="border-[#eee]" />
                <div>
                  <div className="text-[#ff0033] font-bold text-[12px] mb-1">序盤王者賞 / ワーストベット賞</div>
                  <div className="font-bold text-[#222]">BASSI</div>
                  <div className="text-[#666] mt-1">10連勝達成と、スペイン戦での10億ロスト</div>
                </div>
                <hr className="border-[#eee]" />
                <div>
                  <div className="text-[#ff0033] font-bold text-[12px] mb-1">ベストチャレンジャー賞</div>
                  <div className="font-bold text-[#222]">ENDY</div>
                  <div className="text-[#666] mt-1">驚異のオールイン率13.51%</div>
                </div>
              </div>
            </div>

            {/* アクセスランキング */}
            <div className="bg-white rounded border border-[#e5e5e5] p-5">
              <h3 className="border-b border-[#e5e5e5] pb-3 text-[18px] font-bold text-[#222]">
                アクセスランキング
              </h3>
              <div className="space-y-4 pt-4">
                {[
                  "王者SABATINI、856,392,000BASHIで戴冠！数億BASHIが乱れ飛んだ...",
                  "BASSI、痛恨の10億BASHIロストの真相",
                  "WATAが語る「2位では意味がない」投資哲学",
                  "ENDY、高配当市場での孤高の戦い",
                ].map((v, i) => (
                  <div key={v} className="flex gap-3">
                    <div className="font-bold text-[#ff0033]">
                      {i + 1}
                    </div>
                    <a href="#" className="text-[14px] text-[#333] hover:text-[#0044cc] hover:underline leading-snug">
                      {v}
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
