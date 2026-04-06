"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignForm } from "@/components/CampaignForm";
import { StatsBar } from "@/components/StatsBar";
import { PostList } from "@/components/PostList";
import { PlatformSettings } from "@/components/PlatformSettings";
import { Megaphone } from "lucide-react";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Social Marketer</span>
          </div>
          <span className="text-xs text-muted-foreground">
            X · Threads · Facebook · Reddit 자동 홍보
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <StatsBar refreshKey={refreshKey} />

        <Tabs defaultValue="campaign">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaign">캠페인</TabsTrigger>
            <TabsTrigger value="posts">게시글 관리</TabsTrigger>
            <TabsTrigger value="settings">API 설정</TabsTrigger>
          </TabsList>

          <TabsContent value="campaign" className="mt-4">
            <CampaignForm onCreated={refresh} />
          </TabsContent>

          <TabsContent value="posts" className="mt-4">
            <PostList refreshKey={refreshKey} onPosted={refresh} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
