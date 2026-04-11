"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Radio, Music, Lock, ImageIcon, Heart, MessageCircle, Bell } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "たった今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

function groupLabel(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  if (diffDays < 7) return "今週";
  return "それ以前";
}

const GROUP_ORDER = ["今日", "昨日", "今週", "それ以前"];

type NotifType = "live" | "release" | "post" | "exclusive" | "like" | "comment";

const typeIcons: Record<NotifType, React.ElementType> = {
  live: Radio,
  release: Music,
  exclusive: Lock,
  post: ImageIcon,
  like: Heart,
  comment: MessageCircle,
};

const typeColors: Record<NotifType, string> = {
  live: "text-rose-400 bg-rose-500/15",
  release: "text-purple-400 bg-purple-500/15",
  exclusive: "text-yellow-400 bg-yellow-500/15",
  post: "text-blue-400 bg-blue-500/15",
  like: "text-rose-400 bg-rose-500/15",
  comment: "text-green-400 bg-green-500/15",
};

export default function NotificationsPage() {
  const { notifications, markNotificationsRead, getArtistAvatar } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => markNotificationsRead(), 1500);
    return () => clearTimeout(timer);
  }, [markNotificationsRead]);

  // 日付ごとにグルーピング
  const grouped = useMemo(() => {
    const map = new Map<string, typeof notifications>();
    for (const n of notifications) {
      const label = groupLabel(n.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    // 表示順に並べ直す
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      label: g,
      items: map.get(g)!,
    }));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-xl">通知</h1>
            {unreadCount > 0 && (
              <p className="text-zinc-500 text-xs mt-0.5">{unreadCount}件の未読</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markNotificationsRead()}
              className="text-purple-400 text-xs font-semibold"
            >
              すべて既読
            </button>
          )}
        </div>
      </header>

      {/* 空の場合 */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
            <Bell size={28} className="text-zinc-700" />
          </div>
          <p className="text-zinc-400 font-bold text-base mb-1">通知はありません</p>
          <p className="text-zinc-600 text-sm">フォロー中のアーティストの更新がここに届きます</p>
        </div>
      )}

      {/* 通知リスト */}
      <div className="divide-y divide-zinc-800/30">
        {grouped.map(({ label, items }) => (
          <div key={label}>
            {/* グループラベル */}
            <div className="px-4 py-2 bg-zinc-950/60">
              <span className="text-zinc-500 text-xs font-bold">{label}</span>
            </div>

            {items.map((notif) => {
              const artist = artists.find((a) => a.id === notif.artistId);
              const avatar = getArtistAvatar(notif.artistId) ?? artist?.avatar;
              const displayName = artist?.name ?? "アーティスト";
              const type = (notif.type as NotifType) in typeIcons ? (notif.type as NotifType) : "post";
              const Icon = typeIcons[type];
              const colorClass = typeColors[type];

              return (
                <Link
                  key={notif.id}
                  href={`/artist/${notif.artistId}`}
                  className={`flex items-start gap-3 px-4 py-3.5 transition-colors active:bg-zinc-900 ${
                    !notif.read ? "bg-purple-950/10" : ""
                  }`}
                >
                  {/* Avatar + type icon */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                          {displayName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-black ${colorClass}`}>
                      <Icon size={10} />
                    </div>
                  </div>

                  {/* テキスト */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-white text-sm leading-snug">{notif.message}</p>
                    <p className="text-zinc-600 text-xs mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>

                  {/* 未読ドット */}
                  {!notif.read && (
                    <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
