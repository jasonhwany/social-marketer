"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PlatformStat = {
  platform: string;
  today: number;
  total_posted: number;
  total_pending: number;
  total_failed: number;
};

const PLATFORM_EMOJI: Record<string, string> = {
  twitter: "𝕏",
  threads: "⊕",
  facebook: "f",
  reddit: "r/",
};

const DAILY_TARGET = 15;

type Props = { refreshKey: number };

export function StatsBar({ refreshKey }: Props) {
  const [stats, setStats] = useState<PlatformStat[]>([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.platforms ?? []))
      .catch(() => null);
  }, [refreshKey]);

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => {
        const pct = Math.min(100, Math.round((s.today / DAILY_TARGET) * 100));
        return (
          <Card key={s.platform} className="border-border">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-primary">
                  {PLATFORM_EMOJI[s.platform]}
                </span>
                <Badge variant={s.today >= DAILY_TARGET ? "default" : "secondary"} className="text-xs">
                  오늘 {s.today}/{DAILY_TARGET}
                </Badge>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>대기 {s.total_pending}</span>
                <span>·</span>
                <span>완료 {s.total_posted}</span>
                {s.total_failed > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-destructive">실패 {s.total_failed}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
