import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Home, ListChecks, Trophy, Crown, Users, Shield, LogOut } from "lucide-react";
import { useSession } from "@/lib/auth/session";
import { formatBashi } from "@/lib/format";

const NAV = [
  { to: "/home", label: "ホーム", icon: Home },
  { to: "/matches", label: "試合", icon: ListChecks },
  { to: "/champion", label: "優勝予想", icon: Crown },
  { to: "/bets", label: "みんなの予想", icon: Users },
  { to: "/ranking", label: "順位", icon: Trophy },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { user, loading, logout } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg leading-none tracking-wide text-gold-gradient">
              {title ?? "BASHI CUP"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">{formatBashi(user.balance)}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">残高</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="ログアウト"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-background/95 backdrop-blur">
        <div className="grid grid-cols-6">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          {user.is_admin ? (
            <Link
              to="/admin"
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
                pathname.startsWith("/admin") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Shield className="h-5 w-5" />
              管理
            </Link>
          ) : (
            <div className="py-2.5" />
          )}
        </div>
      </nav>
    </div>
  );
}
