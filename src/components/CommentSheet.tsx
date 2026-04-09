"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToComments,
  addComment as addFirestoreComment,
  FirestoreComment,
} from "@/lib/firestore";
import { useAppStore } from "@/store/useAppStore";

type Props = {
  postId: string;
  open: boolean;
  onClose: () => void;
  isFirestorePost?: boolean;
};

function timeStr(createdAt: string | null): string {
  if (!createdAt) return "";
  return formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ja });
}

export default function CommentSheet({ postId, open, onClose, isFirestorePost = false }: Props) {
  const { user, userProfile } = useAuth();
  const { comments: mockComments, addComment: addMockComment, myAvatar, myName } = useAppStore();

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [firestoreComments, setFirestoreComments] = useState<FirestoreComment[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Firestore コメント購読
  useEffect(() => {
    if (!open || !isFirestorePost) return;
    const unsub = subscribeToComments(postId, setFirestoreComments);
    return unsub;
  }, [open, postId, isFirestorePost]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  // 新しいコメントが来たらスクロール
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [firestoreComments, mockComments.length]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const body = text.trim();

    if (isFirestorePost && user) {
      try {
        const commentId = await addFirestoreComment(postId, {
          authorId: user.uid,
          authorName: userProfile?.displayName ?? user.displayName ?? "名無し",
          authorPhoto: userProfile?.photoURL ?? user.photoURL ?? "",
          content: body,
        });
        setText("");
        setFirestoreComments((prev) => [
          ...prev,
          {
            id: commentId,
            postId,
            authorId: user.uid,
            authorName: userProfile?.displayName ?? user.displayName ?? "名無し",
            authorPhoto: userProfile?.photoURL ?? user.photoURL ?? "",
            content: body,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error("コメント送信エラー:", err);
      }
    } else {
      setText("");
      addMockComment(postId, body);
    }
    setSubmitting(false);
  };

  const displayComments = isFirestorePost
    ? firestoreComments
    : mockComments.filter((c) => c.postId === postId);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto rounded-t-3xl flex flex-col"
            style={{
              maxHeight: "75vh",
              background: "#111111",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* ハンドル */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 flex-shrink-0">
              <h3 className="text-white font-bold text-base">
                コメント{" "}
                <span className="text-zinc-600 font-normal text-sm">
                  {displayComments.length}
                </span>
              </h3>
              <button onClick={onClose} className="p-1 -mr-1">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            {/* コメント一覧 */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
            >
              {displayComments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-zinc-600 text-sm">最初のコメントを残そう</p>
                </div>
              ) : (
                displayComments.map((c) => {
                  const isFirestoreC = "authorName" in c;
                  const name = isFirestoreC
                    ? (c as FirestoreComment).authorName
                    : (c as { userName: string }).userName;
                  const photo = isFirestoreC
                    ? (c as FirestoreComment).authorPhoto
                    : (c as { userAvatar: string }).userAvatar;
                  const body = isFirestoreC
                    ? (c as FirestoreComment).content
                    : (c as { text: string }).text;
                  const t = isFirestoreC
                    ? (c as FirestoreComment).createdAt
                    : (c as { createdAt: string }).createdAt;

                  return (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                        {photo ? (
                          <img
                            src={photo}
                            alt={name}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-syne flex items-center justify-center text-white text-xs font-bold">
                            {name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-white text-sm font-semibold">{name}</span>
                          <span className="text-zinc-600 text-xs">{timeStr(t as FirestoreComment["createdAt"])}</span>
                        </div>
                        <p className="text-zinc-300 text-sm mt-0.5 leading-snug">{body}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 入力欄 */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-t border-white/5 flex-shrink-0 pb-safe"
              style={{ background: "#111111" }}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                {(userProfile?.photoURL || user?.photoURL || myAvatar) ? (
                  <img
                    src={userProfile?.photoURL ?? user?.photoURL ?? myAvatar}
                    alt="me"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-syne flex items-center justify-center text-white text-xs font-bold">
                    {(user?.displayName ?? myName)?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={user ? "コメントを追加..." : "ログインしてコメントする"}
                disabled={!user && !isFirestorePost}
                className="flex-1 bg-zinc-800/80 text-white placeholder-zinc-600 text-sm rounded-full px-4 py-2.5 outline-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className="text-purple-400 disabled:text-zinc-700 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
