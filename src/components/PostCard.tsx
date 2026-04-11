"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Crown,
  Lock,
  Play,
  Verified,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { toggleLike, checkLiked, deletePost } from "@/lib/firestore";
import type { FirestorePost } from "@/lib/firestore";
import { useAppStore } from "@/store/useAppStore";
import type { Post as MockPost } from "@/data/mockData";

// ── 統合型 ──────────────────────────────────────────────────────
export type UnifiedPost =
  | ({ _source: "firestore" } & FirestorePost)
  | ({ _source: "mock" } & MockPost & { authorName?: string; authorPhoto?: string });

interface PostCardProps {
  post: UnifiedPost;
  onCommentOpen?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function Avatar({ src, name, size = 32 }: { src?: string; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  if (src) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0 avatar-ring"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="w-full h-full object-cover object-top"
        />
      </div>
    );
  }
  return (
    <div
      className="rounded-full flex-shrink-0 bg-gradient-syne flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function PremiumBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-bold ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      }`}
    >
      <Crown size={small ? 9 : 11} />
      {!small && "Premium"}
    </span>
  );
}

export default function PostCard({ post, onCommentOpen, onDelete }: PostCardProps) {
  const { user, userProfile } = useAuth();
  const {
    isLiked: mockIsLiked,
    toggleLike: mockToggleLike,
    getLikeCount,
    isSubscribed,
    getArtistAvatar,
    artists: storeArtists,
  } = useAppStore();

  const isFirestore = post._source === "firestore";
  const postId = post.id;

  let mediaURL: string | undefined;
  let mediaType: "image" | "video" | undefined;
  let isPremium: boolean;
  let hasAccess: boolean;
  let authorName: string;
  let authorPhoto: string | undefined;
  let authorId: string;
  let caption: string;
  let tags: string[] = [];
  let likesCount: number;
  let commentsCount: number;
  let timeStr: string;
  let isVideoType: boolean;

  if (isFirestore) {
    const p = post as { _source: "firestore" } & FirestorePost;
    mediaURL = p.mediaURL;
    mediaType = p.mediaType;
    isPremium = p.isPremium;
    hasAccess = !isPremium || (userProfile?.isPremiumSubscriber ?? false);
    authorName = p.authorName;
    authorId = p.authorId;
    // 自分の投稿は常に最新のプロフィール写真を使う
    authorPhoto = (user?.uid === p.authorId)
      ? (userProfile?.photoURL || user?.photoURL || p.authorPhoto || undefined)
      : (p.authorPhoto || undefined);
    caption = p.content;
    tags = p.tags ?? [];
    likesCount = p.likesCount;
    commentsCount = p.commentsCount;
    isVideoType = mediaType === "video";
    timeStr = p.createdAt
      ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ja })
      : "";
  } else {
    const p = post as { _source: "mock" } & MockPost & { authorName?: string; authorPhoto?: string };
    mediaURL = p.type === "image" ? p.content : p.thumbnail;
    mediaType = p.type !== "text" ? "image" : undefined;
    isPremium = p.isExclusive;
    hasAccess = !isPremium || isSubscribed(p.artistId);
    authorName = p.authorName ?? (storeArtists?.find((a) => a.id === p.artistId)?.name ?? p.artistId);
    authorPhoto = p.authorPhoto ?? getArtistAvatar(p.artistId) ?? undefined;
    authorId = p.artistId;
    caption = p.caption;
    isVideoType = p.type === "video";
    likesCount = getLikeCount(postId);
    commentsCount = p.comments;
    timeStr = formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: ja });
  }

  const [liked, setLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likesCount);
  const [liking, setLiking] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = isFirestore && !!user && user.uid === authorId;

  const handleDelete = useCallback(async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    try {
      await deletePost(postId);
      onDelete?.(postId);
    } catch (e) {
      console.error("deletePost failed:", e);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [canDelete, deleting, postId, onDelete]);

  useEffect(() => {
    if (isFirestore && user) {
      checkLiked(postId, user.uid).then(setLiked);
    } else if (!isFirestore) {
      setLiked(mockIsLiked(postId));
    }
  }, [postId, user, isFirestore, mockIsLiked]);

  const handleLike = useCallback(async () => {
    if (liking) return;
    setLiking(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setCurrentLikes((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    if (newLiked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    }
    if (isFirestore && user) {
      try {
        await toggleLike(postId, user.uid);
      } catch {
        setLiked(!newLiked);
        setCurrentLikes((c) => (newLiked ? c - 1 : c + 1));
      }
    } else if (!isFirestore) {
      mockToggleLike(postId);
    }
    setLiking(false);
  }, [liked, liking, isFirestore, user, postId, mockToggleLike]);

  const handleDoubleTap = useCallback(() => {
    if (!liked) handleLike();
    else {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 900);
    }
  }, [liked, handleLike]);

  // ── メディア投稿 ───────────────────────────────────────────────
  if (mediaURL) {
    return (
      <article className="w-full">
        <div
          className="relative w-full overflow-hidden bg-[#0a0a0a]"
          style={{ paddingBottom: "125%" }}
          onDoubleClick={handleDoubleTap}
        >
          <Image
            src={mediaURL}
            alt={caption}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className={`object-cover transition-all duration-500 ${
              !hasAccess ? "scale-110 blur-xl saturate-50" : "scale-100"
            }`}
          />

          {/* シネマティックグラデーション */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.05) 65%, transparent 100%)",
            }}
          />

          {/* 動画アイコン */}
          {isVideoType && hasAccess && (
            <div className="absolute top-4 right-4 z-10">
              <div className="glass rounded-full p-2">
                <Play size={16} className="text-white fill-white" />
              </div>
            </div>
          )}

          {/* プレミアムロック */}
          {!hasAccess && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass rounded-3xl p-6 text-center max-w-xs w-full"
              >
                <div className="w-14 h-14 bg-gradient-premium rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-white" />
                </div>
                <p className="text-white font-bold text-lg mb-1">プレミアム限定</p>
                <p className="text-white/60 text-sm mb-5 leading-relaxed">
                  このコンテンツを見るには<br />サブスクリプションが必要です
                </p>
                <Link href={`/artist/${authorId}`} className="btn-primary w-full text-sm py-3">
                  <Crown size={14} />
                  サブスクする
                </Link>
              </motion.div>
            </div>
          )}

          {/* プレミアムバッジ */}
          {isPremium && (
            <div className="absolute top-3 left-3 z-10">
              <PremiumBadge />
            </div>
          )}

          {/* ダブルタップハート */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                key="heart"
                className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.4, opacity: [1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <Heart className="text-white fill-white drop-shadow-2xl" size={80} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 右サイドアクション (TikTok スタイル) */}
          <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
            <motion.button onClick={handleLike} whileTap={{ scale: 0.75 }} className="flex flex-col items-center gap-1">
              <Heart
                size={28}
                className={`drop-shadow-lg transition-colors ${
                  liked ? "fill-rose-500 text-rose-500" : "text-white fill-white/25"
                }`}
              />
              <span className="text-white text-xs font-semibold drop-shadow">{formatCount(currentLikes)}</span>
            </motion.button>

            <button onClick={() => onCommentOpen?.(postId)} className="flex flex-col items-center gap-1">
              <MessageCircle size={26} className="text-white fill-white/25 drop-shadow-lg" />
              <span className="text-white text-xs font-semibold drop-shadow">{formatCount(commentsCount)}</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <Share2 size={24} className="text-white drop-shadow-lg" />
            </button>

            {canDelete && (
              <button onClick={() => setShowDeleteConfirm(true)} className="flex flex-col items-center gap-1">
                <Trash2 size={22} className="text-rose-400 drop-shadow-lg" />
              </button>
            )}
          </div>

          {/* 削除確認オーバーレイ（メディア投稿） */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center gap-4">
              <p className="text-white font-bold text-base">この投稿を削除しますか？</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2.5 rounded-full bg-zinc-700 text-white text-sm font-bold"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2.5 rounded-full bg-rose-600 text-white text-sm font-bold disabled:opacity-50"
                >
                  {deleting ? "削除中..." : "削除"}
                </button>
              </div>
            </div>
          )}

          {/* 下部 作者情報 */}
          <div className="absolute bottom-0 left-0 right-16 p-4 z-20">
            <Link href={`/artist/${authorId}`} className="flex items-center gap-2.5 mb-2">
              <Avatar src={authorPhoto} name={authorName} size={34} />
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold text-sm leading-none">{authorName}</span>
                {isPremium && <Verified size={13} className="text-purple-400" />}
              </div>
            </Link>
            {hasAccess && caption && (
              <p className="text-white/80 text-sm leading-snug line-clamp-2">{caption}</p>
            )}
            {tags.length > 0 && hasAccess && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-purple-400 text-xs">#{t}</span>
                ))}
              </div>
            )}
            <span className="text-white/40 text-[11px] mt-1 block">{timeStr}</span>
          </div>
        </div>
        <div className="feed-divider" />
      </article>
    );
  }

  // ── テキスト投稿 ───────────────────────────────────────────────
  return (
    <article className="w-full">
      <div
        className="px-4 py-5"
        style={{ background: "linear-gradient(135deg, #080808 0%, #111111 100%)" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <Link href={`/artist/${authorId}`}>
            <Avatar src={authorPhoto} name={authorName} size={40} />
          </Link>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/artist/${authorId}`}>
                <span className="text-white font-semibold text-sm">{authorName}</span>
              </Link>
              {isPremium && <PremiumBadge small />}
            </div>
            <span className="text-white/40 text-xs">{timeStr}</span>
          </div>
        </div>

        <div className="pl-4 border-l-2 border-purple-500 mb-4">
          <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">{caption}</p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((t) => (
              <span key={t} className="text-purple-400 text-sm">#{t}</span>
            ))}
          </div>
        )}

        {showDeleteConfirm && (
          <div className="flex items-center justify-between mt-3 p-3 bg-zinc-900 rounded-xl border border-rose-500/30">
            <span className="text-white text-sm font-bold">この投稿を削除しますか？</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-full bg-zinc-700 text-white text-xs font-bold"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-5 pt-3 border-t border-white/5">
          <motion.button
            onClick={handleLike}
            whileTap={{ scale: 0.8 }}
            className="flex items-center gap-1.5 group"
          >
            <Heart
              size={20}
              className={`transition-colors ${
                liked ? "fill-rose-500 text-rose-500" : "text-white/40 group-hover:text-white/70"
              }`}
            />
            <span className={`text-sm font-medium ${liked ? "text-rose-500" : "text-white/40"}`}>
              {formatCount(currentLikes)}
            </span>
          </motion.button>

          <button
            onClick={() => onCommentOpen?.(postId)}
            className="flex items-center gap-1.5 group"
          >
            <MessageCircle size={20} className="text-white/40 group-hover:text-white/70 transition-colors" />
            <span className="text-sm font-medium text-white/40">{formatCount(commentsCount)}</span>
          </button>

          <button className="ml-auto group">
            <Share2 size={19} className="text-white/40 group-hover:text-white/70 transition-colors" />
          </button>

          {canDelete && (
            <button onClick={() => setShowDeleteConfirm(true)} className="group">
              <Trash2 size={18} className="text-rose-400/60 group-hover:text-rose-400 transition-colors" />
            </button>
          )}
        </div>
      </div>
      <div className="feed-divider" />
    </article>
  );
}
