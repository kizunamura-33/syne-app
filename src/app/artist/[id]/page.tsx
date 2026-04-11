"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Crown, Users, ChevronLeft, Lock, Check, Pencil, X, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { artists, posts as mockPosts } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";
import { getUserPosts, FirestorePost } from "@/lib/firestore";
import PostCard, { UnifiedPost } from "@/components/PostCard";
import CommentSheet from "@/components/CommentSheet";

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const mockArtist = artists.find((a) => a.id === id);

  const {
    toggleFollow, isFollowed, toggleSubscribe, isSubscribed,
    supabaseArtistId, updateArtistProfile, getArtistAvatar, getArtistBio,
    fetchFollowerCount, followerCounts,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [fsPosts, setFsPosts] = useState<FirestorePost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [commentTarget, setCommentTarget] = useState<{ id: string; isFirestore: boolean } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchFollowerCount(id);

    // Firestore からこのアーティストの投稿を取得
    getUserPosts(id)
      .then(setFsPosts)
      .catch(console.error)
      .finally(() => setPostsLoading(false));
  }, [id, fetchFollowerCount]);

  const isMyArtist = mounted && supabaseArtistId === id;
  const currentAvatar = getArtistAvatar(id);
  const currentBio = getArtistBio(id);

  const [editOpen, setEditOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState(mockArtist?.avatar ?? "");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openEdit = () => {
    setEditBio(currentBio);
    setEditAvatar(currentAvatar ?? "");
    setEditOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200; canvas.height = 200;
        const ctx = canvas.getContext("2d")!;
        const size = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 200, 200);
        setEditAvatar(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const saveEdit = async () => {
    await updateArtistProfile(id, editBio.trim(), editAvatar);
    setEditOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Firestore 投稿をモック投稿と合わせて表示
  const fsUnified: UnifiedPost[] = fsPosts.map((p) => ({
    _source: "firestore" as const,
    ...p,
  }));

  const mockUnified: UnifiedPost[] = mockPosts
    .filter((p) => p.artistId === id)
    .map((p) => ({
      _source: "mock" as const,
      ...p,
      authorName: mockArtist?.name ?? id,
      authorPhoto: getArtistAvatar(id) ?? mockArtist?.avatar ?? "",
    }));

  const allPosts: UnifiedPost[] = [...fsUnified, ...mockUnified];

  const openComment = useCallback((postId: string) => {
    const isFs = fsPosts.some((p) => p.id === postId);
    setCommentTarget({ id: postId, isFirestore: isFs });
  }, [fsPosts]);

  const handleCommentAdded = useCallback(() => {
    if (!commentTarget?.isFirestore) return;
    setFsPosts((prev) =>
      prev.map((p) =>
        p.id === commentTarget.id
          ? { ...p, commentsCount: p.commentsCount + 1 }
          : p,
      ),
    );
  }, [commentTarget]);

  // Firestore 登録アーティストの情報をフォールバックで構築
  const firstFsPost = fsPosts[0];
  const artistName = mockArtist?.name ?? firstFsPost?.authorName ?? id;
  const artistAvatar = currentAvatar ?? mockArtist?.avatar ?? firstFsPost?.authorPhoto ?? "";
  const artistCover = mockArtist?.coverImage ?? "";
  const artistGenre = mockArtist?.genre ?? "";
  const artistVerified = mockArtist?.verified ?? false;
  const artistMonthlyPrice = mockArtist?.monthlyPrice ?? 980;

  // モックにもなく Firestore 投稿もない場合
  if (!postsLoading && !mockArtist && fsPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-zinc-500 gap-3">
        <p>アーティストが見つかりません</p>
        <button onClick={() => router.back()} className="text-sm text-purple-400">戻る</button>
      </div>
    );
  }

  const followed = isFollowed(id);
  const subscribed = isSubscribed(id);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* 保存トースト */}
      <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-zinc-800 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 whitespace-nowrap ${saved ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <Check size={14} className="text-green-400" />
        プロフィールを保存しました
      </div>

      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
      </div>

      {/* Cover */}
      <div className="relative h-48 bg-zinc-900">
        {artistCover ? (
          <Image src={artistCover} alt={artistName} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
      </div>

      {/* Profile info */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-black flex-shrink-0 bg-zinc-800">
              {artistAvatar && (
                <img src={artistAvatar} alt={artistName} className="w-full h-full object-cover object-top" />
              )}
            </div>
            {isMyArtist && (
              <button
                onClick={openEdit}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center"
              >
                <Camera size={12} className="text-white" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isMyArtist ? (
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-zinc-800 text-zinc-300 border border-zinc-700"
              >
                <Pencil size={13} />
                編集
              </button>
            ) : (
              <button
                onClick={() => toggleFollow(id)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                  followed
                    ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    : "bg-white text-black"
                }`}
              >
                {followed ? "フォロー中" : "フォロー"}
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-black text-white">{artistName}</h1>
            {artistVerified && (
              <Crown size={16} className="text-yellow-400 fill-yellow-400" />
            )}
          </div>
          {artistGenre && <p className="text-purple-400 text-sm font-medium mb-2">{artistGenre}</p>}
          <p className="text-zinc-400 text-sm leading-relaxed">{currentBio}</p>

          {isMyArtist ? (
            <div className="flex gap-4 mt-3">
              <div className="bg-zinc-900 rounded-xl px-4 py-2.5 text-center">
                <p className="text-white font-black text-lg">
                  {followerCounts[id] !== undefined ? followerCounts[id].toLocaleString() : "..."}
                </p>
                <p className="text-zinc-500 text-xs">フォロワー</p>
              </div>
              <div className="bg-zinc-900 rounded-xl px-4 py-2.5 text-center">
                <p className="text-white font-black text-lg">
                  {artistMonthlyPrice.toLocaleString()}<span className="text-sm font-bold">円</span>
                </p>
                <p className="text-zinc-500 text-xs">月額</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-2">
              <Users size={14} className="text-zinc-500" />
              <span className="text-zinc-500 text-sm">
                {followerCounts[id] !== undefined
                  ? followerCounts[id].toLocaleString()
                  : formatFollowers(mockArtist?.followers ?? 0)}{" "}
                フォロワー
              </span>
            </div>
          )}
        </div>

        {/* Subscription card */}
        <div className={`rounded-2xl p-4 mb-6 border ${
          subscribed ? "bg-purple-900/20 border-purple-500/40" : "bg-zinc-950 border-zinc-800"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Lock size={14} className={subscribed ? "text-purple-400" : "text-zinc-500"} />
                <span className="text-white font-bold text-sm">ファンクラブ限定</span>
                {subscribed && (
                  <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">
                    加入中
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-xs mt-1">限定コンテンツ・裏側・先行情報</p>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-lg">¥{artistMonthlyPrice.toLocaleString()}</p>
              <p className="text-zinc-600 text-xs">/月</p>
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            {["限定写真・動画", "ライブ優先案内", "コメント返信優先"].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <Check size={12} className="text-purple-400" />
                <span className="text-zinc-400 text-xs">{benefit}</span>
              </div>
            ))}
          </div>

          {!subscribed ? (
            <button
              onClick={() => toggleSubscribe(id)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm py-2.5 rounded-xl"
            >
              サブスクする
            </button>
          ) : (
            <button
              onClick={() => toggleSubscribe(id)}
              className="w-full bg-zinc-800 text-zinc-400 font-bold text-sm py-2.5 rounded-xl border border-zinc-700"
            >
              解約する
            </button>
          )}
        </div>

        {/* Posts header */}
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
          投稿 {allPosts.length > 0 && <span className="text-zinc-700">{allPosts.length}</span>}
        </h2>
      </div>

      {/* Posts */}
      <div>
        {postsLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allPosts.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm">
            まだ投稿がありません
          </div>
        ) : (
          allPosts.map((post) => (
            <PostCard key={post.id} post={post} onCommentOpen={openComment} />
          ))
        )}
      </div>

      {/* Edit Sheet */}
      <div
        className={`fixed inset-0 z-[60] bg-black/70 transition-opacity ${editOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setEditOpen(false)}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-[70] max-w-md mx-auto bg-zinc-950 rounded-t-2xl flex flex-col transition-transform duration-300 ${editOpen ? "translate-y-0" : "translate-y-full"}`}
        style={{ height: "80vh" }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
          <button onClick={() => setEditOpen(false)} className="text-zinc-400 p-1 -ml-1">
            <X size={22} />
          </button>
          <h3 className="text-white font-bold text-base">プロフィールを編集</h3>
          <button
            onClick={saveEdit}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold px-5 py-2 rounded-full"
          >
            保存
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-10">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => fileRef.current?.click()} className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800">
                {editAvatar && <img src={editAvatar} alt="avatar" className="w-full h-full object-cover object-top" />}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Camera size={22} className="text-white" />
              </div>
            </button>
            <p className="text-zinc-500 text-xs">タップして写真を変更</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Bio */}
          <div>
            <label className="text-zinc-400 text-xs font-bold uppercase tracking-widest block mb-2">
              自己紹介
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="アーティストの自己紹介を書いてみよう..."
              maxLength={150}
              rows={5}
              className="w-full bg-zinc-900 text-white placeholder-zinc-600 text-base rounded-xl px-4 py-3.5 outline-none border border-zinc-800 focus:border-purple-500 transition-colors resize-none"
            />
            <p className="text-zinc-600 text-xs text-right mt-1">{editBio.length}/150</p>
          </div>
        </div>
      </div>

      {/* Comment Sheet */}
      <CommentSheet
        postId={commentTarget?.id ?? ""}
        open={!!commentTarget}
        onClose={() => setCommentTarget(null)}
        isFirestorePost={commentTarget?.isFirestore ?? false}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
}
