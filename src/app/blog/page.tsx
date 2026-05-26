import { PostCard } from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "博客",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">技术博客</h1>
        <p className="mt-2 text-slate-400">
          从 CSDN 迁移的原创技术文章，共 {posts.length} 篇
        </p>
      </div>
      {posts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">暂无文章。</p>
      )}
    </div>
  );
}
