"use client";

import { use, useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Crown, Send } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage({ params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = use(params);
  const artist = artists.find((a) => a.id === artistId);
  const { user, userProfile } = useAuth();
  const { chatMessages, sendMessage, markChatRead, myAvatar, supabaseArtistId } = useAppStore();
  const myPhoto = userProfile?.photoURL ?? user?.photoURL ?? myAvatar;
  const [mounted, setMounted] = useState(false);
  const isArtistMode = mounted && supabaseArtistId === artistId;
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = chatMessages.filter((m) => m.artistId === artistId);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    markChatRead(artistId);
  }, [artistId, markChatRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(artistId, text.trim());
    setText("");
  };

  if (!artist) {
    return (
      <div className="flex items-center justify-center min-h-screen text-zinc-500">
        アーティストが見つかりません
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3 flex items-center gap-3">
        <Link href="/messages" className="flex-shrink-0">
          <ChevronLeft size={22} className="text-white" />
        </Link>
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={artist.avatar}
            alt={artist.name}
            width={36}
            height={36}
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-white font-bold text-sm">{artist.name}</span>
            {artist.verified && (
              <Crown size={11} className="text-yellow-400 fill-yellow-400" />
            )}
          </div>
          {!isArtistMode && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-green-500 text-xs">オンライン</span>
            </div>
          )}
        </div>
        <Link
          href={`/artist/${artist.id}`}
          className="text-xs text-purple-400 font-medium"
        >
          プロフィール
        </Link>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-36">
        {/* Date divider */}
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs">今日</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {messages.map((msg) => {
          // アーティストモード時は fromMe の表示を反転（ファンが送った=左、自分=右）
          const isMine = isArtistMode ? !msg.fromMe : msg.fromMe;
          return (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* 相手のアバター */}
            {!isMine && (
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-1">
                <Image
                  src={isArtistMode ? (myPhoto || artist.avatar) : artist.avatar}
                  alt={isArtistMode ? "ファン" : artist.name}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}

            <div className={`flex flex-col gap-1 max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-white rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-zinc-600 text-[10px]">{formatTime(msg.createdAt)}</span>
            </div>
          </div>
          );
        })}

        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3">
              <Image
                src={artist.avatar}
                alt={artist.name}
                width={64}
                height={64}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <p className="text-white font-bold">{artist.name}</p>
            <p className="text-zinc-500 text-sm mt-1">{artist.genre}</p>
            <p className="text-zinc-600 text-xs mt-3">最初のメッセージを送ってみよう</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-black border-t border-zinc-800 px-4 py-3 flex items-center gap-3 z-[60]">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <img
            src={isArtistMode ? artist.avatar : myPhoto}
            alt="me"
            className="w-full h-full object-cover object-top"
          />
        </div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={isArtistMode ? "ファンに返信..." : `${artist.name}にメッセージ...`}
          className="flex-1 bg-zinc-800 text-white placeholder-zinc-600 text-sm rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-purple-500/50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-30 transition-opacity flex-shrink-0"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
