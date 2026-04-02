"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, Send } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

type Props = {
  postId: string;
  open: boolean;
  onClose: () => void;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "今";
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function CommentSheet({ postId, open, onClose }: Props) {
  const [text, setText] = useState("");
  const { comments, addComment } = useAppStore();
  const postComments = comments.filter((c) => c.postId === postId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    addComment(postId, text.trim());
    setText("");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 rounded-t-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "70vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
          <h3 className="text-white font-bold">コメント</h3>
          <button onClick={onClose}>
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Comments */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 120px)" }}>
          {postComments.length === 0 ? (
            <div className="text-center text-zinc-600 py-8 text-sm">
              最初のコメントを残そう
            </div>
          ) : (
            postComments.map((c) => (
              <div key={c.id} className="flex gap-3 px-4 py-3">
                <Image
                  src={c.userAvatar}
                  alt={c.userName}
                  width={32}
                  height={32}
                  className="rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-sm font-semibold">{c.userName}</span>
                    <span className="text-zinc-600 text-xs">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-zinc-300 text-sm mt-0.5">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-zinc-800 bg-zinc-950">
          <Image
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop"
            alt="me"
            width={32}
            height={32}
            className="rounded-full object-cover flex-shrink-0"
          />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="コメントを追加..."
            className="flex-1 bg-zinc-800 text-white placeholder-zinc-600 text-sm rounded-full px-4 py-2 outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="text-purple-400 disabled:text-zinc-700 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </>
  );
}
