import { PostCard } from "@/components/PostCard";
import { PageHeader } from "@/components/PageHeader";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "博客",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="site-container py-12 md:py-16">
      <PageHeader
        label="Blog"
        title="技术博客"
        description={`从 CSDN 迁移的原创技术文章，共 ${posts.length} 篇，涵盖前端、地图 GIS、移动端与架构等主题。`}
      />
      {posts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="glass-card p-10 text-center text-muted">暂无文章。</p>
      )}
    </div>
  );
}
