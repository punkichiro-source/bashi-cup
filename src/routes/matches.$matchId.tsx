// ... (前略：import部分は変更なし)

        {/* 勝敗予想 */}
        <section className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">勝敗予想</h2>
            <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">× 5倍</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["HOME", "AWAY"] as Side[]).map((s) => (
              <button
                key={s}
                disabled={!editable}
                onClick={() => setPick(s)}
                className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  pick === s ? "border-primary bg-primary/10 text-primary font-bold" : "border-border bg-background"
                }`}
              >
                {s === "HOME" ? match.home_team : match.away_team}
              </button>
            ))}
          </div>
          {/* ... (inputと保存ボタンは変更なし) */}
        </section>

        {/* ゴール予想 */}
        <section className="mt-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ゴール予想 (最大{GAME.maxGoalBetsPerMatch}人)
            </h2>
            <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">× 5倍/点</div>
          </div>
          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
            {Array.from({ length: GAME.maxGoalBetsPerMatch }).map((_, i) => {
              const row = rows[i] ?? { player_name: "", amount: "" };
              return (
                <div key={i} className="flex gap-2">
                  <select
                    disabled={!editable}
                    value={row.player_name}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...row, player_name: e.target.value };
                      setRows(next);
                    }}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary text-left"
                  >
                    <option value="">選手を選択してください</option>
                    {matchPlayers.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.team})
                      </option>
                    ))}
                  </select>

                  <input
                    disabled={!editable}
                    inputMode="numeric"
                    value={row.amount}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...row, amount: e.target.value.replace(/\D/g, "") };
                      setRows(next);
                    }}
                    placeholder="金額"
                    className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              );
            })}
          </div>
          {/* ... (保存ボタンは変更なし) */}
        </section>
