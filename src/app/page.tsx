"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Radio, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToFeed, FirestorePost } from "@/lib/firestore";
import { posts as mockPosts, artists } from "@/data/mockData";
import PostCard, { UnifiedPost } from "@/components/PostCard";
import CommentSheet from "@/components/CommentSheet";
import { useAppStore } from "@/store/useAppStore";

export default function HomePage() {
  const { user, loading } = useAuth();
  const { getArtistAvatar } = useAppStore();
  const [firestorePosts, setFirestorePosts] = useState<FirestorePost[]>([]);
  const [commentTarget, setCommentTarget] = useState<{ id: string; isFirestore: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "following">("all");
  const unsubRef = useRef<(() => void) | null>(null);

  // Firestore フィード購読
  useEffect(() => {
    unsubRef.current = subscribeToFeed((posts) => setFirestorePosts(posts));
    return () => {
      unsubRef.current?.();
    };
  }, []);

  // モック投稿を UnifiedPost 型に変換
  const mockUnified: UnifiedPost[] = mockPosts.map((p) => {
    const artist = artists.find((a) => a.id === p.artistId);
    return {
      _source: "mock" as const,
      ...p,
      authorName: artist?.name ?? p.artistId,
      authorPhoto: getArtistAvatar(p.artistId) ?? artist?.avatar ?? "",
    };
  });

  // Firestore 投稿を UnifiedPost 型に変換
  const fsUnified: UnifiedPost[] = firestorePosts.map((p) => ({
    _source: "firestore" as const,
    ...p,
  }));

  // 全投稿をマージ（Firestore 優先、最新順）
  const allPosts: UnifiedPost[] = [...fsUnified, ...mockUnified];

  const openComment = useCallback((postId: string) => {
    const isFs = fsUnified.some((p) => p.id === postId);
    setCommentTarget({ id: postId, isFirestore: isFs });
  }, [fsUnified]);

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-30 px-4 py-3"
        style={{
          background: "rgba(5,5,5,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-[28px] font-bold text-gradient tracking-tight">
            SYNE
          </h1>
          <div className="flex items-center gap-2">
            {/* ライブバッジ */}
            <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 rounded-full px-2.5 py-1">
              <Radio size={11} className="text-rose-400 animate-pulse" />
              <span className="text-rose-400 text-[11px] font-bold">LIVE</span>
            </div>
            {!user && (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 border border-zinc-700 rounded-full px-3 py-1.5"
              >
                <LogIn size={13} />
                ログイン
              </Link>
            )}
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-1">
          {[
            { key: "all", label: "すべて" },
            { key: "following", label: "フォロー中" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as "all" | "following")}
              className={`relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === key
                  ? "text-white"
                  : "text-zinc-600"
              }`}
            >
              {activeTab === key && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-full bg-gradient-syne opacity-90"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* フィード */}
      <div>
        {!loading && allPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-syne flex items-center justify-center mb-5 opacity-80">
              <Zap size={28} className="text-white" />
            </div>
            <p className="text-white font-bold text-lg mb-2">まだ投稿がありません</p>
            <p className="text-zinc-500 text-sm mb-6">
              最初の投稿をしてみよう！
            </p>
            <Link href={user ? "/create" : "/login"} className="btn-primary text-sm">
              {user ? "投稿する" : "ログインして投稿"}
            </Link>
          </div>
        )}

        <AnimatePresence initial={false}>
          {allPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <PostCard post={post} onCommentOpen={openComment} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* コメントシート */}
      <CommentSheet
        postId={commentTarget?.id ?? ""}
        open={!!commentTarget}
        onClose={() => setCommentTarget(null)}
        isFirestorePost={commentTarget?.isFirestore ?? false}
      />
    </div>
  );
}
