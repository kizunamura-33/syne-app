"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, MessageCircle } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { getFirestoreConversations, getUserProfile, FirestoreMessage } from "@/lib/firestore";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

type ArtistInfo = {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
};

type Conversation = {
  artistId: string;
  artistInfo: ArtistInfo;
  lastMessage: FirestoreMessage;
};

export default function MessagesPage() {
  const { user } = useAuth();
  const { getArtistAvatar } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    getFirestoreConversations(user.uid)
      .then(async (msgs) => {
        // artistIdごとに最新メッセージを取得
        const map = new Map<string, FirestoreMessage>();
        for (const msg of msgs) {
          if (!map.has(msg.artistId)) map.set(msg.artistId, msg);
        }

        // 各アーティストの情報を取得
        const convs: Conversation[] = await Promise.all(
          Array.from(map.entries()).map(async ([artistId, lastMessage]) => {
            const mockArtist = artists.find((a) => a.id === artistId);
            if (mockArtist) {
              return {
                artistId,
                artistInfo: {
                  id: mockArtist.id,
                  name: mockArtist.name,
                  avatar: getArtistAvatar(artistId) ?? mockArtist.avatar,
                  verified: mockArtist.verified,
                },
                lastMessage,
              };
            }
            // Firestoreアーティスト
            const profile = await getUserProfile(artistId).catch(() => null);
            return {
              artistId,
              artistInfo: {
                id: artistId,
                name: profile?.displayName || "アーティスト",
                avatar: profile?.photoURL || "",
              },
              lastMessage,
            };
          })
        );
        setConversations(convs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, getArtistAvatar]);

  return (
    <div className="min-h-screen bg-black pb-24">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-4">
        <h1 className="text-white font-black text-xl">メッセージ</h1>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
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
          {conversations.map(({ artistId, artistInfo, lastMessage }) => (
            <Link
              key={artistId}
              href={`/messages/${artistId}`}
              className="flex items-center gap-3 px-4 py-3.5 active:bg-zinc-950 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="rounded-full overflow-hidden bg-zinc-800" style={{ width: 52, height: 52 }}>
                  {artistInfo.avatar ? (
                    <img src={artistInfo.avatar} alt={artistInfo.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                      {artistInfo.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-zinc-300">{artistInfo.name}</span>
                    {artistInfo.verified && (
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
          ))}
        </div>
      )}
    </div>
  );
}
