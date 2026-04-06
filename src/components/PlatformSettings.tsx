"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Check, X, ChevronDown, ChevronUp } from "lucide-react";

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

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "𝕏 Twitter / X",
  threads: "⊕ Threads",
  facebook: "f Facebook",
  reddit: "r/ Reddit",
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
      if (!res.ok) throw new Error();
      toast.success(`${PLATFORM_LABELS[platform]} 설정 저장 완료`);
      loadSettings();
      setExpanded(null);
    } catch {
      toast.error("저장 실패");
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
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4 text-primary" />
          플랫폼 API 설정
        </CardTitle>
        <CardDescription>각 SNS 플랫폼의 API 인증 정보를 입력하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.keys(PLATFORM_FIELDS).map((platform) => {
          const isConfigured = configured.includes(platform);
          const isExpanded = expanded === platform;

          return (
            <div key={platform} className="rounded-md border border-border overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : platform)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{PLATFORM_LABELS[platform]}</span>
                  {isConfigured ? (
                    <Badge className="text-xs h-4 gap-1">
                      <Check className="h-2.5 w-2.5" /> 연결됨
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs h-4">미설정</Badge>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                  {PLATFORM_FIELDS[platform].map((field) => (
                    <div key={field.key}>
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        type={field.key.toLowerCase().includes("secret") || field.key === "password" ? "password" : "text"}
                        placeholder={field.placeholder}
                        value={forms[platform]?.[field.key] ?? ""}
                        onChange={(e) => handleFieldChange(platform, field.key, e.target.value)}
                        className="mt-1 h-8 text-sm font-mono"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(platform)}
                      disabled={saving === platform}
                    >
                      {saving === platform ? "저장 중..." : "저장"}
                    </Button>
                    {isConfigured && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(platform)}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> 삭제
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
