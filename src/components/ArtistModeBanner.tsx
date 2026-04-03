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
    <div className="fixed top-2 right-2 z-[80]">
      <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm border border-purple-500/40 rounded-full px-3 py-1.5">
        <Mic size={11} className="text-purple-400" />
        <span className="text-purple-300 text-[11px] font-bold">{artist.name}</span>
        <button onClick={handleLogout} className="text-zinc-500 text-[11px] ml-1">
          退出
        </button>
      </div>
    </div>
  );
}
