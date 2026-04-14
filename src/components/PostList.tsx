"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Trash2, ExternalLink, RefreshCw, FileText } from "lucide-react";
import type { Post } from "@/lib/db";

type PostWithActions = Post & { sending?: boolean };

type Props = { campaignId?: number; refreshKey: number; onPosted: () => void };

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  pending: { label: "대기", style: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  posted:  { label: "완료", style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  failed:  { label: "실패", style: "bg-red-500/15 text-red-400 border-red-500/25" },
};

const PLATFORM_CONFIG: Record<string, { label: string; emoji: string; style: string }> = {
  twitter:  { label: "X", emoji: "𝕏", style: "bg-sky-500/15 text-sky-400 border-sky-500/25" },
  threads:  { label: "Threads", emoji: "⊕", style: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
  facebook: { label: "Facebook", emoji: "f", style: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  reddit:   { label: "Reddit", emoji: "r/", style: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
};

export function PostList({ campaignId, refreshKey, onPosted }: Props) {
  const [posts, setPosts] = useState<PostWithActions[]>([]);
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (campaignId) params.set("campaignId", String(campaignId));
    if (platform !== "all") params.set("platform", platform);
    if (status !== "all") params.set("status", status);

    fetch(`/api/posts?${params}`)
      .then((r) => r.json())
      .then((d) => setPosts(d))
      .catch(() => toast.error("포스트 로드 실패"))
      .finally(() => setLoading(false));
  }, [campaignId, platform, status]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshKey]);

  const handlePost = async (postId: number) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, sending: true } : p)));
    try {
      const res = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("게시 완료!");
        onPosted();
        fetchPosts();
      } else {
        toast.error(`게시 실패: ${data.error}`);
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, sending: false } : p)));
      }
    } catch {
      toast.error("게시 중 오류 발생");
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, sending: false } : p)));
    }
  };

  const handleDelete = async (postId: number) => {
    await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("삭제됨");
  };

  const displayContent = (post: Post) => {
    if (post.platform === "reddit" && post.content.includes("|||")) {
      const [title, body] = post.content.split("|||");
      return (
        <div className="space-y-1.5">
          <p className="font-medium text-sm leading-snug">{title.trim()}</p>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{body.trim()}</p>
        </div>
      );
    }
    return <p className="text-sm line-clamp-4 leading-relaxed text-foreground/90">{post.content}</p>;
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">홍보글 목록</h2>
        <div className="flex items-center gap-2">
          <Select value={platform} onValueChange={(v) => setPlatform(v ?? "all")}>
            <SelectTrigger className="w-34 h-8 text-xs bg-muted/30 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 플랫폼</SelectItem>
              <SelectItem value="twitter">𝕏 Twitter</SelectItem>
              <SelectItem value="threads">⊕ Threads</SelectItem>
              <SelectItem value="facebook">f Facebook</SelectItem>
              <SelectItem value="reddit">r/ Reddit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-24 h-8 text-xs bg-muted/30 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="posted">완료</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={fetchPosts} className="h-8 w-8 p-0">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border/30 max-h-[620px] overflow-y-auto">
        {posts.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <FileText className="h-8 w-8 opacity-30" />
            <p className="text-sm">{loading ? "로딩 중..." : "게시글이 없습니다"}</p>
          </div>
        )}
        {posts.map((post) => {
          const plat = PLATFORM_CONFIG[post.platform] ?? { label: post.platform, emoji: "?", style: "bg-muted/30 text-muted-foreground border-border/40" };
          const stat = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.pending;

          return (
            <div key={post.id} className="px-5 py-4 hover:bg-muted/20 transition-colors group">
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border font-mono ${plat.style}`}>
                    {plat.emoji} {plat.label}
                  </span>
                  <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-md border ${stat.style}`}>
                    {stat.label}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {post.post_url && (
                    <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  {post.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => handlePost(post.id)}
                      disabled={post.sending}
                    >
                      {post.sending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              {displayContent(post)}

              {/* Hashtags */}
              {post.hashtags && (
                <p className="text-xs text-primary/60 font-mono mt-2 leading-relaxed">{post.hashtags}</p>
              )}

              {/* Error */}
              {post.error && (
                <p className="text-xs text-red-400 bg-red-500/8 rounded-lg px-3 py-1.5 mt-2 border border-red-500/15">
                  {post.error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
