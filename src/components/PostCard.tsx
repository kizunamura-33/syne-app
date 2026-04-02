"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Lock, Crown, Send } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { artists, posts } from "@/data/mockData";
import type { Post } from "@/data/mockData";
import CommentSheet from "./CommentSheet";

type Props = {
  post: Post;
  showArtist?: boolean;
};

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "たった今";
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function PostCard({ post, showArtist = true }: Props) {
  const artist = artists.find((a) => a.id === post.artistId);
  const { toggleLike, isLiked, getLikeCount, isSubscribed } = useAppStore();
  const liked = isLiked(post.id);
  const likeCount = getLikeCount(post.id);
  const subscribed = isSubscribed(post.artistId);
  const [commentOpen, setCommentOpen] = useState(false);
  const allComments = useAppStore((s) => s.comments);
  const comments = allComments.filter((c) => c.postId === post.id);

  const isLocked = post.isExclusive && !subscribed;

  return (
    <>
      <article className="bg-zinc-950 border-b border-zinc-800/50">
        {showArtist && artist && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Link href={`/artist/${artist.id}`}>
              <Image
                src={artist.avatar}
                alt={artist.name}
                width={36}
                height={36}
                className="rounded-full object-cover object-top"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/artist/${artist.id}`}>
                <div className="flex items-center gap-1">
                  <span className="text-white font-semibold text-sm">{artist.name}</span>
                  {artist.verified && (
                    <Crown size={12} className="text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                <p className="text-zinc-500 text-xs">{timeAgo(post.createdAt)}</p>
              </Link>
            </div>
            {post.isExclusive && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                post.exclusiveType === "paid"
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              }`}>
                <Lock size={10} />
                {post.exclusiveType === "paid" ? `¥${post.price}` : "限定"}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="relative">
          {post.type === "image" && post.content ? (
            <div className="relative aspect-square bg-zinc-900">
              <Image
                src={post.content}
                alt={post.caption}
                fill
                className={`object-cover ${isLocked ? "blur-xl scale-105" : ""}`}
              />
              {isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center gap-2">
                    <Lock size={28} className="text-yellow-400" />
                    <p className="text-white font-bold text-sm text-center">
                      {post.exclusiveType === "paid"
                        ? `¥${post.price} で解放`
                        : "サブスク限定コンテンツ"}
                    </p>
                    <Link
                      href={`/artist/${post.artistId}`}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1.5 rounded-full"
                    >
                      {post.exclusiveType === "paid" ? "購入する" : "サブスクする"}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : post.type === "text" ? (
            <div className={`mx-4 mb-2 rounded-xl p-4 bg-zinc-900 ${isLocked ? "relative overflow-hidden" : ""}`}>
              <p className={`text-white text-sm leading-relaxed ${isLocked ? "blur-sm select-none" : ""}`}>
                {post.caption}
              </p>
              {isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm rounded-xl">
                  <Lock size={22} className="text-yellow-400" />
                  <Link
                    href={`/artist/${post.artistId}`}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1.5 rounded-full"
                  >
                    {post.exclusiveType === "paid" ? `¥${post.price} で解放` : "サブスクする"}
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => toggleLike(post.id)}
            className="flex items-center gap-1.5 group"
          >
            <Heart
              size={22}
              className={`transition-all ${liked ? "fill-rose-500 text-rose-500 scale-110" : "text-zinc-400 group-hover:text-rose-400"}`}
            />
            <span className={`text-sm font-medium ${liked ? "text-rose-500" : "text-zinc-400"}`}>
              {formatCount(likeCount)}
            </span>
          </button>
          <button
            onClick={() => setCommentOpen(true)}
            className="flex items-center gap-1.5 group"
          >
            <MessageCircle size={22} className="text-zinc-400 group-hover:text-white transition-colors" />
            <span className="text-sm font-medium text-zinc-400">{formatCount(comments.length)}</span>
          </button>
          <button className="ml-auto group">
            <Send size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Caption (for image posts) */}
        {post.type === "image" && (
          <div className="px-4 pb-4">
            <p className="text-white text-sm leading-relaxed">
              <span className="font-semibold mr-1">{artist?.name}</span>
              {post.caption}
            </p>
          </div>
        )}
      </article>

      <CommentSheet
        postId={post.id}
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
      />
    </>
  );
}
