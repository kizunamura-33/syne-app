import { posts } from "@/data/mockData";
import PostCard from "@/components/PostCard";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
          SYNE
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">フォロー中</span>
        </div>
      </header>

      {/* Feed */}
      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
