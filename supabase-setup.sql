-- ============================================================
-- SYNE アーティスト認証 - Supabase セットアップ SQL
-- Supabase Dashboard > SQL Editor で実行してください
-- ============================================================

-- 1. artist_profiles テーブル作成
CREATE TABLE IF NOT EXISTS public.artist_profiles (
  artist_id    TEXT PRIMARY KEY,           -- 'ziou', 'haruki', 'airi', 'ryusei'
  user_id      UUID REFERENCES auth.users(id) UNIQUE,
  bio          TEXT,
  avatar_data  TEXT,                       -- base64 data URL
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

-- 誰でも読める
CREATE POLICY "Public read artist profiles"
  ON public.artist_profiles FOR SELECT
  USING (true);

-- 本人のみ更新可能
CREATE POLICY "Artists can update own profile"
  ON public.artist_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 本人のみ挿入可能
CREATE POLICY "Artists can insert own profile"
  ON public.artist_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. アーティストアカウント作成手順
-- ============================================================
-- Supabase Dashboard > Authentication > Users > "Add user" から
-- 各アーティストのメールアドレス・パスワードを設定し、
-- User Metadata に以下を入力してください:
--
--   ZIOU        → { "artist_id": "ziou" }
--   ひめの らむ  → { "artist_id": "haruki" }
--   いりす ゆり  → { "artist_id": "airi" }
--   RYUSEI      → { "artist_id": "ryusei" }
--
-- ユーザー作成後、そのユーザーの UUID を確認して
-- 以下の INSERT を実行してください（UUID を置き換えること）:
-- ============================================================

-- INSERT INTO public.artist_profiles (artist_id, user_id) VALUES
--   ('ziou',    '<ziou-user-uuid>'),
--   ('haruki',  '<haruki-user-uuid>'),
--   ('airi',    '<airi-user-uuid>'),
--   ('ryusei',  '<ryusei-user-uuid>');
