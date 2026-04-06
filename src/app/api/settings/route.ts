import { NextRequest, NextResponse } from 'next/server';
import { getDb, PLATFORMS } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT platform, config, updated_at FROM platform_settings').all() as {
    platform: string;
    config: string;
    updated_at: string;
  }[];

  // Mask secrets before returning
  const masked = rows.map((r) => {
    const cfg = JSON.parse(r.config) as Record<string, string>;
    const safe: Record<string, string> = {};
    for (const [k, v] of Object.entries(cfg)) {
      safe[k] = v ? `${v.slice(0, 4)}${'*'.repeat(Math.max(0, v.length - 4))}` : '';
    }
    return { platform: r.platform, config: safe, updated_at: r.updated_at };
  });

  const configured = masked.map((r) => r.platform);
  const missing = PLATFORMS.filter((p) => !configured.includes(p));

  return NextResponse.json({ settings: masked, configured, missing });
}

export async function POST(req: NextRequest) {
  const { platform, config } = (await req.json()) as {
    platform: string;
    config: Record<string, string>;
  };

  if (!platform || !config) {
    return NextResponse.json({ error: 'platform and config required' }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    `INSERT INTO platform_settings (platform, config, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(platform) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at`
  ).run(platform, JSON.stringify(config));

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { platform } = (await req.json()) as { platform: string };
  getDb().prepare('DELETE FROM platform_settings WHERE platform = ?').run(platform);
  return NextResponse.json({ ok: true });
}
