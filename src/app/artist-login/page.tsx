"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Mic } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ArtistLoginPage() {
  const router = useRouter();
  const { signIn, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      toast.success("ログインしました");
      router.push("/create");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
        toast.error("メールアドレスまたはパスワードが間違っています");
      } else {
        toast.error("ログインに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("メールアドレスを入力してください");
      return;
    }
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

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4 bg-[#050505]">
        <h1 className="text-white text-xl font-bold">Firebase 未設定</h1>
        <Link href="/" className="text-purple-400 text-sm">← ホームに戻る</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #9333ea 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 pt-14 px-6 pb-10">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 mb-10">
          <ArrowLeft size={18} />
          <span className="text-sm">戻る</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)" }}>
            <Mic size={26} className="text-white" />
          </div>

          <h1 className="font-display text-4xl font-bold text-white tracking-tight mb-1">
            アーティスト
          </h1>
          <p className="font-display text-4xl font-bold tracking-tight mb-2"
            style={{ background: "linear-gradient(135deg, #9333ea, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ログイン
          </p>
          <p className="text-zinc-500 text-sm mb-10">アーティスト専用アカウントでログインしてください</p>

          <form onSubmit={handleLogin} className="space-y-4">
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
              ) : "ログイン"}
            </motion.button>
          </form>

          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={resetLoading}
            className="w-full text-center text-zinc-500 text-xs mt-4 underline"
          >
            {resetLoading ? "送信中..." : "パスワードをお忘れの方はこちら"}
          </button>

          <p className="text-zinc-600 text-xs text-center mt-4 leading-relaxed">
            アーティストアカウントはSYNE運営が発行します。<br />
            お問い合わせは運営までご連絡ください。
          </p>

          <p className="text-center text-zinc-700 text-xs mt-4">
            ファンの方は{" "}
            <Link href="/login" className="text-zinc-500 underline">こちら</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
