"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Settings, ChevronRight, X, Camera, Check, LogOut, Mic, LogIn, Trash2 } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/firestore";
import toast from "react-hot-toast";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, logout, deleteAccount, refreshProfile } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { followedArtists, subscribedArtists } = useAppStore();
  const followedList = artists.filter((a) => followedArtists.has(a.id));
  const subscribedList = artists.filter((a) => subscribedArtists.has(a.id));
  const isArtist = userProfile?.isArtist === true;

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState(DEFAULT_AVATAR);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = userProfile?.displayName || user?.displayName || "ユーザー";
  const avatar = userProfile?.photoURL || user?.photoURL || DEFAULT_AVATAR;
  const bio = userProfile?.bio || "";

  const openEdit = () => {
    setEditName(displayName);
    setEditBio(bio);
    setEditAvatar(avatar);
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
        canvas.width = 200;
        canvas.height = 200;
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
    if (!user) return;
    setSaving(true);
    try {
      // Authトークンを強制更新
      await user.getIdToken(true);
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 10000)
      );
      await Promise.race([
        updateUserProfile(user.uid, {
          displayName: editName.trim() || displayName,
          bio: editBio.trim(),
          photoURL: editAvatar,
        }),
        timeout,
      ]);
      setEditOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // バックグラウンドでプロフィールを更新
      refreshProfile().catch(console.error);
    } catch (err) {
      console.error("プロフィール保存エラー:", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg === "timeout") {
        toast.error("保存がタイムアウトしました。Firestoreのルールを確認してください。");
      } else {
        toast.error("保存に失敗しました: " + msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("requires-recent-login")) {
        alert("セキュリティのため、一度ログアウトして再ログイン後に退会してください。");
      } else {
        alert("退会に失敗しました。");
      }
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center gap-4 pb-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <LogIn size={28} className="text-white" />
        </div>
        <p className="text-white font-bold text-lg">ログインしてください</p>
        <p className="text-zinc-500 text-sm">アカウントにログインしてプロフィールを表示</p>
        <button onClick={() => router.push("/login")} className="btn-primary mt-2 px-8">
          ログイン
        </button>
        <button onClick={() => router.push("/register")} className="text-zinc-400 text-sm">
          アカウントを作成 →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
          SYNE
        </h1>
        <button onClick={openEdit} className="text-zinc-400 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </header>

      <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-zinc-800 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 whitespace-nowrap ${saved ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <Check size={14} className="text-green-400" />
        保存しました
      </div>

      <div className="px-4 py-6 pb-32">
        {/* Profile row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="relative flex-shrink-0">
            <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-zinc-800">
              <img src={avatar} alt="avatar" className="w-full h-full object-cover object-top" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg leading-tight">{displayName}</h2>
              {isArtist && (
                <span className="flex items-center gap-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                  <Mic size={9} />
                  アーティスト
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-sm">{user.email}</p>
            {bio && <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{bio}</p>}
          </div>
          <button
            onClick={openEdit}
            className="flex-shrink-0 px-4 py-1.5 rounded-full border border-zinc-700 text-zinc-300 text-xs font-bold"
          >
            編集
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { value: followedList.length, label: "フォロー中" },
            { value: subscribedList.length, label: "サブスク中" },
            { value: 0, label: "投げ銭総額" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-zinc-950 rounded-2xl p-3 border border-zinc-800/50 text-center">
              <p className="text-white font-black text-2xl">{value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Subscribed */}
        {subscribedList.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">サブスク中</h3>
            <div className="space-y-2">
              {subscribedList.map((artist) => (
                <Link key={artist.id} href={`/artist/${artist.id}`}
                  className="flex items-center gap-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-3 border border-purple-500/20">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image src={artist.avatar} alt={artist.name} width={40} height={40} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-semibold text-sm">{artist.name}</span>
                      {artist.verified && <Crown size={11} className="text-yellow-400 fill-yellow-400" />}
                    </div>
                    <p className="text-purple-400 text-xs">¥{artist.monthlyPrice.toLocaleString()}/月</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Followed */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">フォロー中</h3>
          {followedList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-600 text-sm">まだフォロー中のアーティストはいません</p>
              <Link href="/discover" className="text-purple-400 text-sm mt-2 inline-block">アーティストを探す →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {followedList.map((artist) => (
                <Link key={artist.id} href={`/artist/${artist.id}`}
                  className="flex items-center gap-3 bg-zinc-950 rounded-2xl p-3 border border-zinc-800/50">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image src={artist.avatar} alt={artist.name} width={40} height={40} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-semibold text-sm">{artist.name}</span>
                      {artist.verified && <Crown size={11} className="text-yellow-400 fill-yellow-400" />}
                    </div>
                    <p className="text-zinc-500 text-xs">{artist.genre}</p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">ログアウト</span>
        </button>

        {/* Delete account */}
        <button
          onClick={() => setDeleteConfirm(true)}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-zinc-900 text-zinc-700 hover:text-red-500 hover:border-red-900/50 transition-all"
        >
          <Trash2 size={16} />
          <span className="text-sm">退会する</span>
        </button>
      </div>

      {/* 退会確認モーダル */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-800">
            <h3 className="text-white font-bold text-lg mb-2">退会しますか？</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              アカウントを削除すると、すべてのデータが失われます。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
              >
                {deleting ? "削除中..." : "退会する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/70 transition-opacity ${editOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setEditOpen(false)}
      />

      {/* Edit sheet */}
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
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold px-5 py-2 rounded-full disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-10">
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => fileRef.current?.click()} className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-700">
                <img src={editAvatar} alt="avatar" className="w-full h-full object-cover object-top" />
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Camera size={22} className="text-white" />
              </div>
            </button>
            <p className="text-zinc-500 text-xs">タップして写真を変更</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div>
            <label className="text-zinc-400 text-xs font-bold uppercase tracking-widest block mb-2">名前</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="名前を入力"
              maxLength={30}
              className="w-full bg-zinc-900 text-white placeholder-zinc-600 text-base rounded-xl px-4 py-3.5 outline-none border border-zinc-800 focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-zinc-400 text-xs font-bold uppercase tracking-widest block mb-2">自己紹介</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="好きなアーティストや音楽を書いてみよう..."
              maxLength={100}
              rows={4}
              className="w-full bg-zinc-900 text-white placeholder-zinc-600 text-base rounded-xl px-4 py-3.5 outline-none border border-zinc-800 focus:border-purple-500 transition-colors resize-none"
            />
            <p className="text-zinc-600 text-xs text-right mt-1">{editBio.length}/100</p>
          </div>
        </div>
      </div>
    </div>
  );
}
