import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ArtistModeBanner from "@/components/ArtistModeBanner";
import AuthInit from "@/components/AuthInit";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SYNE",
  description: "アーティスト × ファンを最短距離で繋ぐ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <div className="max-w-md mx-auto min-h-screen relative">
          <AuthInit />
          <ArtistModeBanner />
          <main className="pb-20">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
