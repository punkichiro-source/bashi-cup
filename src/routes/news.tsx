import React from 'react';

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6] font-sans text-[#333]">
      {/* ヘッダー */}
      <header className="bg-[#ffffff] border-b border-[#d9d9d9] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#d6002a] font-extrabold text-2xl italic tracking-tighter">
              Bashii!
            </span>
            <span className="text-xl font-bold text-[#333] mt-1">ニュース</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-bold text-[#333]">
            <a href="#" className="hover:text-[#0044cc]">主要</a>
            <a href="#" className="hover:text-[#0044cc]">スポーツ</a>
            <a href="#" className="text-[#d6002a] border-b-2 border-[#d6002a] pb-1">BASHI CUP</a>
            <a href="#" className="hover:text-[#0044cc]">ランキング</a>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-0 md:px-4 py-4 md:py-6 flex flex-col md:flex-row gap-6">
        
        {/* 左カラム：記事本文 */}
        <article className="flex-1 bg-[#ffffff] md:rounded shadow-sm">
          <div className="p-4 md:p-8">
            <div className="text-sm text-[#666] mb-2 flex items-center gap-2">
              <span>2026年7月21日 12:00 配信</span>
              <span className="bg-[#d6002a] text-white text-xs px-2 py-0.5 rounded">スポーツ</span>
            </div>
            
            <h1 className="text-2xl md:text-[34px] font-bold leading-tight mb-6 text-[#333]">
              王者SABATINI、856,392,000BASHIで戴冠！数億BASHIが乱れ飛んだ史上最大の予想バトル
            </h1>

            {/* シェアボタン風UI */}
            <div className="flex gap-2 mb-8 border-b border-[#d9d9d9] pb-4">
              <button className="flex-1 md:flex-none bg-[#1D9BF0] text-white text-sm font-bold py-2 md:px-6 rounded hover:opacity-80 transition">ポスト</button>
              <button className="flex-1 md:flex-none bg-[#1877F2] text-white text-sm font-bold py-2 md:px-6 rounded hover:opacity-80 transition">シェア</button>
              <button className="flex-1 md:flex-none bg-[#06C755] text-white text-sm font-bold py-2 md:px-6 rounded hover:opacity-80 transition">LINE</button>
            </div>

            {/* 記事本文 */}
            <div className="text-base md:text-[16px] leading-relaxed space-y-8 text-[#333]">
              <section>
                <h2 className="text-xl font-bold border-l-4 border-[#d6002a] pl-3 mb-4">【キックオフ】前代未聞のマネーゲームが開幕</h2>
                <p>世界中のサッカーファンが熱狂した「BASHI CUP 2026」。4名のプレイヤー（SABATINI、WATA、ENDY、BASSI）が持てる知識と度胸のすべてをベットしたこの大会は、最終的に数億BASHIが乱れ飛ぶ、かつてない異常なインフレ相場となった。</p>
              </section>

              <section>
                <h2 className="text-xl font-bold border-l-4 border-[#d6002a] pl-3 mb-4">【前半12分】序盤王者BASSI、怒涛の10連勝</h2>
                <p>序盤、見事な立ち回りを見せたのはBASSIだった。<strong>「まずは生き残る」</strong>と語っていた男は、的確に勝敗とゴールを読み切り、驚異の10連勝を記録。一撃6億BASHIを回収するなど、最大残高は8億2591万BASHIに到達。圧倒的な序盤王者として君臨した。</p>
              </section>

              <section>
                <h2 className="text-xl font-bold border-l-4 border-[#d6002a] pl-3 mb-4">【前半39分】一撃を狙うENDY、孤高のオールイン</h2>
                <p>上位陣が億単位の攻防を繰り広げる中、ENDYは我が道を往く。<strong>「一撃でひっくり返す」</strong>の言葉通り、オールイン率13.5%という極めてアグレッシブな投資スタイルを敢行。的中率45.4%と健闘し、見せ場を作ったが上位陣の爆発力には一歩及ばず。</p>
              </section>

              <section>
                <h2 className="text-xl font-bold border-l-4 border-[#d6002a] pl-3 mb-4">【後半56分】猛追するWATA、堅実と執念</h2>
                <p><strong>「2位では意味がない」</strong>。そう静かに闘志を燃やしたWATAは、最大11連勝をマーク。平均ベット額100万BASHIと堅実な投資を続け、最大残高3114万BASHIまで到達。終盤のインフレの波に乗り切れずとも、見事2位へ滑り込んだ。</p>
              </section>
              
              <section>
                <h2 className="text-xl font-bold border-l-4 border-[#d6002a] pl-3 mb-4">【後半72分】BASSIの崩壊と、巨大なマイナス</h2>
                <p>大会のターニングポイントはフランスvsスペイン戦。首位を走っていたBASSIが、ここに10億BASHIを投じる。しかし無情にも不的中。これを機に歯車が狂い始めたBASSIは、一時は-10億7708万BASHIという途方もないドローダウンを記録した。</p>
              </section>

              <section>
                <h2 className="text-xl font-bold border-l-4 border-[#d6002a] pl-3 mb-4">【後半90+4分】王者SABATINI、奇跡の数十億回収</h2>
                <p>一時は-19億7872万BASHIという絶望的な負債を抱えていたSABATINI。しかし<strong>「勝っている時こそ攻める」</strong>狂気のベットを連発。エンソ・フェルナンデスらのゴール予想に数十億を突っ込み完全的中。一撃20億BASHIを連続で叩き出し、最終残高8億5639万2000BASHIで完全なる一人勝ちを収めた。</p>
              </section>
            </div>

            {/* データ比較表 */}
            <div className="mt-12">
              <h3 className="text-lg font-bold bg-[#f0f0f0] p-2 mb-4">プレイヤー詳細スタッツ</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-[#f6f6f6] border-b border-[#d9d9d9]">
                    <tr>
                      <th className="p-3">項目</th>
                      <th className="p-3">SABATINI</th>
                      <th className="p-3">WATA</th>
                      <th className="p-3">ENDY</th>
                      <th className="p-3">BASSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#eee]">
                      <td className="p-3 font-bold bg-[#fbfbfb]">的中率</td>
                      <td className="p-3">33.65%</td>
                      <td className="p-3">45.94%</td>
                      <td className="p-3">45.45%</td>
                      <td className="p-3 text-[#d6002a] font-bold">52.85%</td>
                    </tr>
                    <tr className="border-b border-[#eee]">
                      <td className="p-3 font-bold bg-[#fbfbfb]">最大連勝</td>
                      <td className="p-3">3</td>
                      <td className="p-3 text-[#d6002a] font-bold">11</td>
                      <td className="p-3">3</td>
                      <td className="p-3">10</td>
                    </tr>
                    <tr className="border-b border-[#eee]">
                      <td className="p-3 font-bold bg-[#fbfbfb]">オールイン率</td>
                      <td className="p-3">4.16%</td>
                      <td className="p-3">7.93%</td>
                      <td className="p-3 text-[#d6002a] font-bold">13.51%</td>
                      <td className="p-3">9.67%</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold bg-[#fbfbfb]">最大残高</td>
                      <td className="p-3 text-[#d6002a] font-bold">37億7127万</td>
                      <td className="p-3">3114万</td>
                      <td className="p-3">81万</td>
                      <td className="p-3">8億2591万</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 編集部総評 */}
            <div className="mt-8 bg-[#f9f9f9] border border-[#d9d9d9] p-4 rounded">
              <h4 className="font-bold text-[#333] mb-2">編集部総評</h4>
              <p className="text-sm text-[#666] leading-relaxed">
                データが物語る通り、最も勝率が高かったのはBASSI（52.85%）であったが、マネーマネジメントと爆発力においてSABATINIが一線を画していた。勝負所での10億BASHI単位のベットが明暗を分けた、まさにドラマチックな大会であったと言える。
              </p>
            </div>
          </div>
        </article>

        {/* 右カラム：サイドバー */}
        <aside className="w-full md:w-[320px] shrink-0 flex flex-col gap-6 px-4 md:px-0 pb-6 md:pb-0">
          
          {/* 最終順位 */}
          <div className="bg-[#ffffff] border border-[#d9d9d9] rounded">
            <h3 className="bg-[#f6f6f6] text-[#333] font-bold p-3 border-b border-[#d9d9d9]">最終順位</h3>
            <ul className="p-0">
              <li className="flex justify-between items-center p-3 border-b border-[#eee]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥇</span>
                  <span className="font-bold">SABATINI</span>
                </div>
                <span className="text-[#d6002a] font-bold text-sm">856,392,000</span>
              </li>
              <li className="flex justify-between items-center p-3 border-b border-[#eee]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥈</span>
                  <span className="font-bold">WATA</span>
                </div>
                <span className="font-bold text-sm">1,000</span>
              </li>
              <li className="flex justify-between items-center p-3 border-b border-[#eee]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥉</span>
                  <span className="font-bold">ENDY</span>
                </div>
                <span className="text-[#666] text-sm">0</span>
              </li>
              <li className="flex justify-between items-center p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#999] ml-1">4位</span>
                  <span className="font-bold ml-1">BASSI</span>
                </div>
                <span className="text-[#666] text-sm">0</span>
              </li>
            </ul>
          </div>

          {/* 表彰（MVP等） */}
          <div className="bg-[#ffffff] border border-[#d9d9d9] rounded">
            <h3 className="bg-[#f6f6f6] text-[#333] font-bold p-3 border-b border-[#d9d9d9]">大会表彰</h3>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <div className="text-[#d6002a] font-bold text-xs mb-1">MVP / 一撃賞</div>
                <div className="font-bold">SABATINI</div>
                <div className="text-[#666] text-xs mt-1">エンソ・フェルナンデス的中で20億獲得</div>
              </div>
              <hr className="border-[#eee]" />
              <div>
                <div className="text-[#d6002a] font-bold text-xs mb-1">序盤王者賞 / ワーストベット賞</div>
                <div className="font-bold">BASSI</div>
                <div className="text-[#666] text-xs mt-1">10連勝達成と、スペイン戦での10億ロスト</div>
              </div>
              <hr className="border-[#eee]" />
              <div>
                <div className="text-[#d6002a] font-bold text-xs mb-1">ベストチャレンジャー賞</div>
                <div className="font-bold">ENDY</div>
                <div className="text-[#666] text-xs mt-1">驚異のオールイン率13.51%</div>
              </div>
            </div>
          </div>

          {/* アクセスランキング（ダミー） */}
          <div className="bg-[#ffffff] border border-[#d9d9d9] rounded">
            <h3 className="bg-[#f6f6f6] text-[#333] font-bold p-3 border-b border-[#d9d9d9]">アクセスランキング</h3>
            <ul className="p-3 space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="text-[#d6002a] font-bold">1</span>
                <a href="#" className="hover:text-[#0044cc] hover:underline leading-snug">王者SABATINI、856,392,000BASHIで戴冠！数億BASHIが乱れ飛んだ...</a>
              </li>
              <li className="flex gap-2">
                <span className="text-[#d6002a] font-bold">2</span>
                <a href="#" className="hover:text-[#0044cc] hover:underline leading-snug">BASSI、痛恨の10億BASHIロストの真相</a>
              </li>
              <li className="flex gap-2">
                <span className="text-[#d6002a] font-bold">3</span>
                <a href="#" className="hover:text-[#0044cc] hover:underline leading-snug">WATAが語る「2位では意味がない」投資哲学</a>
              </li>
            </ul>
          </div>

        </aside>
      </main>
    </div>
  );
}
