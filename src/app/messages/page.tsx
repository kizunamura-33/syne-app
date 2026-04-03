"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, MessageCircle } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function MessagesPage() {
  const { followedArtists, unreadChats, getLastMessage, getArtistAvatar } = useAppStore();
  const followed = artists.filter((a) => followedArtists.has(a.id));

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3">
        <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
          SYNE
        </h1>
        <p className="text-zinc-500 text-xs mt-0.5">メッセージ</p>
      </header>

      {followed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <MessageCircle size={48} className="text-zinc-800" />
          <p className="text-zinc-500 text-sm">フォロー中のアーティストがいません</p>
          <Link href="/discover" className="text-purple-400 text-sm">
            アーティストを探す →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/50">
          {followed.map((artist) => {
            const lastMsg = getLastMessage(artist.id);
            const hasUnread = unreadChats.has(artist.id);
            return (
              <Link
                key={artist.id}
                href={`/messages/${artist.id}`}
                className="flex items-center gap-3 px-4 py-4 hover:bg-zinc-950 transition-colors"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden">
                    <img
                      src={getArtistAvatar(artist.id) ?? undefined}
                      alt={artist.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-bold ${hasUnread ? "text-white" : "text-zinc-300"}`}>
                        {artist.name}
                      </span>
                      {artist.verified && (
                        <Crown size={11} className="text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    {lastMsg && (
                      <span className="text-zinc-600 text-xs">{timeAgo(lastMsg.createdAt)}</span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${hasUnread ? "text-zinc-300 font-medium" : "text-zinc-600"}`}>
                    {lastMsg
                      ? lastMsg.fromMe
                        ? `あなた: ${lastMsg.text}`
                        : lastMsg.text
                      : "メッセージを送ってみよう"}
                  </p>
                </div>

                {/* Unread badge */}
                {hasUnread && (
                  <div className="flex-shrink-0 w-2.5 h-2.5 bg-purple-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
