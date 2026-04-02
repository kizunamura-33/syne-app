"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Crown, Users, ChevronLeft, Lock, Check } from "lucide-react";
import { artists, posts } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";
import PostCard from "@/components/PostCard";

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const artist = artists.find((a) => a.id === id);
  const { toggleFollow, isFollowed, toggleSubscribe, isSubscribed } = useAppStore();

  if (!artist) {
    return (
      <div className="flex items-center justify-center min-h-screen text-zinc-500">
        アーティストが見つかりません
      </div>
    );
  }

  const artistPosts = posts.filter((p) => p.artistId === id);
  const followed = isFollowed(id);
  const subscribed = isSubscribed(id);

  return (
    <div className="min-h-screen bg-black">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full"
        >
          <ChevronLeft size={20} className="text-white" />
        </Link>
      </div>

      {/* Cover */}
      <div className="relative h-48">
        <Image
          src={artist.coverImage}
          alt={artist.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
      </div>

      {/* Profile info */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="flex items-end justify-between mb-4">
          <Image
            src={artist.avatar}
            alt={artist.name}
            width={80}
            height={80}
            className="rounded-full object-cover object-top border-4 border-black"
          />
          <div className="flex gap-2">
            <button
              onClick={() => toggleFollow(artist.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                followed
                  ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  : "bg-white text-black"
              }`}
            >
              {followed ? "フォロー中" : "フォロー"}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-black text-white">{artist.name}</h1>
            {artist.verified && (
              <Crown size={16} className="text-yellow-400 fill-yellow-400" />
            )}
          </div>
          <p className="text-purple-400 text-sm font-medium mb-2">{artist.genre}</p>
          <p className="text-zinc-400 text-sm leading-relaxed">{artist.bio}</p>
          <div className="flex items-center gap-1 mt-2">
            <Users size={14} className="text-zinc-500" />
            <span className="text-zinc-500 text-sm">{formatFollowers(artist.followers)} フォロワー</span>
          </div>
        </div>

        {/* Subscription card */}
        <div className={`rounded-2xl p-4 mb-6 border ${
          subscribed
            ? "bg-purple-900/20 border-purple-500/40"
            : "bg-zinc-950 border-zinc-800"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Lock size={14} className={subscribed ? "text-purple-400" : "text-zinc-500"} />
                <span className="text-white font-bold text-sm">ファンクラブ限定</span>
                {subscribed && (
                  <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">
                    加入中
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-xs mt-1">限定コンテンツ・裏側・先行情報</p>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">¥{artist.monthlyPrice.toLocaleString()}</p>
              <p className="text-zinc-600 text-xs">/月</p>
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            {["限定写真・動画", "ライブ優先案内", "コメント返信優先"].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <Check size={12} className="text-purple-400" />
                <span className="text-zinc-400 text-xs">{benefit}</span>
              </div>
            ))}
          </div>

          {!subscribed ? (
            <button
              onClick={() => toggleSubscribe(artist.id)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm py-2.5 rounded-xl"
            >
              サブスクする
            </button>
          ) : (
            <button
              onClick={() => toggleSubscribe(artist.id)}
              className="w-full bg-zinc-800 text-zinc-400 font-bold text-sm py-2.5 rounded-xl border border-zinc-700"
            >
              解約する
            </button>
          )}
        </div>

        {/* Posts */}
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
          投稿
        </h2>
      </div>

      <div>
        {artistPosts.map((post) => (
          <PostCard key={post.id} post={post} showArtist={false} />
        ))}
      </div>
    </div>
  );
}
