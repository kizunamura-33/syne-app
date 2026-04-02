"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, User } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function BottomNav() {
  const pathname = usePathname();
  const getUnreadCount = useAppStore((s) => s.getUnreadCount);
  const unread = getUnreadCount();

  const tabs = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/discover", icon: Search, label: "発見" },
    { href: "/notifications", icon: Bell, label: "通知", badge: unread },
    { href: "/profile", icon: User, label: "マイ" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-800 pb-safe">
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
                active ? "text-white" : "text-zinc-500"
              }`}
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
      </div>
    </nav>
  );
}
