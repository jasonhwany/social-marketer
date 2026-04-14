"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Check, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type FieldDef = { key: string; label: string; placeholder: string };

const PLATFORM_FIELDS: Record<string, FieldDef[]> = {
  twitter: [
    { key: "appKey", label: "App Key (Consumer Key)", placeholder: "API key" },
    { key: "appSecret", label: "App Secret", placeholder: "API secret" },
    { key: "accessToken", label: "Access Token", placeholder: "Access token" },
    { key: "accessSecret", label: "Access Secret", placeholder: "Access token secret" },
  ],
  threads: [
    { key: "userId", label: "User ID", placeholder: "Threads user ID" },
    { key: "accessToken", label: "Access Token", placeholder: "Long-lived access token" },
  ],
  facebook: [
    { key: "pageId", label: "Page ID", placeholder: "Facebook page ID" },
    { key: "pageAccessToken", label: "Page Access Token", placeholder: "Page access token" },
  ],
  reddit: [
    { key: "clientId", label: "Client ID", placeholder: "Reddit app client ID" },
    { key: "clientSecret", label: "Client Secret", placeholder: "Reddit app client secret" },
    { key: "username", label: "Username", placeholder: "Reddit username" },
    { key: "password", label: "Password", placeholder: "Reddit password" },
    { key: "subreddit", label: "Subreddit", placeholder: "e.g. webdev (without r/)" },
  ],
};

const PLATFORM_META: Record<string, { label: string; emoji: string; desc: string; style: string; activeStyle: string }> = {
  twitter:  { label: "X / Twitter", emoji: "𝕏", desc: "OAuth 1.0a", style: "text-sky-400", activeStyle: "border-sky-500/40 bg-sky-500/5" },
  threads:  { label: "Threads", emoji: "⊕", desc: "Meta API", style: "text-purple-400", activeStyle: "border-purple-500/40 bg-purple-500/5" },
  facebook: { label: "Facebook", emoji: "f", desc: "Graph API", style: "text-blue-400", activeStyle: "border-blue-500/40 bg-blue-500/5" },
  reddit:   { label: "Reddit", emoji: "r/", desc: "OAuth 2.0", style: "text-orange-400", activeStyle: "border-orange-500/40 bg-orange-500/5" },
};

export function PlatformSettings() {
  const [configured, setConfigured] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const loadSettings = () => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setConfigured(d.configured ?? []))
      .catch(() => null);
  };

  useEffect(() => { loadSettings(); }, []);

  const handleFieldChange = (platform: string, key: string, value: string) => {
    setForms((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] ?? {}), [key]: value },
    }));
  };

  const handleSave = async (platform: string) => {
    const config = forms[platform] ?? {};
    const fields = PLATFORM_FIELDS[platform] ?? [];
    const missing = fields.filter((f) => !config[f.key]);
    if (missing.length > 0) {
      return toast.error(`필수 항목: ${missing.map((f) => f.label).join(", ")}`);
    }

    setSaving(platform);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "알 수 없는 오류");
      toast.success(`${PLATFORM_META[platform]?.label} 설정 저장 완료`);
      loadSettings();
      setExpanded(null);
    } catch (e) {
      toast.error(`저장 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (platform: string) => {
    await fetch("/api/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    toast.success("설정 삭제됨");
    loadSettings();
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">플랫폼 API 설정</h2>
            <p className="text-xs text-muted-foreground">각 SNS 플랫폼의 API 인증 정보를 입력하세요</p>
          </div>
        </div>
      </div>

      {/* Platform List */}
      <div className="divide-y divide-border/30">
        {Object.keys(PLATFORM_FIELDS).map((platform) => {
          const isConfigured = configured.includes(platform);
          const isExpanded = expanded === platform;
          const meta = PLATFORM_META[platform];

          return (
            <div key={platform}>
              <button
                className={`w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors text-left ${isExpanded ? meta.activeStyle : ""}`}
                onClick={() => setExpanded(isExpanded ? null : platform)}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-base font-bold font-mono w-6 ${meta.style}`}>{meta.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">{meta.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConfigured ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> 연결됨
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">
                      미설정
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-3 space-y-3 bg-muted/10 border-t border-border/30">
                  {PLATFORM_FIELDS[platform].map((field) => (
                    <div key={field.key}>
                      <Label className="text-xs text-muted-foreground">{field.label}</Label>
                      <Input
                        type={field.key.toLowerCase().includes("secret") || field.key === "password" ? "password" : "text"}
                        placeholder={field.placeholder}
                        value={forms[platform]?.[field.key] ?? ""}
                        onChange={(e) => handleFieldChange(platform, field.key, e.target.value)}
                        className="mt-1 h-8 text-xs font-mono bg-muted/30 border-border/60 focus:border-primary/50"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleSave(platform)}
                      disabled={saving === platform}
                      className="h-8 text-xs"
                    >
                      {saving === platform ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />저장 중</>
                      ) : "저장"}
                    </Button>
                    {isConfigured && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(platform)}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />삭제
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
