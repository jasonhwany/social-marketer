import { NextRequest, NextResponse } from 'next/server';
import { getSql, initSchema } from '@/lib/db';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    const sql = getSql();
    await initSchema();
    const rows = await sql`
      SELECT c.*,
        COUNT(p.id) as total_posts,
        COUNT(p.id) FILTER (WHERE p.status = 'posted') as posted_count,
        COUNT(p.id) FILTER (WHERE p.status = 'pending') as pending_count
      FROM campaigns c
      LEFT JOIN posts p ON p.campaign_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (err) {
    log.error('campaigns:get:error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id: number };
    const sql = getSql();
    await sql`DELETE FROM posts WHERE campaign_id = ${id}`;
    await sql`DELETE FROM campaigns WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('campaigns:delete:error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, is_active } = (await req.json()) as { id: number; is_active: number };
    const sql = getSql();
    await sql`UPDATE campaigns SET is_active = ${is_active} WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error('campaigns:patch:error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
