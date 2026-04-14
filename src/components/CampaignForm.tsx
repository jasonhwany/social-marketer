"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Globe, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { PLATFORMS } from "@/lib/constants";
import type { Platform } from "@/lib/constants";

type Props = { onCreated: () => void };

const PLATFORM_CONFIG: Record<Platform, { label: string; emoji: string; color: string; active: string }> = {
  twitter: { label: "X (Twitter)", emoji: "𝕏", color: "border-sky-500/40 text-sky-400", active: "bg-sky-500/15 border-sky-500/60 text-sky-300" },
  threads: { label: "Threads", emoji: "⊕", color: "border-purple-500/40 text-purple-400", active: "bg-purple-500/15 border-purple-500/60 text-purple-300" },
  facebook: { label: "Facebook", emoji: "f", color: "border-blue-500/40 text-blue-400", active: "bg-blue-500/15 border-blue-500/60 text-blue-300" },
  reddit: { label: "Reddit", emoji: "r/", color: "border-orange-500/40 text-orange-400", active: "bg-orange-500/15 border-orange-500/60 text-orange-300" },
};

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

  return (
    <div className="space-y-4">
      {/* URL Input Section */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">새 캠페인</h2>
            <p className="text-xs text-muted-foreground">홍보할 서비스 URL을 입력하면 AI가 자동으로 홍보글을 생성합니다</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="pl-9 h-10 bg-muted/30 border-border/60 focus:border-primary/50 text-sm"
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={loading !== null}
            variant="secondary"
            className="h-10 px-5 text-sm font-medium"
          >
            {loading === "analyze" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>분석 <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></>
            )}
          </Button>
        </div>
      </div>

      {/* Scraped Preview */}
      {scraped && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm text-foreground">{scraped.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{scraped.description}</p>
          </div>
        </div>
      )}

      {/* Platform & Generate Section */}
      {campaignId && (
        <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-5">
          {/* Platform Selection */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">플랫폼 선택</Label>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {PLATFORMS.map((p) => {
                const cfg = PLATFORM_CONFIG[p];
                const isActive = selectedPlatforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all duration-150 ${
                      isActive ? cfg.active : `bg-transparent ${cfg.color} hover:bg-muted/30`
                    }`}
                  >
                    <span className="font-mono">{cfg.emoji}</span>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Count + Generate */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">플랫폼당</Label>
              <div className="flex items-center">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={postsPerPlatform}
                  onChange={(e) => setPostsPerPlatform(Number(e.target.value))}
                  className="w-16 h-8 text-sm text-center bg-muted/30 border-border/60"
                />
                <span className="ml-2 text-xs text-muted-foreground">개</span>
              </div>
              <span className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
                총 <span className="text-foreground font-medium">{selectedPlatforms.length * postsPerPlatform}</span>개
              </span>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading !== null || selectedPlatforms.length === 0}
              className="h-9 px-5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading === "generate" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  AI 홍보글 생성
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
