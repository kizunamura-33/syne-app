"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { artists } from "@/data/mockData";
import { Mic } from "lucide-react";

export default function ArtistModeBanner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { supabaseArtistId, signOutAsArtist } = useAppStore();
  const router = useRouter();

  if (!mounted || !supabaseArtistId) return null;
  const artist = artists.find((a) => a.id === supabaseArtistId);
  if (!artist) return null;

  const handleLogout = async () => {
    await signOutAsArtist();
    router.push("/");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[80] max-w-md mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic size={13} className="text-white" />
          <span className="text-white text-xs font-bold">アーティストモード：{artist.name}</span>
        </div>
        <button onClick={handleLogout} className="text-white/80 text-xs font-medium">
          ログアウト
        </button>
      </div>
    </div>
  );
}
