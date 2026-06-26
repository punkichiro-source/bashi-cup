import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/auth/session";
import { getUserChampionBets, listMatches, saveChampionBets } from "@/lib/data/repository";
import { isTournamentStarted } from "@/lib/admin/syncService";
import { GAME, ODDS } from "@/lib/game/config";

export const Route = createFileRoute("/champion")({
  head: () => ({ meta: [{ title: "優勝国予想 — BASHI CUP 2026" }] }),
  component: ChampionPage,
});

interface Row {
  team: string;
  amount: string;
}

function ChampionPage() {
  const { user, refresh } = useSession();
  const uid = user?.id ?? "";
  const qc = useQueryClient();

  const { data: matches } = useQuery({ queryKey: ["matches"], queryFn: listMatches });
  const { data: bets } = useQuery({
    queryKey: ["championBets", uid],
    queryFn: () => getUserChampionBets(uid),
    enabled: !!uid,
  });
  const { data: started } = useQuery({
    queryKey: ["tournamentStarted"],
    queryFn: isTournamentStarted,
  });

  const teams = useMemo(() => {
    const set = new Set<string>();
    (matches ?? []).forEach((m) => {
      set.add(m.home_team);
      set.add(m.away_team);
    });
    return [...set].sort();
  }, [matches]);

  const [rows, setRows] = useState<Row[]>([
    { team: "", amount: "" },
    { team: "", amount: "" },
    { team: "", amount: "" },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bets && bets.length > 0) {
      const next: Row[] = [
        { team: "", amount: "" },
        { team: "", amount: "" },
        { team: "", amount: "" },
      ];
      bets.forEach((b) => {
        if (b.rank >= 1 && b.rank <= 3) next[b.rank - 1] = { team: b.team, amount: String(b.amount) };
      });
      setRows(next);
    }
  }, [bets]);

  const editable = started === false;

  async function save() {
    if (!editable) return;
    const payload = rows
      .map((r, i) => ({ rank: i + 1, team: r.team.trim(), amount: Number(r.amount) }))
      .filter((r) => r.team && r.amount > 0);
    setSaving(true);
    try {
      await saveChampionBets(uid, payload);
      await refresh();
      qc.invalidateQueries();
      toast.success("優勝予想を保存しました");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="優勝国予想">
      <p className="mb-4 text-xs text-muted-foreground">
        大会開始前のみ編集できます。第1〜第3候補にそれぞれベットしてください。
      </p>
      {!editable && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-card p-3 text-sm text-destructive">
          大会が開始されたため、優勝予想は編集できません。
        </div>
      )}
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-lg text-primary">第{i + 1}候補</p>
              <span className="text-[11px] text-muted-foreground">配当 x{ODDS.champion[i + 1]}</span>
            </div>
            <select
              disabled={!editable}
              value={row.team}
              onChange={(e) =>
                setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, team: e.target.value } : r)))
              }
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="">チームを選択</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              disabled={!editable}
              inputMode="numeric"
              value={row.amount}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, idx) => (idx === i ? { ...r, amount: e.target.value.replace(/\D/g, "") } : r)),
                )
              }
              placeholder={`ベット金額 (${GAME.currency})`}
              className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
            />
          </div>
        ))}
      </div>
      {editable && (
        <button
          onClick={save}
          disabled={saving}
          className="mt-4 w-full rounded-xl gold-gradient py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          優勝予想を保存
        </button>
      )}
    </AppShell>
  );
}
