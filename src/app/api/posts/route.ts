import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { log } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const sql = getSql();

    let rows;
    if (campaignId && platform && status) {
      rows = await sql`SELECT * FROM posts WHERE campaign_id = ${Number(campaignId)} AND platform = ${platform} AND status = ${status} ORDER BY created_at DESC LIMIT 200`;
    } else if (campaignId && platform) {
      rows = await sql`SELECT * FROM posts WHERE campaign_id = ${Number(campaignId)} AND platform = ${platform} ORDER BY created_at DESC LIMIT 200`;
    } else if (campaignId && status) {
      rows = await sql`SELECT * FROM posts WHERE campaign_id = ${Number(campaignId)} AND status = ${status} ORDER BY created_at DESC LIMIT 200`;
    } else if (platform && status) {
      rows = await sql`SELECT * FROM posts WHERE platform = ${platform} AND status = ${status} ORDER BY created_at DESC LIMIT 200`;
    } else if (campaignId) {
      rows = await sql`SELECT * FROM posts WHERE campaign_id = ${Number(campaignId)} ORDER BY created_at DESC LIMIT 200`;
    } else if (platform) {
      rows = await sql`SELECT * FROM posts WHERE platform = ${platform} ORDER BY created_at DESC LIMIT 200`;
    } else if (status) {
      rows = await sql`SELECT * FROM posts WHERE status = ${status} ORDER BY created_at DESC LIMIT 200`;
    } else {
      rows = await sql`SELECT * FROM posts ORDER BY created_at DESC LIMIT 200`;
    }

    return NextResponse.json(rows);
  } catch (err) {
    log.error('posts:get:error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id: number };
    const sql = getSql();
    await sql`DELETE FROM posts WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('posts:delete:error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
