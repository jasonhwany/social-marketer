"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Sparkles } from "lucide-react";
import { PLATFORMS } from "@/lib/constants";
import type { Platform } from "@/lib/constants";

type Props = { onCreated: () => void };

export function CampaignForm({ onCreated }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState<"analyze" | "generate" | null>(null);
  const [scraped, setScraped] = useState<{ title: string; description: string } | null>(null);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([...PLATFORMS]);
  const [postsPerPlatform, setPostsPerPlatform] = useState(10);

  const handleAnalyze = async () => {
    if (!url.trim()) return toast.error("URL을 입력해주세요");
    setLoading("analyze");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setScraped(data.scraped);
      setCampaignId(data.campaignId);
      toast.success("페이지 분석 완료!");
    } catch (e) {
      toast.error(`분석 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerate = async () => {
    if (!campaignId) return;
    if (selectedPlatforms.length === 0) return toast.error("플랫폼을 선택해주세요");
    setLoading("generate");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, platforms: selectedPlatforms, postsPerPlatform }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const total = Object.values(data.generated as Record<string, number>).reduce((a, b) => a + b, 0);
      toast.success(`${total}개의 홍보글 생성 완료!`);
      onCreated();
      setUrl("");
      setScraped(null);
      setCampaignId(null);
    } catch (e) {
      toast.error(`생성 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(null);
    }
  };

  const togglePlatform = (p: Platform) =>
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const PLATFORM_LABELS: Record<Platform, string> = {
    twitter: "X (Twitter)",
    threads: "Threads",
    facebook: "Facebook",
    reddit: "Reddit",
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          새 캠페인 시작
        </CardTitle>
        <CardDescription>홍보할 서비스 URL을 입력하면 AI가 자동으로 홍보글을 생성합니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="url">서비스 URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAnalyze} disabled={loading !== null} variant="secondary">
              {loading === "analyze" ? <Loader2 className="h-4 w-4 animate-spin" /> : "분석"}
            </Button>
          </div>
        </div>

        {scraped && (
          <div className="rounded-md border border-border bg-card p-3 space-y-1">
            <p className="font-medium text-sm">{scraped.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{scraped.description}</p>
          </div>
        )}

        {campaignId && (
          <div className="space-y-3">
            <div>
              <Label>플랫폼 선택</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedPlatforms.includes(p)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {PLATFORM_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="count" className="whitespace-nowrap">플랫폼당 게시글 수</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={30}
                value={postsPerPlatform}
                onChange={(e) => setPostsPerPlatform(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground">
                총 {selectedPlatforms.length * postsPerPlatform}개 생성
              </span>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === "generate" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  AI 홍보글 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  홍보글 자동 생성
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
