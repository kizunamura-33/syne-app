"use client";

import { create } from "zustand";
import { posts as initialPosts, comments as initialComments, notifications as initialNotifications, artists } from "@/data/mockData";
import type { Comment, Notification } from "@/data/mockData";

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

  toggleLike: (postId: string) => void;
  toggleFollow: (artistId: string) => void;
  toggleSubscribe: (artistId: string) => void;
  addComment: (postId: string, text: string) => void;
  markNotificationsRead: () => void;
  setActiveTab: (tab: string) => void;
  sendMessage: (artistId: string, text: string) => void;
  markChatRead: (artistId: string) => void;

  isLiked: (postId: string) => boolean;
  isFollowed: (artistId: string) => boolean;
  isSubscribed: (artistId: string) => boolean;
  getLikeCount: (postId: string) => number;
  getUnreadCount: () => number;
  getTotalUnreadChats: () => number;
  getLastMessage: (artistId: string) => ChatMessage | undefined;
};

export const useAppStore = create<AppStore>((set, get) => ({
  likedPosts: new Set(),
  followedArtists: new Set(["ziou"]),
  subscribedArtists: new Set(),
  likeCount: Object.fromEntries(initialPosts.map((p) => [p.id, p.likes])),
  comments: initialComments,
  notifications: initialNotifications,
  activeTab: "home",
  chatMessages: initialMessages,
  unreadChats: new Set(["ziou", "haruki"]),

  toggleLike: (postId) => {
    const { likedPosts, likeCount } = get();
    const isLiked = likedPosts.has(postId);
    const newLiked = new Set(likedPosts);
    if (isLiked) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    set({
      likedPosts: newLiked,
      likeCount: {
        ...likeCount,
        [postId]: (likeCount[postId] || 0) + (isLiked ? -1 : 1),
      },
    });
  },

  toggleFollow: (artistId) => {
    const { followedArtists } = get();
    const newFollowed = new Set(followedArtists);
    if (newFollowed.has(artistId)) {
      newFollowed.delete(artistId);
    } else {
      newFollowed.add(artistId);
    }
    set({ followedArtists: newFollowed });
  },

  toggleSubscribe: (artistId) => {
    const { subscribedArtists } = get();
    const newSubscribed = new Set(subscribedArtists);
    if (newSubscribed.has(artistId)) {
      newSubscribed.delete(artistId);
    } else {
      newSubscribed.add(artistId);
    }
    set({ subscribedArtists: newSubscribed });
  },

  addComment: (postId, text) => {
    const newComment: Comment = {
      id: `c${Date.now()}`,
      postId,
      userId: "me",
      userName: "あなた",
      userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop",
      text,
      createdAt: new Date().toISOString(),
    };
    set({ comments: [...get().comments, newComment] });
  },

  markNotificationsRead: () => {
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  sendMessage: (artistId, text) => {
    const newMsg: ChatMessage = {
      id: `msg${Date.now()}`,
      artistId,
      fromMe: true,
      text,
      createdAt: new Date().toISOString(),
    };
    // Simulate artist reply after 1.5s
    const artist = artists.find((a) => a.id === artistId);
    const replies = [
      "ありがとう！嬉しいな😊",
      "いつも応援ありがとう🎵",
      "最高だね！",
      "次のライブで会おう！",
      "感謝してます！",
    ];
    const replyText = replies[Math.floor(Math.random() * replies.length)];
    const replyMsg: ChatMessage = {
      id: `msg${Date.now() + 1}`,
      artistId,
      fromMe: false,
      text: replyText,
      createdAt: new Date(Date.now() + 1500).toISOString(),
    };
    set({ chatMessages: [...get().chatMessages, newMsg] });
    setTimeout(() => {
      set({ chatMessages: [...get().chatMessages, replyMsg] });
    }, 1500);
  },

  markChatRead: (artistId) => {
    const { unreadChats } = get();
    const newUnread = new Set(unreadChats);
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
}));
