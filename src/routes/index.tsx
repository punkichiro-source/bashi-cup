import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listUsers, verifyPin } from "@/lib/data/repository";
import { useSession } from "@/lib/auth/session";
import type { AppUser } from "@/types/domain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "ログイン — BASHI CUP 2026" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useSession();
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: listUsers });
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/home" });
  }, [user, navigate]);

  async function submit() {
    if (!selected || pin.length < 4) return;
    setSubmitting(true);
    try {
      const ok = await verifyPin(selected.id, pin);
      if (!ok) {
        toast.error("PINが正しくありません");
        setPin("");
        return;
      }
      login(ok);
      navigate({ to: "/home" });
    } catch {
      toast.error("ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">World Cup 2026</p>
        <h1 className="font-display text-5xl tracking-wide text-gold-gradient">BASHI CUP</h1>
        <p className="mt-2 text-sm text-muted-foreground">決勝トーナメント予想ゲーム</p>
      </div>

      {!selected ? (
        <div className="space-y-3">
          <p className="mb-2 text-center text-sm text-muted-foreground">プレイヤーを選択</p>
          {users?.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:border-primary"
            >
              <span className="font-display text-xl tracking-wide">{u.name}</span>
              <span className="text-xs text-muted-foreground">{u.is_admin ? "管理者" : "プレイヤー"}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">こんにちは</p>
            <p className="font-display text-3xl tracking-wide text-primary">{selected.name}</p>
          </div>
          <input
            autoFocus
            inputMode="numeric"
            type="password"
            value={pin}
            maxLength={8}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="PIN を入力"
            className="w-full rounded-xl border border-border bg-card px-5 py-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-primary"
          />
          <button
            onClick={submit}
            disabled={submitting || pin.length < 4}
            className="w-full rounded-xl gold-gradient py-4 font-semibold text-primary-foreground disabled:opacity-40"
          >
            ログイン
          </button>
          <button
            onClick={() => {
              setSelected(null);
              setPin("");
            }}
            className="w-full text-center text-sm text-muted-foreground"
          >
            ← プレイヤーを変更
          </button>
        </div>
      )}
    </div>
  );
}
