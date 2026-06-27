import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, ListChecks, Trophy, Crown, Users, Shield, LogOut, RefreshCw } from "lucide-react";
import { useSession } from "@/lib/auth/session";
import { formatBashi } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

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
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ★ 判明したテーブル構造に基づき、users テーブルの balance を直接生フェッチするクエリ
  const { data: latestBalance, refetch: refetchBalance } = useQuery({
    queryKey: ["headerBalance", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from("users") // ご提示いただいた正確なテーブル名
        .select("balance") // ご提示いただいた正確なカラム名
        .eq("id", user.id)
        .single();
        
      if (error) {
        console.error("残高取得エラー:", error);
        throw error;
      }
      return data?.balance ?? 0;
    },
    enabled: !!user?.id,
    initialData: user?.balance ?? 0 // 読み込み中のフォールバック
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      // リアルタイムクエリを直接叩き直してDBの最新値を強制的に再反映
      await refetchBalance();
      // 他のコンポーネントが依存している可能性のあるキーも同時にリフレッシュ
      await queryClient.invalidateQueries({ queryKey: ["headerBalance"] });
      await queryClient.invalidateQueries({ queryKey: ["balance"] });
    } catch (e) {
      console.error("残高の更新に失敗しました", e);
    } finally {
      // くるくるを少し体感させてから終了
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

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
            <div className="flex items-center gap-2 bg-muted/30 pl-2.5 pr-3 py-1 rounded-lg border border-border/40">
              {/* 🔄 手動更新ボタン */}
              <button
                onClick={handleRefreshBalance}
                disabled={isRefreshing}
                className={`text-muted-foreground hover:text-primary p-1 rounded transition-all ${
                  isRefreshing ? "animate-spin text-primary" : ""
                }`}
                title="残高を同期"
              >
                <RefreshCw className="h-3 w-3" />
              </button>

              <div className="text-right">
                {/* ★ 常にDB直結の最新残高をフォーマットして表示 */}
                <p className="text-sm font-semibold text-primary">{formatBashi(latestBalance)}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">残高</p>
              </div>
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
