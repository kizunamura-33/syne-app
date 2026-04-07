"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Bell, User, MessageCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { getUnreadCount, getTotalUnreadChats } = useAppStore();
  const { user, userProfile } = useAuth();
  const isArtist = userProfile?.isArtist === true;
  const unread = getUnreadCount();
  const unreadChats = getTotalUnreadChats();

  const tabs = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/discover", icon: Search, label: "発見" },
    { href: "/messages", icon: MessageCircle, label: "チャット", badge: unreadChats },
    { href: "/notifications", icon: Bell, label: "通知", badge: unread },
    { href: "/profile", icon: User, label: "マイ" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Border gradient top */}
      <div
        className="max-w-md mx-auto"
        style={{
          background: "rgba(5,5,5,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center">
          {/* Left 2: ホーム, 発見 */}
          {tabs.slice(0, 2).map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${active ? "text-white" : "text-zinc-500"}`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px]">{label}</span>
              </Link>
            );
          })}

          {/* 中央: マイページ */}
          {(() => {
            const active = pathname === "/profile";
            return (
              <Link href="/profile" className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${active ? "text-white" : "text-zinc-500"}`}>
                <User size={22} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px]">マイ</span>
              </Link>
            );
          })()}

          {/* チャット, 通知 */}
          {tabs.slice(2, 4).map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href || (pathname.startsWith(href + "/") && href !== "/");
            return (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${active ? "text-white" : "text-zinc-500"}`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px]">{label}</span>
              </Link>
            );
          })}

          {/* 右端: 投稿（アーティストのみ） */}
          <Link
            href={isArtist ? "/create" : user ? "/create" : "/artist-login"}
            className="flex-1 flex flex-col items-center py-3 gap-0.5"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: isArtist ? "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)" : "rgba(39,39,42,1)",
                boxShadow: isArtist ? "0 2px 12px rgba(147,51,234,0.4)" : "none",
              }}
            >
              <Plus size={20} className={isArtist ? "text-white" : "text-zinc-600"} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] text-zinc-500">投稿</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
