import { NextRequest, NextResponse } from 'next/server';
import { getSql, initSchema, PLATFORMS } from '@/lib/db';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    const sql = getSql();
    await initSchema();
    const rows = await sql`SELECT platform, config, updated_at FROM platform_settings` as { platform: string; config: string; updated_at: string }[];

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
  } catch (err) {
    log.error('settings:get:error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { platform, config } = (await req.json()) as { platform: string; config: Record<string, string> };
    if (!platform || !config) return NextResponse.json({ error: 'platform and config required' }, { status: 400 });
    const sql = getSql();
    await initSchema();
    await sql`
      INSERT INTO platform_settings (platform, config, updated_at)
      VALUES (${platform}, ${JSON.stringify(config)}, NOW())
      ON CONFLICT (platform) DO UPDATE SET config = ${JSON.stringify(config)}, updated_at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('settings:post:error', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { platform } = (await req.json()) as { platform: string };
    const sql = getSql();
    await sql`DELETE FROM platform_settings WHERE platform = ${platform}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('settings:delete:error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
