"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import type { Post } from "@/lib/db";

type PostWithActions = Post & { sending?: boolean };

type Props = { campaignId?: number; refreshKey: number; onPosted: () => void };

const STATUS_BADGE: Record<string, string> = {
  pending: "secondary",
  posted: "default",
  failed: "destructive",
};

const PLATFORM_LABEL: Record<string, string> = {
  twitter: "𝕏 Twitter",
  threads: "⊕ Threads",
  facebook: "f Facebook",
  reddit: "r/ Reddit",
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
        <div className="space-y-1">
          <p className="font-medium text-sm">{title.trim()}</p>
          <p className="text-xs text-muted-foreground line-clamp-3">{body.trim()}</p>
        </div>
      );
    }
    return <p className="text-sm line-clamp-4">{post.content}</p>;
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">홍보글 목록</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchPosts}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={platform} onValueChange={(v) => setPlatform(v ?? "all")}>
            <SelectTrigger className="w-36 h-8 text-xs">
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
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="posted">게시완료</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
        {posts.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            {loading ? "로딩 중..." : "게시글이 없습니다"}
          </p>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            className="rounded-md border border-border bg-card p-3 space-y-2 hover:border-border/80 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {PLATFORM_LABEL[post.platform] ?? post.platform}
                </span>
                <Badge variant={STATUS_BADGE[post.status] as "default" | "secondary" | "destructive"} className="text-xs h-4">
                  {post.status === "pending" ? "대기" : post.status === "posted" ? "완료" : "실패"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {post.post_url && (
                  <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
                {post.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
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
            {displayContent(post)}
            {post.hashtags && (
              <p className="text-xs text-primary/70 font-mono">{post.hashtags}</p>
            )}
            {post.error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                {post.error}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
