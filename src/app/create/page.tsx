"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  FileText,
  Crown,
  X,
  Plus,
  Upload,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createPost, uploadMedia } from "@/lib/firestore";

type PostType = "image" | "video" | "text";

export default function CreatePage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const isArtist = userProfile?.isArtist === true;

  const [postType, setPostType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("画像または動画ファイルを選択してください");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("ファイルサイズは100MB以下にしてください");
      return;
    }

    setPostType(isVideo ? "video" : "image");
    setMediaFile(file);

    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  }, []);

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setPostType("text");
    if (fileRef.current) fileRef.current.value = "";
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handlePost = async () => {
    if (!user || !isArtist) {
      toast.error("アーティストアカウントが必要です");
      router.push("/register");
      return;
    }
    if (!content.trim() && !mediaFile) {
      toast.error("テキストまたはメディアを追加してください");
      return;
    }

    setLoading(true);
    try {
      let mediaURL: string | undefined;
      let mediaType: "image" | "video" | undefined;

      if (mediaFile) {
        mediaType = postType as "image" | "video";
        mediaURL = await uploadMedia(mediaFile, user.uid, setUploadProgress);
      }

      await createPost({
        authorId: user.uid,
        authorName: userProfile?.displayName ?? user.displayName ?? "アーティスト",
        authorPhoto: userProfile?.photoURL ?? user.photoURL ?? "",
        content: content.trim(),
        mediaURL,
        mediaType,
        isPremium,
        tags,
      });

      toast.success("投稿しました！");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("投稿に失敗しました");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-syne flex items-center justify-center">
          <Lock size={28} className="text-white" />
        </div>
        <p className="text-white font-bold text-lg">ログインが必要です</p>
        <button onClick={() => router.push("/login")} className="btn-primary mt-2">ログイン</button>
      </div>
    );
  }

  if (!isArtist) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-syne flex items-center justify-center">
          <Lock size={28} className="text-white" />
        </div>
        <p className="text-white font-bold text-lg">アーティスト専用</p>
        <p className="text-zinc-400 text-sm">アーティストアカウントでログインしてください</p>
        <button onClick={() => router.push("/artist-login")} className="btn-primary mt-2">
          アーティストログイン
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(5,5,5,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button onClick={() => router.back()} className="p-2 -ml-2 text-zinc-400">
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-white font-bold text-base font-display">新しい投稿</h2>
        <motion.button
          onClick={handlePost}
          disabled={loading || (!content.trim() && !mediaFile)}
          whileTap={{ scale: 0.95 }}
          className="btn-primary py-2 px-5 text-sm"
          style={{ padding: "8px 20px" }}
        >
          {loading ? "投稿中..." : "投稿"}
        </motion.button>
      </header>

      <div className="px-4 py-5 space-y-5 pb-32">
        {/* 投稿タイプ選択（テキストのみ） */}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-purple-500/50 bg-purple-500/10 text-purple-300">
            <FileText size={20} />
            <span className="text-xs font-medium">テキスト</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8 bg-[#0f0f0f] text-zinc-700 cursor-not-allowed opacity-40 relative">
            <ImageIcon size={20} />
            <span className="text-xs font-medium">画像</span>
            <span className="text-[9px] text-zinc-600 absolute bottom-1">準備中</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8 bg-[#0f0f0f] text-zinc-700 cursor-not-allowed opacity-40 relative">
            <Video size={20} />
            <span className="text-xs font-medium">動画</span>
            <span className="text-[9px] text-zinc-600 absolute bottom-1">準備中</span>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* メディアプレビュー */}
        <AnimatePresence>
          {mediaPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-2xl overflow-hidden bg-[#0f0f0f] aspect-[4/5]"
            >
              {postType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaPreview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={mediaPreview}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              )}

              <button
                onClick={removeMedia}
                className="absolute top-3 right-3 w-8 h-8 glass rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-white" />
              </button>

              {/* アップロード進捗 */}
              {loading && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute bottom-0 inset-x-0">
                  <div
                    className="h-1 bg-gradient-syne transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* メディア追加ボタン（なし時） */}
        {!mediaPreview && postType !== "text" && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-[4/5] rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-3 text-zinc-600"
          >
            <Upload size={32} />
            <span className="text-sm font-medium">
              {postType === "image" ? "画像を選択" : "動画を選択"}
            </span>
            <span className="text-xs text-zinc-700">最大100MB</span>
          </button>
        )}

        {/* テキスト入力 */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === "text"
                ? "今どんな気分？\n\nファンに伝えたいことを書こう..."
                : "キャプションを追加（任意）"
            }
            rows={postType === "text" ? 8 : 4}
            maxLength={1000}
            className="input-syne resize-none leading-relaxed"
          />
          <p className="text-zinc-700 text-xs text-right mt-1">{content.length}/1000</p>
        </div>

        {/* タグ入力 */}
        <div>
          <label className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-2">
            タグ（最大5個）
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-purple-500/15 text-purple-400 border border-purple-500/30 text-sm rounded-full px-3 py-1"
              >
                #{tag}
                <button onClick={() => removeTag(tag)} className="text-purple-500/60 hover:text-purple-400">
                  <X size={12} />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-600 text-sm">#</span>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value.replace(/\s/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="タグを追加..."
                  className="bg-transparent text-white text-sm outline-none placeholder-zinc-700 w-24"
                  maxLength={20}
                />
                {tagInput && (
                  <button onClick={addTag}>
                    <Plus size={14} className="text-purple-400" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* プレミア設定 */}
        <button
          type="button"
          onClick={() => setIsPremium(!isPremium)}
          className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
            isPremium
              ? "border-amber-500/40 bg-amber-500/8"
              : "border-white/8 bg-[#0f0f0f]"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isPremium ? "bg-gradient-premium" : "bg-zinc-800"
            }`}
          >
            <Crown size={18} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className={`font-semibold text-sm ${isPremium ? "text-amber-300" : "text-zinc-300"}`}>
              プレミアム限定
            </p>
            <p className="text-zinc-600 text-xs mt-0.5">
              {isPremium
                ? "サブスクライバーのみ閲覧可能"
                : "すべてのユーザーが閲覧可能"}
            </p>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              isPremium ? "bg-amber-500 border-amber-500" : "border-zinc-600"
            }`}
          />
        </button>

        {/* 有料機能一覧ヒント */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl p-4"
            style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
          >
            <p className="text-amber-400 text-xs font-bold mb-2">プレミアム機能</p>
            <ul className="text-zinc-500 text-xs space-y-1">
              <li>・ サブスクライバー限定の動画/画像/テキスト</li>
              <li>・ 限定チャット機能</li>
              <li>・ プレゼント企画への参加権</li>
              <li>・ イベント先行受付</li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
