"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

// Supabaseアーティスト認証の初期化（既存機能を維持）
export default function AuthInit() {
  const { initArtistAuth } = useAppStore();
  useEffect(() => {
    initArtistAuth();
  }, [initArtistAuth]);
  return null;
}
