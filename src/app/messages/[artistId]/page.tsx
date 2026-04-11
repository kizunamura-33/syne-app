"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Send } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import {
  sendFirestoreMessage,
  getFirestoreMessages,
  FirestoreMessage,
  getUserProfile,
} from "@/lib/firestore";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AUTO_REPLIES = [
  "ありがとう！嬉しいな😊",
  "いつも応援ありがとう🎵",
  "最高だね！",
  "次のライブで会おう！",
  "感謝してます！",
];

type ArtistInfo = {
  id: string;
  name: string;
  avatar: string;
  genre?: string;
};

export default function ChatPage({ params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = use(params);
  const mockArtist = artists.find((a) => a.id === artistId);
  const { user, userProfile } = useAuth();
  const { markChatRead, myAvatar, myName, supabaseArtistId } = useAppStore();

  const myPhoto = userProfile?.photoURL || user?.photoURL || myAvatar || null;
  const myDisplayName = userProfile?.displayName ?? user?.displayName ?? myName ?? "あなた";

  const [mounted, setMounted] = useState(false);
  const isArtistMode = mounted && supabaseArtistId === artistId;
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(
    mockArtist ? { id: mockArtist.id, name: mockArtist.name, avatar: mockArtist.avatar, genre: mockArtist.genre } : null
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    markChatRead(artistId);
  }, [artistId, markChatRead]);

  // モックにない場合はFirestoreからアーティスト情報を取得
  useEffect(() => {
    if (mockArtist) return;
    getUserProfile(artistId)
      .then((profile) => {
        if (profile) {
          setArtistInfo({
            id: artistId,
            name: profile.displayName || "アーティスト",
            avatar: profile.photoURL || "",
            genre: "",
          });
        }
      })
      .catch(console.error);
  }, [artistId, mockArtist]);

  // Firestoreからメッセージ読み込み
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getFirestoreMessages(user.uid, artistId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, artistId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const body = text.trim();
    setText("");

    const tempMsg: FirestoreMessage = {
      id: `temp_${Date.now()}`,
      fanId: user.uid,
      artistId,
      fromMe: true,
      text: body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const id = await sendFirestoreMessage(user.uid, artistId, body, true);
      setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? { ...m, id } : m));
    } catch (e) {
      console.error("sendMessage failed:", e);
    }

    // 自動返信（アーティストモード以外）
    if (!isArtistMode) {
      const replyText = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      setTimeout(async () => {
        const replyMsg: FirestoreMessage = {
          id: `temp_reply_${Date.now()}`,
          fanId: user.uid,
          artistId,
          fromMe: false,
          text: replyText,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, replyMsg]);
        try {
          const id = await sendFirestoreMessage(user.uid, artistId, replyText, false);
          setMessages((prev) => prev.map((m) => m.id === replyMsg.id ? { ...m, id } : m));
        } catch (e) {
          console.error("autoReply failed:", e);
        }
      }, 1500);
    }

    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // アーティスト情報がまだ読み込み中
  if (!artistInfo && !mockArtist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-zinc-500 gap-3">
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 見つからない場合
  if (!artistInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-zinc-500 gap-3">
        <p>アーティストが見つかりません</p>
        <Link href="/messages" className="text-purple-400 text-sm">メッセージ一覧に戻る</Link>
      </div>
    );
  }

  const artistAvatar = artistInfo.avatar;
  const artistName = artistInfo.name;

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* ヘッダー */}
      <header className="flex-shrink-0 sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3 flex items-center gap-3">
        <Link href="/messages" className="flex-shrink-0 p-1 -ml-1">
          <ChevronLeft size={22} className="text-white" />
        </Link>
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
          {artistAvatar ? (
            <img src={artistAvatar} alt={artistName} width={36} height={36} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
              {artistName[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-white font-bold text-sm">{artistName}</span>
          {artistInfo.genre && <p className="text-zinc-500 text-xs">{artistInfo.genre}</p>}
        </div>
        <Link href={`/artist/${artistId}`} className="text-xs text-purple-400 font-medium flex-shrink-0">
          プロフィール
        </Link>
      </header>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs">今日</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 bg-zinc-800">
              {artistAvatar ? (
                <img src={artistAvatar} alt={artistName} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold">
                  {artistName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <p className="text-white font-bold">{artistName}</p>
            <p className="text-zinc-600 text-xs mt-3">最初のメッセージを送ってみよう</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = isArtistMode ? !msg.fromMe : msg.fromMe;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                {!isMine && (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-1 bg-zinc-800">
                    {(isArtistMode ? myPhoto : artistAvatar) ? (
                      <img
                        src={isArtistMode ? (myPhoto ?? "") : artistAvatar}
                        alt={isArtistMode ? myDisplayName : artistName}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                        {(isArtistMode ? myDisplayName : artistName)[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div className={`flex flex-col gap-1 max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-sm"
                      : "bg-zinc-800 text-white rounded-bl-sm"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-zinc-600 text-[10px]">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div
        className="flex-shrink-0 bg-black border-t border-zinc-800 px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
          {myPhoto ? (
            <img src={isArtistMode ? artistAvatar : myPhoto} alt="me" className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
              {myDisplayName[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={isArtistMode ? "ファンに返信..." : `${artistName}にメッセージ...`}
          className="flex-1 bg-zinc-800 text-white placeholder-zinc-600 text-sm rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-purple-500/50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || !user}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-30 transition-opacity flex-shrink-0"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
