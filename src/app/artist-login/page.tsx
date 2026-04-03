"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function ArtistLoginPage() {
  const router = useRouter();
  const { signInAsArtist } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const artistId = await signInAsArtist(email.trim(), password);
      router.push(`/artist/${artistId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <Mic size={28} className="text-white" />
        </div>
        <h1 className="text-white text-xl font-bold">Supabase 未設定</h1>
        <p className="text-zinc-400 text-sm text-center leading-relaxed">
          .env.local に Supabase の URL と anon key を設定してください
        </p>
        <Link href="/" className="text-purple-400 text-sm">← ホームに戻る</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 pt-12 pb-10">
      {/* Back */}
      <Link href="/" className="text-zinc-400 mb-10 self-start">
        <ArrowLeft size={22} />
      </Link>

      {/* Header */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4">
          <Mic size={28} className="text-white" />
        </div>
        <h1 className="text-white text-2xl font-bold">アーティストログイン</h1>
        <p className="text-zinc-500 text-sm mt-2 text-center">
          アーティスト専用アカウントでログインしてください
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="text-zinc-400 text-xs font-semibold mb-1.5 block">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="artist@example.com"
            required
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="text-zinc-400 text-xs font-semibold mb-1.5 block">パスワード</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 rounded-xl px-4 py-3 border border-red-800/40">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3.5 rounded-xl mt-2 disabled:opacity-50"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <p className="text-zinc-600 text-xs text-center mt-8">
        アーティストアカウントはSYNE運営が発行します
      </p>
    </div>
  );
}
