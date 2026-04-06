import { NextResponse } from 'next/server';
import { getDb, PLATFORMS } from '@/lib/db';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    const db = getDb();

    const today = db
      .prepare(
        `SELECT platform, COALESCE(posted_count, 0) as count
         FROM daily_stats WHERE date = date('now')`
      )
      .all() as { platform: string; count: number }[];

    const totals = db
      .prepare(
        `SELECT platform, status, COUNT(*) as count
         FROM posts GROUP BY platform, status`
      )
      .all() as { platform: string; status: string; count: number }[];

    const platformStats = PLATFORMS.map((p) => ({
      platform: p,
      today: today.find((r) => r.platform === p)?.count ?? 0,
      total_posted: totals.find((r) => r.platform === p && r.status === 'posted')?.count ?? 0,
      total_pending: totals.find((r) => r.platform === p && r.status === 'pending')?.count ?? 0,
      total_failed: totals.find((r) => r.platform === p && r.status === 'failed')?.count ?? 0,
    }));

    return NextResponse.json({ platforms: platformStats });
  } catch (err) {
    log.error('stats:error', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
