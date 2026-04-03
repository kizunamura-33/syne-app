"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function AuthInit() {
  const { initArtistAuth } = useAppStore();
  useEffect(() => {
    initArtistAuth();
  }, []);
  return null;
}
