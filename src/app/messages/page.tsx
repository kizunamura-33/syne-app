"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, MessageCircle } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { getFirestoreConversations, FirestoreMessage } from "@/lib/firestore";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

type Conversation = {
  artistId: string;
  lastMessage: FirestoreMessage;
};

export default function MessagesPage() {
  const { user } = useAuth();
  const { getArtistAvatar } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    getFirestoreConversations(user.uid)
      .then((msgs) => {
        // artistId ごとに最新メッセージを取得
        const map = new Map<string, FirestoreMessage>();
        for (const msg of msgs) {
          if (!map.has(msg.artistId)) map.set(msg.artistId, msg);
        }
        const convs: Conversation[] = Array.from(map.entries()).map(([artistId, lastMessage]) => ({
          artistId,
          lastMessage,
        }));
        setConversations(convs);
      })
      .catch(console.error);
  }, [user]);

  return (
    <div className="min-h-screen bg-black pb-24">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-4">
        <h1 className="text-white font-black text-xl">メッセージ</h1>
      </header>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-1">
            <MessageCircle size={28} className="text-zinc-700" />
          </div>
          <p className="text-zinc-400 font-bold text-base">メッセージはありません</p>
          <p className="text-zinc-600 text-sm">フォロー中のアーティストにメッセージを送ってみよう</p>
          <Link href="/discover" className="text-purple-400 text-sm mt-1">
            アーティストを探す →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/30">
          {conversations.map(({ artistId, lastMessage }) => {
            const artist = artists.find((a) => a.id === artistId);
            if (!artist) return null;
            const avatar = getArtistAvatar(artistId) ?? artist.avatar;

            return (
              <Link
                key={artistId}
                href={`/messages/${artistId}`}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-zinc-950 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-13 h-13 rounded-full overflow-hidden bg-zinc-800" style={{ width: 52, height: 52 }}>
                    <img src={avatar} alt={artist.name} className="w-full h-full object-cover object-top" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-zinc-300">{artist.name}</span>
                      {artist.verified && (
                        <Crown size={11} className="text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    <span className="text-zinc-600 text-xs flex-shrink-0 ml-2">
                      {timeAgo(lastMessage.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm truncate text-zinc-600">
                    {lastMessage.fromMe ? `あなた: ${lastMessage.text}` : lastMessage.text}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
