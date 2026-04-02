"use client";

import { create } from "zustand";
import { posts as initialPosts, comments as initialComments, notifications as initialNotifications } from "@/data/mockData";
import type { Comment, Notification } from "@/data/mockData";

type AppStore = {
  likedPosts: Set<string>;
  followedArtists: Set<string>;
  subscribedArtists: Set<string>;
  likeCount: Record<string, number>;
  comments: Comment[];
  notifications: Notification[];
  activeTab: string;

  toggleLike: (postId: string) => void;
  toggleFollow: (artistId: string) => void;
  toggleSubscribe: (artistId: string) => void;
  addComment: (postId: string, text: string) => void;
  markNotificationsRead: () => void;
  setActiveTab: (tab: string) => void;

  isLiked: (postId: string) => boolean;
  isFollowed: (artistId: string) => boolean;
  isSubscribed: (artistId: string) => boolean;
  getLikeCount: (postId: string) => number;
  getUnreadCount: () => number;
};

export const useAppStore = create<AppStore>((set, get) => ({
  likedPosts: new Set(),
  followedArtists: new Set(["ziou"]),
  subscribedArtists: new Set(),
  likeCount: Object.fromEntries(initialPosts.map((p) => [p.id, p.likes])),
  comments: initialComments,
  notifications: initialNotifications,
  activeTab: "home",

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

  isLiked: (postId) => get().likedPosts.has(postId),
  isFollowed: (artistId) => get().followedArtists.has(artistId),
  isSubscribed: (artistId) => get().subscribedArtists.has(artistId),
  getLikeCount: (postId) => get().likeCount[postId] || 0,
  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
