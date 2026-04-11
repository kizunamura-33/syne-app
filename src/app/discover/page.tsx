"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Crown, Users, Sparkles } from "lucide-react";
import { artists as mockArtists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";
import { getPosts } from "@/lib/firestore";

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

type RealArtist = {
  id: string;
  name: string;
  photo: string;
  postCount: number;
};

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [realArtists, setRealArtists] = useState<RealArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFollow, isFollowed, getArtistAvatar } = useAppStore();

  // 検索デバウンス
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Firestore 投稿から実アーティスト抽出
  useEffect(() => {
    getPosts(undefined, 50)
      .then(({ posts }) => {
        const map = new Map<string, RealArtist>();
        for (const post of posts) {
          if (!post.authorId) continue;
          const existing = map.get(post.authorId);
          if (existing) {
            existing.postCount += 1;
          } else {
            map.set(post.authorId, {
              id: post.authorId,
              name: post.authorName ?? "アーティスト",
              photo: post.authorPhoto ?? "",
              postCount: 1,
            });
          }
        }
        setRealArtists(Array.from(map.values()));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // モックIDセット（重複排除用）
  const mockIdSet = useMemo(() => new Set(mockArtists.map((a) => a.id)), []);

  // Firestore アーティスト（モックと重複しないもの）
  const uniqueRealArtists = useMemo(
    () => realArtists.filter((a) => !mockIdSet.has(a.id)),
    [realArtists, mockIdSet],
  );

  // 検索フィルタ
  const filteredMock = useMemo(
    () =>
      mockArtists.filter(
        (a) =>
          a.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          a.genre.toLowerCase().includes(debouncedQuery.toLowerCase()),
      ),
    [debouncedQuery],
  );

  const filteredReal = useMemo(
    () =>
      uniqueRealArtists.filter((a) =>
        a.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
      ),
    [uniqueRealArtists, debouncedQuery],
  );

  const totalCount = filteredMock.length + filteredReal.length;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white mb-3">アーティストを探す</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前・ジャンルで検索..."
            className="w-full bg-zinc-900 text-white placeholder-zinc-600 text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none border border-zinc-800 focus:border-purple-500/50 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">

        {/* 注目アーティスト（検索なし時のみ） */}
        {!debouncedQuery && mockArtists.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-purple-400" />
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">注目</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {mockArtists.slice(0, 6).map((artist) => {
                const avatar = getArtistAvatar(artist.id) ?? artist.avatar;
                return (
                  <Link
                    key={artist.id}
                    href={`/artist/${artist.id}`}
                    className="flex flex-col items-center gap-2 flex-shrink-0 w-20"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/40">
                      <Image
                        src={avatar}
                        alt={artist.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <span className="text-white text-[11px] font-semibold text-center leading-tight line-clamp-2">
                      {artist.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* アーティスト一覧 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {debouncedQuery ? `「${debouncedQuery}」の結果` : "すべてのアーティスト"}
            </h2>
            {!loading && (
              <span className="text-zinc-700 text-xs">{totalCount}人</span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : totalCount === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Search size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">アーティストが見つかりませんでした</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Firestore 登録アーティスト */}
              {filteredReal.map((artist) => {
                const followed = isFollowed(artist.id);
                return (
                  <div
                    key={artist.id}
                    className="flex items-center gap-3 bg-zinc-950 rounded-2xl p-3 border border-zinc-800/50"
                  >
                    <Link href={`/artist/${artist.id}`} className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800">
                        {artist.photo ? (
                          <img
                            src={artist.photo}
                            alt={artist.name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                            {artist.name[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </Link>
                    <Link href={`/artist/${artist.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold text-sm">{artist.name}</span>
                        <span className="text-zinc-600 text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded-full">
                          {artist.postCount}投稿
                        </span>
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

              {/* モックアーティスト */}
              {filteredMock.map((artist) => {
                const followed = isFollowed(artist.id);
                const avatar = getArtistAvatar(artist.id) ?? artist.avatar;
                return (
                  <div
                    key={artist.id}
                    className="flex items-center gap-3 bg-zinc-950 rounded-2xl p-3 border border-zinc-800/50"
                  >
                    <Link href={`/artist/${artist.id}`} className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={avatar}
                          alt={artist.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    </Link>
                    <Link href={`/artist/${artist.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-bold text-sm">{artist.name}</span>
                        {artist.verified && (
                          <Crown size={12} className="text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5">{artist.genre}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Users size={11} className="text-zinc-600" />
                        <span className="text-zinc-600 text-xs">
                          {formatFollowers(artist.followers)} フォロワー
                        </span>
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
          )}
        </section>
      </div>
    </div>
  );
}
