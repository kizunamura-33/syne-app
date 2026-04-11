"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, LogIn, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToComments,
  addComment as addFirestoreComment,
  deleteComment,
  FirestoreComment,
} from "@/lib/firestore";
import { useAppStore } from "@/store/useAppStore";

type Props = {
  postId: string;
  open: boolean;
  onClose: () => void;
  isFirestorePost?: boolean;
  onCommentAdded?: (postId: string) => void;
};

function timeStr(createdAt: string | null): string {
  if (!createdAt) return "";
  return formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ja });
}

export default function CommentSheet({
  postId,
  open,
  onClose,
  isFirestorePost = false,
  onCommentAdded,
}: Props) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { comments: mockComments, addComment: addMockComment, myName } = useAppStore();

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firestoreComments, setFirestoreComments] = useState<FirestoreComment[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // シートを開くたびにリセット
  useEffect(() => {
    if (open) {
      setFirestoreComments([]);
      setText("");
    }
  }, [open, postId]);

  // Firestore コメント購読
  useEffect(() => {
    if (!open || !isFirestorePost) return;
    setLoading(true);
    const unsub = subscribeToComments(postId, (comments) => {
      setFirestoreComments(comments);
      setLoading(false);
    });
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
  }, [firestoreComments.length, mockComments.length]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting || !user) return;
    setSubmitting(true);
    const body = text.trim();
    setText("");

    if (isFirestorePost) {
      try {
        const commentId = await addFirestoreComment(postId, {
          authorId: user.uid,
          authorName: userProfile?.displayName ?? user.displayName ?? "名無し",
          authorPhoto: userProfile?.photoURL ?? user.photoURL ?? "",
          content: body,
        });
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
        onCommentAdded?.(postId);
      } catch (err) {
        console.error("コメント送信エラー:", err);
        setText(body); // 失敗したらテキストを戻す
      }
    } else {
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
                  {displayComments.length > 0 ? displayComments.length : ""}
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
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : displayComments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-zinc-600 text-sm">最初のコメントを残そう</p>
                </div>
              ) : (
                displayComments.map((c) => {
                  const isFirestoreC = "authorName" in c;
                  const name = isFirestoreC
                    ? (c as FirestoreComment).authorName
                    : (c as { userName: string }).userName;
                  const storedPhoto = isFirestoreC
                    ? (c as FirestoreComment).authorPhoto
                    : (c as { userAvatar: string }).userAvatar;
                  const isOwnComment = isFirestoreC
                    ? !!(user && (c as FirestoreComment).authorId === user.uid)
                    : (c as { userId: string }).userId === "me";
                  const photo = isOwnComment
                    ? (userProfile?.photoURL || user?.photoURL || "")
                    : storedPhoto;
                  const body = isFirestoreC
                    ? (c as FirestoreComment).content
                    : (c as { text: string }).text;
                  const t = isFirestoreC
                    ? (c as FirestoreComment).createdAt
                    : (c as { createdAt: string }).createdAt;

                  const handleDeleteComment = async () => {
                    if (!isFirestoreC) return;
                    try {
                      await deleteComment(postId, c.id);
                      setFirestoreComments((prev) => prev.filter((fc) => fc.id !== c.id));
                    } catch (e) {
                      console.error("deleteComment failed:", e);
                    }
                  };

                  return (
                    <div key={c.id} className="flex gap-3 group">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                        {/* イニシャル（常に裏に描画） */}
                        <div className="absolute inset-0 bg-gradient-syne flex items-center justify-center text-white text-xs font-bold">
                          {name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        {/* 画像（読み込み失敗時は非表示） */}
                        {photo && (
                          <img
                            src={photo}
                            alt={name}
                            className="absolute inset-0 w-full h-full object-cover object-top"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-white text-sm font-semibold">{name}</span>
                          <span className="text-zinc-600 text-xs">{timeStr(t as FirestoreComment["createdAt"])}</span>
                        </div>
                        <p className="text-zinc-300 text-sm mt-0.5 leading-snug">{body}</p>
                      </div>
                      {isOwnComment && isFirestoreC && (
                        <button onClick={handleDeleteComment} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start pt-1">
                          <Trash2 size={14} className="text-zinc-600 hover:text-rose-400 transition-colors" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 入力欄 */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-t border-white/5 flex-shrink-0"
              style={{ background: "#111111", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
            >
              {user ? (
                <>
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                    <div className="absolute inset-0 bg-gradient-syne flex items-center justify-center text-white text-xs font-bold">
                      {(userProfile?.displayName ?? user?.displayName ?? myName)?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    {(userProfile?.photoURL || user?.photoURL) && (
                      <img
                        src={userProfile?.photoURL ?? user?.photoURL ?? ""}
                        alt="me"
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="コメントを追加..."
                    className="flex-1 bg-zinc-800/80 text-white placeholder-zinc-600 text-sm rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-purple-500/40"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || submitting}
                    className="text-purple-400 disabled:text-zinc-700 transition-colors flex-shrink-0"
                  >
                    <Send size={20} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { onClose(); router.push("/login"); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-zinc-800 text-zinc-400 text-sm"
                >
                  <LogIn size={16} />
                  ログインしてコメントする
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
