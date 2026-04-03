"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Radio, Music, Lock, ImageIcon } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

const typeIcons = {
  live: Radio,
  release: Music,
  exclusive: Lock,
  post: ImageIcon,
};

const typeColors = {
  live: "text-rose-400 bg-rose-500/10",
  release: "text-purple-400 bg-purple-500/10",
  exclusive: "text-yellow-400 bg-yellow-500/10",
  post: "text-blue-400 bg-blue-500/10",
};

export default function NotificationsPage() {
  const { notifications, markNotificationsRead, getArtistAvatar } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => markNotificationsRead(), 1000);
    return () => clearTimeout(timer);
  }, [markNotificationsRead]);

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3">
        <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
          SYNE
        </h1>
        <p className="text-zinc-500 text-xs mt-0.5">通知</p>
      </header>

      <div className="divide-y divide-zinc-800/50">
        {notifications.map((notif) => {
          const artist = artists.find((a) => a.id === notif.artistId);
          const Icon = typeIcons[notif.type];
          const colorClass = typeColors[notif.type];

          return (
            <Link
              key={notif.id}
              href={`/artist/${notif.artistId}`}
              className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-zinc-950 ${
                !notif.read ? "bg-zinc-950/50" : ""
              }`}
            >
              {/* Avatar + icon */}
              <div className="relative flex-shrink-0">
                {artist && (
                  <div className="w-11 h-11 rounded-full overflow-hidden">
                    <img
                      src={getArtistAvatar(artist.id) ?? undefined}
                      alt={artist.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon size={10} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm leading-snug">{notif.message}</p>
                <p className="text-zinc-600 text-xs mt-1">{timeAgo(notif.createdAt)}</p>
              </div>

              {/* Unread dot */}
              {!notif.read && (
                <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
