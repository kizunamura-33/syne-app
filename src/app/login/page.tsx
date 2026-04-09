"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) { toast.error("メールアドレスを入力してください"); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success("パスワードリセットメールを送信しました");
    } catch {
      toast.error("メールの送信に失敗しました。アドレスを確認してください");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      toast.success("ログインしました");
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ログインに失敗しました";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
        toast.error("メールアドレスまたはパスワードが間違っています");
      } else if (msg.includes("user-not-found")) {
        toast.error("アカウントが見つかりません");
      } else {
        toast.error("ログインに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Googleでログインしました");
      router.push("/");
    } catch {
      toast.error("Googleログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4 bg-[#050505]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-syne flex items-center justify-center mb-2">
          <Mail size={28} className="text-white" />
        </div>
        <h1 className="text-white text-xl font-bold">Firebase 未設定</h1>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
          .env.local に Firebase の設定を追加してください。
          <br />
          .env.local.example を参考にしてください。
        </p>
        <Link href="/" className="text-purple-400 text-sm mt-2">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* 背景グラデーション */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #9333ea 0%, transparent 70%)" }}
        />
      </div>

      {/* ヘッダー */}
      <div className="relative z-10 pt-14 px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 mb-10">
          <ArrowLeft size={18} />
          <span className="text-sm">戻る</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* ロゴ */}
          <h1 className="font-display text-5xl font-bold text-gradient tracking-tight mb-2">
            SYNE
          </h1>
          <p className="text-zinc-400 text-base mb-10">おかえりなさい</p>

          {/* フォーム */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* メール */}
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                required
                autoComplete="email"
                className="input-syne pl-10"
              />
            </div>

            {/* パスワード */}
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
                autoComplete="current-password"
                className="input-syne pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* ログインボタン */}
            <motion.button
              type="submit"
              disabled={loading || !email || !password}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  ログイン中...
                </span>
              ) : (
                "ログイン"
              )}
            </motion.button>
          </form>

          {/* パスワードリセット */}
          <div className="text-right mt-2">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="text-zinc-500 text-xs hover:text-purple-400 transition-colors"
            >
              {resetLoading ? "送信中..." : "パスワードを忘れた方"}
            </button>
          </div>

          {/* セパレーター */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-zinc-600 text-xs">または</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Google ログイン */}
          <motion.button
            onClick={handleGoogle}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="btn-ghost w-full flex items-center justify-center gap-3"
          >
            <Globe size={18} />
            Google でログイン
          </motion.button>

          {/* 登録へのリンク */}
          <p className="text-center text-zinc-500 text-sm mt-8">
            アカウントがない？{" "}
            <Link href="/register" className="text-purple-400 font-semibold">
              新規登録
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
