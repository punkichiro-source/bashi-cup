
-- USERS
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL DEFAULT '1111',
  balance INTEGER NOT NULL DEFAULT 10000,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MATCHES
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE,
  stage TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  home_score INTEGER,
  away_score INTEGER,
  winner TEXT,                 -- 'HOME' | 'AWAY' (PK含む最終勝者)
  scorers JSONB NOT NULL DEFAULT '[]'::jsonb, -- 90分+延長の得点者名 (PK除外)
  settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MATCH BETS (勝敗予想)
CREATE TABLE public.match_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  pick TEXT NOT NULL,          -- 'HOME' | 'AWAY'
  amount INTEGER NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT false,
  payout INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

-- GOAL BETS (得点者予想)
CREATE TABLE public.goal_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT false,
  payout INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id, player_name)
);

-- CHAMPION BETS (優勝国予想)
CREATE TABLE public.champion_bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,        -- 1 | 2 | 3
  team TEXT NOT NULL,
  amount INTEGER NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT false,
  payout INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, rank)
);

-- TRANSACTIONS (取引履歴)
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,           -- 'bet' | 'payout' | 'refund' | 'adjust'
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,      -- 増減 (+/-)
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTS (PIN方式の固定ユーザーゲームのため anon で操作)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_bets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_bets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.champion_bets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon, authenticated;
GRANT ALL ON public.users, public.matches, public.match_bets, public.goal_bets, public.champion_bets, public.transactions TO service_role;

-- RLS (4人専用のプライベートゲーム: 全ロールにフルアクセス)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.champion_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open access" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open access" ON public.matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open access" ON public.match_bets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open access" ON public.goal_bets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open access" ON public.champion_bets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open access" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- 固定ユーザー初期データ
INSERT INTO public.users (name, pin, balance, is_admin) VALUES
  ('BASSI', '1111', 10000, true),
  ('SABATINI', '1111', 10000, false),
  ('WATA', '1111', 10000, false),
  ('ENDY', '1111', 10000, false);
