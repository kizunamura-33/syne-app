import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// 環境変数未設定時はダミーURLで初期化（ログイン機能は無効）
const url = supabaseUrl.startsWith("http") ? supabaseUrl : "https://placeholder.supabase.co";
export const supabase = createClient(url, supabaseAnonKey || "placeholder");
export const isSupabaseConfigured = supabaseUrl.startsWith("http") && supabaseAnonKey.length > 10;

export type ArtistProfile = {
  artist_id: string;
  user_id: string;
  bio: string | null;
  avatar_data: string | null;
  updated_at: string;
};

export async function uploadMediaToSupabase(
  file: File,
  artistId: string,
  onProgress?: (p: number) => void
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `private/${artistId}/${Date.now()}.${ext}`;
  onProgress?.(10);
  const { error } = await supabase.storage.from("posts").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  onProgress?.(100);
  const { data } = supabase.storage.from("posts").getPublicUrl(path);
  return data.publicUrl;
}
