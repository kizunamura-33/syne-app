"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, Settings, ChevronRight } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";

export default function ProfilePage() {
  const { followedArtists, subscribedArtists } = useAppStore();

  const followedList = artists.filter((a) => followedArtists.has(a.id));
  const subscribedList = artists.filter((a) => subscribedArtists.has(a.id));

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
          SYNE
        </h1>
        <button className="text-zinc-400">
          <Settings size={20} />
        </button>
      </header>

      {/* My profile */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Image
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
            alt="My profile"
            width={72}
            height={72}
            className="rounded-full object-cover border-2 border-zinc-800"
          />
          <div>
            <h2 className="text-white font-bold text-lg">あなた</h2>
            <p className="text-zinc-500 text-sm">@fan_user</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-950 rounded-2xl p-3 border border-zinc-800/50 text-center">
            <p className="text-white font-black text-2xl">{followedList.length}</p>
            <p className="text-zinc-500 text-xs mt-0.5">フォロー中</p>
          </div>
          <div className="bg-zinc-950 rounded-2xl p-3 border border-zinc-800/50 text-center">
            <p className="text-white font-black text-2xl">{subscribedList.length}</p>
            <p className="text-zinc-500 text-xs mt-0.5">サブスク中</p>
          </div>
          <div className="bg-zinc-950 rounded-2xl p-3 border border-zinc-800/50 text-center">
            <p className="text-white font-black text-2xl">0</p>
            <p className="text-zinc-500 text-xs mt-0.5">投げ銭総額</p>
          </div>
        </div>

        {/* Subscribed artists */}
        {subscribedList.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
              サブスク中のアーティスト
            </h3>
            <div className="space-y-2">
              {subscribedList.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  className="flex items-center gap-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-3 border border-purple-500/20"
                >
                  <Image
                    src={artist.avatar}
                    alt={artist.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-semibold text-sm">{artist.name}</span>
                      {artist.verified && (
                        <Crown size={11} className="text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    <p className="text-purple-400 text-xs">¥{artist.monthlyPrice.toLocaleString()}/月</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Followed artists */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
            フォロー中のアーティスト
          </h3>
          {followedList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-600 text-sm">まだフォロー中のアーティストはいません</p>
              <Link href="/discover" className="text-purple-400 text-sm mt-2 inline-block">
                アーティストを探す →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {followedList.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  className="flex items-center gap-3 bg-zinc-950 rounded-2xl p-3 border border-zinc-800/50"
                >
                  <Image
                    src={artist.avatar}
                    alt={artist.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-semibold text-sm">{artist.name}</span>
                      {artist.verified && (
                        <Crown size={11} className="text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs">{artist.genre}</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Monetization section */}
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-4 border border-purple-500/20">
          <h3 className="text-white font-bold text-sm mb-1">投げ銭機能</h3>
          <p className="text-zinc-400 text-xs mb-3">ライブ配信中にアーティストを応援しよう</p>
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm py-2.5 rounded-xl">
            ライブを探す
          </button>
        </div>
      </div>
    </div>
  );
}
