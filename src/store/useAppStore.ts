"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { posts as initialPosts, comments as initialComments, notifications as initialNotifications, artists } from "@/data/mockData";
import type { Comment, Notification } from "@/data/mockData";
import { supabase } from "@/lib/supabase";

export type ChatMessage = {
  id: string;
  artistId: string;
  fromMe: boolean;
  text: string;
  createdAt: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    artistId: "ziou",
    fromMe: false,
    text: "いつも応援ありがとう！新曲楽しみにしてて🎵",
    createdAt: "2026-04-02T09:00:00Z",
  },
  {
    id: "m2",
    artistId: "ziou",
    fromMe: true,
    text: "ZIOUさんの音楽大好きです！次のライブ絶対行きます！",
    createdAt: "2026-04-02T09:01:00Z",
  },
  {
    id: "m3",
    artistId: "ziou",
    fromMe: false,
    text: "ありがとう😊 ライブで会おう！",
    createdAt: "2026-04-02T09:02:00Z",
  },
  {
    id: "m4",
    artistId: "haruki",
    fromMe: false,
    text: "フォローしてくれてありがとう！新曲もうすぐ出るよ🔥",
    createdAt: "2026-04-01T20:00:00Z",
  },
];

const DEFAULT_MY_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop";
const DEFAULT_MY_NAME = "あなた";

type AppStore = {
  likedPosts: Set<string>;
  followedArtists: Set<string>;
  subscribedArtists: Set<string>;
  likeCount: Record<string, number>;
  comments: Comment[];
  notifications: Notification[];
  activeTab: string;
  chatMessages: ChatMessage[];
  unreadChats: Set<string>;
  myAvatar: string;
  myName: string;
  artists: typeof artists;

  // Supabase auth
  supabaseArtistId: string | null;
  authInitialized: boolean;
  artistProfiles: Record<string, { bio: string; avatar: string }>;

  // Follows
  fanId: string;
  followerCounts: Record<string, number>;
  fetchFollowerCount: (artistId: string) => Promise<void>;

  toggleLike: (postId: string) => void;
  toggleFollow: (artistId: string) => Promise<void>;
  toggleSubscribe: (artistId: string) => void;
  addComment: (postId: string, text: string) => void;
  markNotificationsRead: () => void;
  setActiveTab: (tab: string) => void;
  sendMessage: (artistId: string, text: string) => void;
  markChatRead: (artistId: string) => void;
  setMyProfile: (avatar: string, name: string) => void;

  // Supabase auth actions
  initArtistAuth: () => void;
  signInAsArtist: (email: string, password: string) => Promise<string>;
  signOutAsArtist: () => Promise<void>;
  updateArtistProfile: (artistId: string, bio: string, avatar: string) => Promise<void>;

  getArtistAvatar: (artistId: string) => string | undefined;
  getArtistBio: (artistId: string) => string;

  isLiked: (postId: string) => boolean;
  isFollowed: (artistId: string) => boolean;
  isSubscribed: (artistId: string) => boolean;
  getLikeCount: (postId: string) => number;
  getUnreadCount: () => number;
  getTotalUnreadChats: () => number;
  getLastMessage: (artistId: string) => ChatMessage | undefined;
};

export const useAppStore = create<AppStore>()(persist((set, get) => ({
  likedPosts: new Set(),
  followedArtists: new Set(["ziou"]),
  subscribedArtists: new Set(),
  likeCount: Object.fromEntries(initialPosts.map((p) => [p.id, p.likes])),
  comments: initialComments,
  notifications: initialNotifications,
  activeTab: "home",
  chatMessages: initialMessages,
  unreadChats: new Set(["ziou", "haruki"]),
  myAvatar: DEFAULT_MY_AVATAR,
  myName: DEFAULT_MY_NAME,
  artists,
  supabaseArtistId: null,
  authInitialized: false,
  artistProfiles: {},
  fanId: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  followerCounts: {},

  initArtistAuth: () => {
    const loadProfile = async (artistId: string) => {
      const { data } = await supabase
        .from("artist_profiles")
        .select("bio, avatar_data")
        .eq("artist_id", artistId)
        .single();
      if (data) {
        set((state) => ({
          artistProfiles: {
            ...state.artistProfiles,
            [artistId]: { bio: data.bio ?? "", avatar: data.avatar_data ?? "" },
          },
        }));
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      const artistId = (session?.user?.user_metadata?.artist_id as string) ?? null;
      set({ supabaseArtistId: artistId, authInitialized: true });
      if (artistId) loadProfile(artistId);
    });

    supabase.auth.onAuthStateChange((_, session) => {
      const artistId = (session?.user?.user_metadata?.artist_id as string) ?? null;
      set({ supabaseArtistId: artistId });
      if (artistId) loadProfile(artistId);
    });
  },

  signInAsArtist: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const artistId = (data.user?.user_metadata?.artist_id as string) ?? null;
    if (!artistId) throw new Error("このアカウントはアーティストアカウントではありません");
    set({ supabaseArtistId: artistId });
    const { data: profile } = await supabase
      .from("artist_profiles")
      .select("bio, avatar_data")
      .eq("artist_id", artistId)
      .single();
    if (profile) {
      set((state) => ({
        artistProfiles: {
          ...state.artistProfiles,
          [artistId]: { bio: profile.bio ?? "", avatar: profile.avatar_data ?? "" },
        },
      }));
    }
    return artistId;
  },

  signOutAsArtist: async () => {
    await supabase.auth.signOut();
    set({ supabaseArtistId: null });
  },

  updateArtistProfile: async (artistId, bio, avatar) => {
    // Update local cache immediately
    set((state) => ({
      artistProfiles: {
        ...state.artistProfiles,
        [artistId]: { bio, avatar },
      },
    }));
    // Save to Supabase
    await supabase
      .from("artist_profiles")
      .upsert({ artist_id: artistId, bio, avatar_data: avatar, updated_at: new Date().toISOString() });
  },

  getArtistAvatar: (artistId) => {
    const override = get().artistProfiles[artistId];
    if (override?.avatar) return override.avatar;
    return artists.find((a) => a.id === artistId)?.avatar ?? undefined;
  },

  getArtistBio: (artistId) => {
    const override = get().artistProfiles[artistId];
    if (override?.bio !== undefined) return override.bio;
    return artists.find((a) => a.id === artistId)?.bio ?? "";
  },

  toggleLike: (postId) => {
    const { likedPosts, likeCount } = get();
    const isLiked = likedPosts.has(postId);
    const newLiked = new Set(likedPosts);
    if (isLiked) newLiked.delete(postId);
    else newLiked.add(postId);
    set({
      likedPosts: newLiked,
      likeCount: { ...likeCount, [postId]: (likeCount[postId] || 0) + (isLiked ? -1 : 1) },
    });
  },

  fetchFollowerCount: async (artistId) => {
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", artistId);
    if (count !== null) {
      set((state) => ({ followerCounts: { ...state.followerCounts, [artistId]: count } }));
    }
  },

  toggleFollow: async (artistId) => {
    const { followedArtists, fanId } = get();
    const newFollowed = new Set(followedArtists);
    if (newFollowed.has(artistId)) {
      newFollowed.delete(artistId);
      await supabase.from("follows").delete().eq("fan_id", fanId).eq("artist_id", artistId);
    } else {
      newFollowed.add(artistId);
      await supabase.from("follows").insert({ fan_id: fanId, artist_id: artistId });
    }
    set({ followedArtists: newFollowed });
    get().fetchFollowerCount(artistId);
  },

  toggleSubscribe: (artistId) => {
    const { subscribedArtists } = get();
    const newSubscribed = new Set(subscribedArtists);
    if (newSubscribed.has(artistId)) newSubscribed.delete(artistId);
    else newSubscribed.add(artistId);
    set({ subscribedArtists: newSubscribed });
  },

  addComment: (postId, text) => {
    const { supabaseArtistId, myName, myAvatar } = get();
    const artist = supabaseArtistId ? artists.find((a) => a.id === supabaseArtistId) : null;
    const newComment: Comment = {
      id: `c${Date.now()}`,
      postId,
      userId: supabaseArtistId ?? "me",
      userName: artist ? artist.name : myName,
      userAvatar: artist ? (get().getArtistAvatar(supabaseArtistId!) ?? artist.avatar) : myAvatar,
      text,
      createdAt: new Date().toISOString(),
    };
    set({ comments: [...get().comments, newComment] });
  },

  setMyProfile: (avatar, name) => set({ myAvatar: avatar, myName: name }),

  markNotificationsRead: () => {
    set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  sendMessage: (artistId, text) => {
    const { supabaseArtistId, authInitialized } = get();
    const isArtistMode = authInitialized && supabaseArtistId === artistId;
    const newMsg: ChatMessage = {
      id: `msg${Date.now()}`,
      artistId,
      fromMe: !isArtistMode,
      text,
      createdAt: new Date().toISOString(),
    };
    set({ chatMessages: [...get().chatMessages, newMsg] });
    if (!isArtistMode) {
      const replies = [
        "ありがとう！嬉しいな😊",
        "いつも応援ありがとう🎵",
        "最高だね！",
        "次のライブで会おう！",
        "感謝してます！",
      ];
      const replyMsg: ChatMessage = {
        id: `msg${Date.now() + 1}`,
        artistId,
        fromMe: false,
        text: replies[Math.floor(Math.random() * replies.length)],
        createdAt: new Date(Date.now() + 1500).toISOString(),
      };
      setTimeout(() => {
        set({ chatMessages: [...get().chatMessages, replyMsg] });
      }, 1500);
    }
  },

  markChatRead: (artistId) => {
    const newUnread = new Set(get().unreadChats);
    newUnread.delete(artistId);
    set({ unreadChats: newUnread });
  },

  isLiked: (postId) => get().likedPosts.has(postId),
  isFollowed: (artistId) => get().followedArtists.has(artistId),
  isSubscribed: (artistId) => get().subscribedArtists.has(artistId),
  getLikeCount: (postId) => get().likeCount[postId] || 0,
  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
  getTotalUnreadChats: () => get().unreadChats.size,
  getLastMessage: (artistId) => {
    const msgs = get().chatMessages.filter((m) => m.artistId === artistId);
    return msgs[msgs.length - 1];
  },
}), {
  name: "syne-chat-storage",
  partialize: (state) => ({ chatMessages: state.chatMessages, fanId: state.fanId }),
}));
