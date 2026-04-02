"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Crown, Users } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const { toggleFollow, isFollowed } = useAppStore();

  const filtered = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.genre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3">
        <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent mb-3">
          SYNE
        </h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="アーティストを検索..."
            className="w-full bg-zinc-900 text-white placeholder-zinc-600 text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none border border-zinc-800 focus:border-purple-500/50 transition-colors"
          />
        </div>
      </header>

      <div className="px-4 py-4">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
          アーティスト一覧
        </h2>

        <div className="space-y-3">
          {filtered.map((artist) => {
            const followed = isFollowed(artist.id);
            return (
              <div
                key={artist.id}
                className="flex items-center gap-3 bg-zinc-950 rounded-2xl p-3 border border-zinc-800/50"
              >
                <Link href={`/artist/${artist.id}`} className="flex-shrink-0">
                  <Image
                    src={artist.avatar}
                    alt={artist.name}
                    width={56}
                    height={56}
                    className="rounded-full object-cover object-top"
                  />
                </Link>
                <Link href={`/artist/${artist.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-bold text-sm">{artist.name}</span>
                    {artist.verified && (
                      <Crown size={12} className="text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5">{artist.genre}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Users size={11} className="text-zinc-600" />
                    <span className="text-zinc-600 text-xs">{formatFollowers(artist.followers)} フォロワー</span>
                  </div>
                </Link>
                <button
                  onClick={() => toggleFollow(artist.id)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    followed
                      ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  }`}
                >
                  {followed ? "フォロー中" : "フォロー"}
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-zinc-600 py-12">
            <Search size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">アーティストが見つかりませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}
