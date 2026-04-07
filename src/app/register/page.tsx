"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isFirebaseConfigured } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) return;
    if (password.length < 6) {
      toast.error("パスワードは6文字以上にしてください");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim(), false);
      toast.success("アカウントを作成しました！");
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        toast.error("このメールアドレスはすでに使用されています");
      } else if (msg.includes("weak-password")) {
        toast.error("パスワードが弱すぎます");
      } else {
        toast.error("登録に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4 bg-[#050505]">
        <h1 className="text-white text-xl font-bold">Firebase 未設定</h1>
        <p className="text-zinc-400 text-sm">.env.local に Firebase 設定を追加してください</p>
        <Link href="/" className="text-purple-400 text-sm">← ホームに戻る</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* 背景 */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 pt-14 px-6 pb-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-zinc-400 mb-10">
          <ArrowLeft size={18} />
          <span className="text-sm">戻る</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-5xl font-bold text-gradient tracking-tight mb-2">
            SYNE
          </h1>
          <p className="text-zinc-400 text-base mb-10">アカウントを作成する</p>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* 表示名 */}
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="名前（表示名）"
                required
                maxLength={30}
                className="input-syne pl-10"
              />
            </div>

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
                placeholder="パスワード（6文字以上）"
                required
                autoComplete="new-password"
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

            {/* 登録ボタン */}
            <motion.button
              type="submit"
              disabled={loading || !displayName || !email || !password}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登録中...
                </span>
              ) : (
                "アカウントを作成"
              )}
            </motion.button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-8">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-purple-400 font-semibold">
              ログイン
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
