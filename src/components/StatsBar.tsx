"use client";

import { useEffect, useState } from "react";

type PlatformStat = {
  platform: string;
  today: number;
  total_posted: number;
  total_pending: number;
  total_failed: number;
};

const PLATFORM_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  twitter: { emoji: "𝕏", label: "Twitter / X", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  threads: { emoji: "⊕", label: "Threads", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  facebook: { emoji: "f", label: "Facebook", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  reddit: { emoji: "r/", label: "Reddit", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
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
        const cfg = PLATFORM_CONFIG[s.platform] ?? { emoji: s.platform, label: s.platform, color: "text-primary", bg: "bg-primary/10 border-primary/20" };
        const pct = Math.min(100, Math.round((s.today / DAILY_TARGET) * 100));
        const isGoalMet = s.today >= DAILY_TARGET;

        return (
          <div
            key={s.platform}
            className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3 hover:border-border transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm font-bold font-mono ${cfg.bg} ${cfg.color}`}>
                {cfg.emoji}
              </div>
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${isGoalMet ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-muted/60 text-muted-foreground border border-border/50"}`}>
                {s.today}/{DAILY_TARGET}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{cfg.label}</p>
              <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isGoalMet ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 inline-block" />
                {s.total_pending}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 inline-block" />
                {s.total_posted}
              </span>
              {s.total_failed > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 inline-block" />
                  <span className="text-red-400">{s.total_failed}</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
