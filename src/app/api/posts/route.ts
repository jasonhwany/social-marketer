import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');

  const db = getDb();
  let query = 'SELECT * FROM posts WHERE 1=1';
  const params: unknown[] = [];

  if (campaignId) { query += ' AND campaign_id = ?'; params.push(Number(campaignId)); }
  if (platform)   { query += ' AND platform = ?';    params.push(platform); }
  if (status)     { query += ' AND status = ?';      params.push(status); }

  query += ' ORDER BY created_at DESC LIMIT 200';
  return NextResponse.json(db.prepare(query).all(...params));
}

export async function DELETE(req: NextRequest) {
  const { id } = (await req.json()) as { id: number };
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
