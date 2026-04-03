"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Crown, Settings, ChevronRight, X, Pencil, Check } from "lucide-react";
import { artists } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";

export default function ProfilePage() {
  const { followedArtists, subscribedArtists } = useAppStore();
  const followedList = artists.filter((a) => followedArtists.has(a.id));
  const subscribedList = artists.filter((a) => subscribedArtists.has(a.id));

  // localStorageから読み込み
  const [name, setName] = useState("あなた");
  const [handle, setHandle] = useState("fan_user");
  const [bio, setBio] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("syne_profile");
    if (stored) {
      const p = JSON.parse(stored);
      if (p.name) setName(p.name);
      if (p.handle) setHandle(p.handle);
      if (p.bio !== undefined) setBio(p.bio);
    }
  }, []);

  const openEdit = () => {
    setEditName(name);
    setEditHandle(handle);
    setEditBio(bio);
    setEditOpen(true);
  };

  const saveEdit = () => {
    const newName = editName.trim() || name;
    const newHandle = editHandle.trim() || handle;
    const newBio = editBio.trim();
    setName(newName);
    setHandle(newHandle);
    setBio(newBio);
    localStorage.setItem("syne_profile", JSON.stringify({ name: newName, handle: newHandle, bio: newBio }));
    setEditOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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

      {/* 保存完了トースト */}
      <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-zinc-800 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 ${saved ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <Check size={14} className="text-green-400" />
        保存しました
      </div>

      <div className="px-4 py-6">
        {/* Profile row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="relative flex-shrink-0">
            <Image
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
              alt="My profile"
              width={72}
              height={72}
              className="rounded-full object-cover border-2 border-zinc-800"
            />
            <button
              onClick={openEdit}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-black"
            >
              <Pencil size={10} className="text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight">{name}</h2>
            <p className="text-zinc-500 text-sm">@{handle}</p>
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

        {/* Subscribed artists */}
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

        {/* Followed artists */}
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

        {/* Tip */}
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-4 border border-purple-500/20">
          <h3 className="text-white font-bold text-sm mb-1">投げ銭機能</h3>
          <p className="text-zinc-400 text-xs mb-3">ライブ配信中にアーティストを応援しよう</p>
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm py-2.5 rounded-xl">
            ライブを探す
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${editOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setEditOpen(false)}
      />

      {/* Edit sheet */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-zinc-950 rounded-t-2xl transition-transform duration-300 ${editOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <button onClick={() => setEditOpen(false)} className="text-zinc-400 p-1">
            <X size={20} />
          </button>
          <h3 className="text-white font-bold">プロフィールを編集</h3>
          <button
            onClick={saveEdit}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold px-4 py-1.5 rounded-full"
          >
            保存
          </button>
        </div>

        <div className="px-4 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {/* Avatar */}
          <div className="flex justify-center mb-2">
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
                alt="avatar"
                width={72}
                height={72}
                className="rounded-full object-cover border-2 border-zinc-700"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <Pencil size={16} className="text-white" />
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-1.5">
              名前
            </label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="名前を入力"
              maxLength={30}
              className="w-full bg-zinc-900 text-white placeholder-zinc-600 text-sm rounded-xl px-4 py-3 outline-none border border-zinc-800 focus:border-purple-500/60 transition-colors"
            />
          </div>

          {/* Handle */}
          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-1.5">
              ユーザーID
            </label>
            <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-800 focus-within:border-purple-500/60 transition-colors overflow-hidden">
              <span className="text-zinc-600 text-sm pl-4 flex-shrink-0">@</span>
              <input
                value={editHandle}
                onChange={(e) => setEditHandle(e.target.value.replace(/\s/g, ""))}
                placeholder="ユーザーID"
                maxLength={20}
                className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm px-2 py-3 outline-none"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-zinc-500 text-xs font-bold uppercase tracking-widest block mb-1.5">
              自己紹介
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="好きなアーティストや音楽を書いてみよう..."
              maxLength={100}
              rows={3}
              className="w-full bg-zinc-900 text-white placeholder-zinc-600 text-sm rounded-xl px-4 py-3 outline-none border border-zinc-800 focus:border-purple-500/60 transition-colors resize-none"
            />
            <p className="text-zinc-700 text-xs text-right mt-1">{editBio.length}/100</p>
          </div>

          {/* 使い方説明 */}
          <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50 space-y-1.5">
            <p className="text-zinc-500 text-xs font-bold">使い方</p>
            <p className="text-zinc-600 text-xs">① 名前・ユーザーID・自己紹介を入力</p>
            <p className="text-zinc-600 text-xs">② 右上の「保存」ボタンをタップ</p>
            <p className="text-zinc-600 text-xs">③ ページを更新しても内容は保持されます</p>
          </div>
        </div>
      </div>
    </div>
  );
}
