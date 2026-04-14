"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignForm } from "@/components/CampaignForm";
import { StatsBar } from "@/components/StatsBar";
import { PostList } from "@/components/PostList";
import { PlatformSettings } from "@/components/PlatformSettings";
import { Zap, LayoutGrid, Settings2 } from "lucide-react";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/40 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Social Marketer</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
              AI-Powered
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
        </div>
      </header>

      {/* Hero gradient */}
      <div className="absolute top-14 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-7">
        <StatsBar refreshKey={refreshKey} />

        <Tabs defaultValue="campaign">
          <TabsList className="h-10 p-1 bg-muted/40 border border-border/50 rounded-xl gap-0.5">
            <TabsTrigger
              value="campaign"
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <Zap className="h-3.5 w-3.5" />
              캠페인
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              게시글
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <Settings2 className="h-3.5 w-3.5" />
              설정
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaign" className="mt-5">
            <CampaignForm onCreated={refresh} />
          </TabsContent>

          <TabsContent value="posts" className="mt-5">
            <PostList refreshKey={refreshKey} onPosted={refresh} />
          </TabsContent>

          <TabsContent value="settings" className="mt-5">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
