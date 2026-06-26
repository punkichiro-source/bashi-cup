import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getUser } from "@/lib/data/repository";
import type { AppUser } from "@/types/domain";

const STORAGE_KEY = "bashi_cup_session_user_id";

interface SessionValue {
  user: AppUser | null;
  loading: boolean;
  login: (user: AppUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const id = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!id) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await getUser(id);
      
      // 【管理者強制切り替えロジック】
      // ユーザー名に「Endy」または「endy」が含まれている場合は強制的に管理者をtrueにし、
      // 逆に「Bassi」の場合はデータベース側のフラグに関わらずfalseに安全に上書きします。
      if (u) {
        const usernameUpper = (u.username || "").toUpperCase();
        const nameUpper = (u.name || "").toUpperCase();
        
        if (usernameUpper.includes("ENDY") || nameUpper.includes("ENDY")) {
          u.is_admin = true;
        } else if (usernameUpper.includes("BASSI") || nameUpper.includes("BASSI")) {
          u.is_admin = false;
        }
      }

      setUser(u);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback((u: AppUser) => {
    // ログイン時にも同様にEndyを管理者へ強制昇格
    if (u) {
      const usernameUpper = (u.username || "").toUpperCase();
      const nameUpper = (u.name || "").toUpperCase();
      if (usernameUpper.includes("ENDY") || nameUpper.includes("ENDY")) {
        u.is_admin = true;
      } else if (usernameUpper.includes("BASSI") || nameUpper.includes("BASSI")) {
        u.is_admin = false;
      }
    }
    localStorage.setItem(STORAGE_KEY, u.id);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
