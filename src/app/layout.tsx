import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AuthInit from "@/components/AuthInit";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SYNE — アーティスト × ファンの最短距離",
  description: "アーティストとファンを繋ぐ次世代プラットフォーム",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-[#050505] text-white antialiased">
        <AuthProvider>
          <div className="max-w-md mx-auto min-h-screen relative">
            <AuthInit />
            <main className="pb-20">{children}</main>
            <BottomNav />
          </div>
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: "#1a1a1a",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              fontWeight: 600,
              padding: "12px 20px",
            },
            success: {
              iconTheme: { primary: "#9333ea", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ec4899", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
