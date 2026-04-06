import { NextRequest, NextResponse } from 'next/server';
import { getDb, type Campaign } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const campaigns = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM posts p WHERE p.campaign_id = c.id) as total_posts,
        (SELECT COUNT(*) FROM posts p WHERE p.campaign_id = c.id AND p.status = 'posted') as posted_count,
        (SELECT COUNT(*) FROM posts p WHERE p.campaign_id = c.id AND p.status = 'pending') as pending_count
       FROM campaigns c ORDER BY c.created_at DESC`
    )
    .all();
  return NextResponse.json(campaigns);
}

export async function DELETE(req: NextRequest) {
  const { id } = (await req.json()) as { id: number };
  const db = getDb();
  db.prepare('DELETE FROM posts WHERE campaign_id = ?').run(id);
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = (await req.json()) as { id: number; is_active: number };
  const db = getDb();
  db.prepare('UPDATE campaigns SET is_active = ? WHERE id = ?').run(is_active, id);
  return NextResponse.json({ ok: true });
}
